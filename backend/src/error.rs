use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Authentication error: {0}")]
    Auth(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Invalid request: {0}")]
    BadRequest(String),
    #[error("Internal server error")]
    Internal,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        // SECURITY: Log detailed errors for debugging, but return generic messages in production
        tracing::error!("Error occurred: {:?}", self);
        
        let (status, message) = match self {
            AppError::Database(ref e) => {
                // Don't expose database details in production
                if cfg!(debug_assertions) {
                    (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e))
                } else {
                    (StatusCode::INTERNAL_SERVER_ERROR, "An error occurred while processing your request".to_string())
                }
            },
            AppError::Auth(msg) => (StatusCode::UNAUTHORIZED, msg),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Internal => {
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            },
        };

        let body = Json(json!({
            "error": message,
        }));

        (status, body).into_response()
    }
}
