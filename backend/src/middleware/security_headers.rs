use axum::{
    body::Body,
    http::{Request, Response, header::{self, HeaderValue}},
    middleware::Next,
};

/// Middleware to add security headers to all responses
pub async fn add_security_headers(
    req: Request<Body>,
    next: Next,
) -> Response<Body> {
    let mut response = next.run(req).await;
    let headers = response.headers_mut();
    
    // Prevent clickjacking attacks
    headers.insert(
        header::X_FRAME_OPTIONS,
        HeaderValue::from_static("DENY")
    );
    
    // Prevent MIME type sniffing
    headers.insert(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff")
    );
    
    // Enable XSS protection (legacy, but still useful for older browsers)
    headers.insert(
        "X-XSS-Protection",
        HeaderValue::from_static("1; mode=block")
    );
    
    // Enforce HTTPS for 1 year (if deployed with HTTPS)
    if !cfg!(debug_assertions) {
        headers.insert(
            header::STRICT_TRANSPORT_SECURITY,
            HeaderValue::from_static("max-age=31536000; includeSubDomains; preload")
        );
    }
    
    // Content Security Policy - restrict resource loading
    headers.insert(
        header::CONTENT_SECURITY_POLICY,
        HeaderValue::from_static("default-src 'self'; frame-ancestors 'none'; base-uri 'self'")
    );
    
    // Control what information is sent in Referer header
    headers.insert(
        header::REFERRER_POLICY,
        HeaderValue::from_static("strict-origin-when-cross-origin")
    );
    
    // Opt out of Google's FLoC tracking
    headers.insert(
        "Permissions-Policy",
        HeaderValue::from_static("interest-cohort=()")
    );
    
    response
}
