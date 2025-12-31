use axum::{
    extract::{Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use crate::error::AppError;
use crate::auth::{create_jwt, hash_password, verify_password};
use crate::models::User;

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

// SECURITY: Input validation helper
fn validate_register_input(req: &RegisterRequest) -> Result<(), AppError> {
    // Username validation
    if req.username.len() < 3 || req.username.len() > 30 {
        return Err(AppError::BadRequest("Username must be 3-30 characters".into()));
    }
    
    if !req.username.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-') {
        return Err(AppError::BadRequest("Username can only contain letters, numbers, underscore and hyphen".into()));
    }
    
    // Email validation (basic)
    if !req.email.contains('@') || req.email.len() > 255 {
        return Err(AppError::BadRequest("Invalid email format".into()));
    }
    
    // Password validation
    if req.password.len() < 8 {
        return Err(AppError::BadRequest("Password must be at least 8 characters".into()));
    }
    
    if req.password.len() > 128 {
        return Err(AppError::BadRequest("Password is too long".into()));
    }
    
    // Check password strength
    let has_uppercase = req.password.chars().any(|c| c.is_uppercase());
    let has_lowercase = req.password.chars().any(|c| c.is_lowercase());
    let has_digit = req.password.chars().any(|c| c.is_numeric());
    
    if !has_uppercase || !has_lowercase || !has_digit {
        return Err(AppError::BadRequest(
            "Password must contain at least one uppercase letter, one lowercase letter, and one number".into()
        ));
    }
    
    Ok(())
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub username: String,
}

pub async fn register(
    State(pool): State<PgPool>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // SECURITY: Validate input before processing
    validate_register_input(&payload)?;
    
    tracing::info!(
        username = %payload.username,
        email = %payload.email,
        "Registration attempt"
    );
    
    let password_hash = hash_password(&payload.password)?;
    
    let result = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING *
        "#
    )
    .bind(&payload.username)
    .bind(&payload.email)
    .bind(password_hash)
    .fetch_one(&pool)
    .await;
    
    // SECURITY: Don't reveal whether email/username exists
    let user = match result {
        Ok(u) => u,
        Err(sqlx::Error::Database(db_err)) if db_err.is_unique_violation() => {
            tracing::warn!(
                username = %payload.username,
                email = %payload.email,
                "Registration failed: duplicate entry"
            );
            return Err(AppError::BadRequest("Registration failed. Please try a different username or email.".into()));
        },
        Err(e) => return Err(e.into()),
    };

    let token = create_jwt(user.id)?;
    
    tracing::info!(
        user_id = %user.id,
        username = %user.username,
        "Registration successful"
    );

    Ok(Json(AuthResponse {
        token,
        username: user.username,
    }))
}

pub async fn login(
    State(pool): State<PgPool>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    tracing::info!(
        email = %payload.email,
        "Login attempt"
    );
    
    // SECURITY: Use constant-time comparison for credentials
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| {
            tracing::warn!(
                email = %payload.email,
                "Login failed: user not found"
            );
            AppError::Auth("Invalid credentials".into())
        })?;

    let hash = user.password_hash.as_ref().ok_or_else(|| {
        tracing::warn!(
            email = %payload.email,
            "Login failed: OAuth-only account"
        );
        AppError::Auth("Invalid credentials".into())
    })?;
    
    if !verify_password(&payload.password, hash)? {
        tracing::warn!(
            user_id = %user.id,
            email = %payload.email,
            "Login failed: incorrect password"
        );
        return Err(AppError::Auth("Invalid credentials".into()));
    }

    let token = create_jwt(user.id)?;
    
    tracing::info!(
        user_id = %user.id,
        email = %payload.email,
        "Login successful"
    );

    Ok(Json(AuthResponse {
        token,
        username: user.username,
    }))
}

#[derive(Deserialize)]
pub struct OAuthCallback {
    pub code: String,
}

pub async fn github_auth(
    State(pool): State<PgPool>,
    Query(params): Query<OAuthCallback>,
) -> Result<Json<AuthResponse>, AppError> {
    let client_id = std::env::var("GITHUB_CLIENT_ID").map_err(|_| AppError::Internal)?;
    let client_secret = std::env::var("GITHUB_CLIENT_SECRET").map_err(|_| AppError::Internal)?;

    // 1. Exchange code for GitHub access token
    let client = reqwest::Client::new();
    let resp = client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .json(&serde_json::json!({
            "client_id": client_id,
            "client_secret": client_secret,
            "code": params.code,
        }))
        .send()
        .await
        .map_err(|_| AppError::Internal)?;

    let token_data: serde_json::Value = resp.json().await.map_err(|_| AppError::Internal)?;
    let access_token = token_data["access_token"].as_str().ok_or_else(|| AppError::Auth("OAuth failed".into()))?;

    // 2. Fetch user info from GitHub API
    let user_info: serde_json::Value = client
        .get("https://api.github.com/user")
        .header("Authorization", format!("Bearer {}", access_token))
        .header("User-Agent", "offline-leet-practice")
        .send()
        .await
        .map_err(|_| AppError::Internal)?
        .json()
        .await
        .map_err(|_| AppError::Internal)?;

    let github_id = user_info["id"].as_i64().map(|id| id.to_string()).ok_or_else(|| AppError::Internal)?;
    let username = user_info["login"].as_str().unwrap_or("github_user").to_string();
    let avatar_url = user_info["avatar_url"].as_str().map(|s| s.to_string());

    // 3. Find or create user in DB
    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (username, github_id, avatar_url)
        VALUES ($1, $2, $3)
        ON CONFLICT (github_id) DO UPDATE SET avatar_url = EXCLUDED.avatar_url
        RETURNING *
        "#
    )
    .bind(username)
    .bind(github_id)
    .bind(avatar_url)
    .fetch_one(&pool)
    .await?;

    // 4. Generate JWT
    let token = create_jwt(user.id)?;

    Ok(Json(AuthResponse {
        token,
        username: user.username,
    }))
}

pub async fn google_auth(
    State(_pool): State<PgPool>,
    Query(_params): Query<OAuthCallback>,
) -> Result<Json<AuthResponse>, AppError> {
    // TODO: Implement Google OAuth
    // Similar to GitHub, but using Google OAuth endpoints
    Err(AppError::BadRequest("Google OAuth requires separate endpoint configuration".into()))
}


