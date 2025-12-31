mod auth;
mod error;
mod handlers;
mod models;
mod middleware;

use axum::{
    routing::{get, post},
    Router,
    http::{HeaderValue, Method, header},
    middleware as axum_middleware,
};
use sqlx::postgres::PgPoolOptions;
use tower_http::{
    cors::{CorsLayer, AllowOrigin},
    limit::RequestBodyLimitLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use vercel_runtime::{run, Error, Request, Response, Body};
use tower::ServiceExt;
use middleware::{add_security_headers, auth_rate_limiter, register_rate_limiter, api_rate_limiter};

// Separate the router creation so it can be reused
fn app_router(pool: sqlx::PgPool) -> Router {
    // SECURITY: Configure CORS properly for production
    let allowed_origins = std::env::var("ALLOWED_ORIGINS")
        .unwrap_or_else(|_| {
            // Development fallback
            if cfg!(debug_assertions) {
                "http://localhost:3000,http://127.0.0.1:3000".to_string()
            } else {
                // Production should always set this explicitly
                tracing::warn!("ALLOWED_ORIGINS not set, using restrictive default");
                "https://your-production-domain.com".to_string()
            }
        });
    
    let origins: Vec<HeaderValue> = allowed_origins
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .collect();
    
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins))
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE])
        .allow_credentials(true);

    // Auth routes with stricter rate limiting
    let auth_routes = Router::new()
        .route("/api/auth/register", post(handlers::auth::register))
        .layer(register_rate_limiter())  // Very strict: 3 req/hour
        .route("/api/auth/login", post(handlers::auth::login))
        .layer(auth_rate_limiter())  // Strict: 10 req/min
        .route("/api/auth/github", get(handlers::auth::github_auth))
        .route("/api/auth/google", get(handlers::auth::google_auth))
        .layer(auth_rate_limiter());
    
    // Market routes with moderate rate limiting
    let market_routes = Router::new()
        .route("/api/market/problems", get(handlers::market::list_problems))
        .route("/api/market/problems", post(handlers::market::upload_problem))
        .route("/api/market/problems/:id/download", get(handlers::market::download_problem))
        .layer(api_rate_limiter());  // Moderate: 60 req/min
    
    Router::new()
        .route("/api/health", get(|| async { "OK" }))
        .merge(auth_routes)
        .merge(market_routes)
        // Global middleware layers (applied bottom-up)
        .layer(RequestBodyLimitLayer::new(2 * 1024 * 1024))  // 2MB request body limit
        .layer(axum_middleware::from_fn(add_security_headers))  // Security headers
        .layer(cors)
        .with_state(pool)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenvy::dotenv().ok();
    
    // Subscriber initialization
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // SECURITY: Validate critical environment variables at startup
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    let jwt_secret = std::env::var("JWT_SECRET")
        .expect("JWT_SECRET must be set");
    
    if jwt_secret.len() < 32 {
        panic!("SECURITY ERROR: JWT_SECRET must be at least 32 characters long for security");
    }
    
    if jwt_secret == "secret" || jwt_secret.contains("change") || jwt_secret.contains("example") {
        panic!("SECURITY ERROR: JWT_SECRET appears to be a default/example value. Use a cryptographically secure random string");
    }
    
    tracing::info!("Security checks passed: JWT_SECRET is properly configured");
    
    // For Serverless, we use a small pool size or adaptive pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(|e| Error::from(e.to_string()))?;

    let app = app_router(pool);

    // run is the entry point for vercel_runtime
    run(move |req: Request| {
        let app = app.clone();
        async move {
            // Convert vercel_runtime::Request to axum::http::Request<axum::body::Body>
            let (parts, body) = req.into_parts();
            let body_bytes = match body {
                Body::Empty => bytes::Bytes::new(),
                Body::Text(s) => bytes::Bytes::from(s),
                Body::Binary(v) => bytes::Bytes::from(v),
            };
            let axum_req = axum::http::Request::from_parts(parts, axum::body::Body::from(body_bytes));
            
            let res = app.oneshot(axum_req).await.unwrap();
            let (parts, body) = res.into_parts();
            
            // Collect axum body into bytes
            let bytes = axum::body::to_bytes(body, usize::MAX)
                .await
                .map_err(|e| Error::from(e.to_string()))?;
            
            // Create vercel_runtime::Response with vercel_runtime::Body
            let vercel_res = Response::from_parts(parts, Body::Binary(bytes.to_vec()));
            Ok(vercel_res)
        }
    })
    .await
}

