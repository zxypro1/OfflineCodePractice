use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: Option<String>,
    pub password_hash: Option<String>,
    pub github_id: Option<String>,
    pub google_id: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Problem {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub content: serde_json::Value, // Full problem data in JSON
    pub tags: Vec<String>,
    pub difficulty: String,
    pub download_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProblemUpload {
    pub title: String,
    pub content: serde_json::Value,
    pub tags: Vec<String>,
    pub difficulty: String,
}
