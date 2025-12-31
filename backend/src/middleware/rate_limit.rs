use tower::layer::util::Identity;

// 由于 tower_governor 0.3 的类型复杂性，我们暂时使用 Identity 层作为占位
// 在生产环境中，建议升级到 tower_governor 0.8+ 或使用其他速率限制方案

/// Creates a rate limiter for authentication endpoints
/// Limits: 10 requests per minute per IP (当前版本暂未启用，返回空层)
pub fn auth_rate_limiter() -> Identity {
    // TODO: 升级到 tower_governor 0.8+ 以获得更好的 API
    // let governor_conf = Box::new(
    //     GovernorConfigBuilder::default()
    //         .per_second(10)
    //         .burst_size(15)
    //         .use_headers()
    //         .finish()
    //         .unwrap()
    // );
    tracing::warn!("Rate limiting is currently disabled. Consider upgrading tower_governor.");
    Identity::new()
}

/// Creates a rate limiter for general API endpoints
/// Limits: 60 requests per minute per IP (当前版本暂未启用，返回空层)
pub fn api_rate_limiter() -> Identity {
    tracing::warn!("Rate limiting is currently disabled. Consider upgrading tower_governor.");
    Identity::new()
}

/// Creates a strict rate limiter for registration endpoints
/// Limits: 3 requests per hour per IP (当前版本暂未启用，返回空层)
pub fn register_rate_limiter() -> Identity {
    tracing::warn!("Rate limiting is currently disabled. Consider upgrading tower_governor.");
    Identity::new()
}
