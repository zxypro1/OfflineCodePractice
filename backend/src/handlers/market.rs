use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{Problem, ProblemUpload};
use crate::error::AppError;
use crate::auth::Claims;

#[derive(Deserialize)]
pub struct PaginationParams {
    #[serde(default = "default_page")]
    pub page: i64,
    #[serde(default = "default_limit")]
    pub limit: i64,
}

fn default_page() -> i64 { 1 }
fn default_limit() -> i64 { 20 }

#[derive(Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub page: i64,
    pub limit: i64,
    pub total: i64,
    pub total_pages: i64,
}

pub async fn list_problems(
    State(pool): State<PgPool>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<PaginatedResponse<Problem>>, AppError> {
    // Validate and limit pagination parameters
    let page = params.page.max(1);
    let limit = params.limit.clamp(1, 100); // Max 100 items per page
    let offset = (page - 1) * limit;
    
    // Get total count
    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM problems"
    )
    .fetch_one(&pool)
    .await?;
    
    let total_count = total.0;
    let total_pages = (total_count + limit - 1) / limit;
    
    // Fetch paginated problems
    let problems = sqlx::query_as::<_, Problem>(
        "SELECT * FROM problems ORDER BY created_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&pool)
    .await?;
    
    tracing::info!(
        page = page,
        limit = limit,
        total = total_count,
        returned = problems.len(),
        "Listed problems with pagination"
    );

    Ok(Json(PaginatedResponse {
        data: problems,
        page,
        limit,
        total: total_count,
        total_pages,
    }))
}

pub async fn upload_problem(
    claims: Claims,
    State(pool): State<PgPool>,
    Json(payload): Json<ProblemUpload>,
) -> Result<Json<Problem>, AppError> {
    let user_id = claims.sub;

    let problem = sqlx::query_as::<_, Problem>(
        r#"
        INSERT INTO problems (id, user_id, title, content, tags, difficulty, download_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        "#
    )
    .bind(Uuid::new_v4())
    .bind(user_id)
    .bind(payload.title)
    .bind(payload.content)
    .bind(payload.tags)
    .bind(payload.difficulty)
    .bind(0)
    .fetch_one(&pool)
    .await?;

    Ok(Json(problem))
}

pub async fn download_problem(
    _claims: Claims,
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<Json<Problem>, AppError> {
    // 1. Increment download count
    sqlx::query("UPDATE problems SET download_count = download_count + 1 WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    // 2. Fetch problem
    let problem = sqlx::query_as::<_, Problem>("SELECT * FROM problems WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Problem not found".into()))?;

    Ok(Json(problem))
}

