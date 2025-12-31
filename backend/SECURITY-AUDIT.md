# 安全审计报告 / Security Audit Report

**审计日期 / Audit Date**: 2025-12-31  
**严重程度 / Severity**: 🔴 高危 HIGH | 🟡 中危 MEDIUM | 🟢 低危 LOW

---

## 🔴 高危问题 / Critical Issues

### 1. CORS 配置过于宽松 / Overly Permissive CORS

**位置 / Location**: `backend/src/main.rs:18-21`

```rust
let cors = CorsLayer::new()
    .allow_origin(Any)  // ❌ 允许任何来源
    .allow_methods(Any)
    .allow_headers(Any);
```

**风险 / Risk**:
- 允许任何网站访问 API，容易受到 CSRF 攻击
- 敏感数据可能被恶意网站读取

**修复建议 / Fix**:
```rust
use tower_http::cors::{CorsLayer, Origin};

let allowed_origins = std::env::var("ALLOWED_ORIGINS")
    .unwrap_or_else(|_| "https://your-domain.com".to_string())
    .split(',')
    .map(|s| s.parse::<HeaderValue>().unwrap())
    .collect::<Vec<_>>();

let cors = CorsLayer::new()
    .allow_origin(Origin::list(allowed_origins))
    .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
    .allow_headers([AUTHORIZATION, CONTENT_TYPE])
    .allow_credentials(true);
```

---

### 2. JWT 密钥不安全的默认值 / Insecure JWT Secret Default

**位置 / Location**: `backend/src/auth/mod.rs:47, 68`

```rust
let secret = std::env::var("JWT_SECRET")
    .unwrap_or_else(|_| "secret".to_string());  // ❌ 弱密钥
```

**风险 / Risk**:
- 如果环境变量未设置，使用 "secret" 作为密钥
- 攻击者可以伪造任何 JWT 令牌
- 完全绕过身份验证

**修复建议 / Fix**:
```rust
let secret = std::env::var("JWT_SECRET")
    .expect("JWT_SECRET must be set and must be at least 32 characters");

// 添加启动时验证
if secret.len() < 32 {
    panic!("JWT_SECRET must be at least 32 characters long");
}
```

---

### 3. OAuth 回调缺少 State 参数验证 / Missing OAuth State Validation

**位置 / Location**: `backend/src/handlers/auth.rs:86-148`

```rust
pub async fn github_auth(
    State(pool): State<PgPool>,
    Query(params): Query<OAuthCallback>,  // ❌ 只有 code，没有 state
) -> Result<Json<AuthResponse>, AppError>
```

**风险 / Risk**:
- 容易受到 CSRF 攻击
- 攻击者可以劫持 OAuth 流程

**修复建议 / Fix**:
```rust
#[derive(Deserialize)]
pub struct OAuthCallback {
    pub code: String,
    pub state: String,  // 添加 state 参数
}

// 在发起 OAuth 前生成并存储 state
// 在回调中验证 state 是否匹配
```

---

## 🟡 中危问题 / Medium Risk Issues

### 4. 缺少输入验证 / Missing Input Validation

**位置 / Location**: `backend/src/handlers/auth.rs:12-17`

```rust
pub struct RegisterRequest {
    pub username: String,  // ❌ 无长度限制
    pub email: String,     // ❌ 无格式验证
    pub password: String,  // ❌ 无强度要求
}
```

**风险 / Risk**:
- 用户可以设置空用户名或超长用户名
- 邮箱格式不正确导致后续问题
- 弱密码容易被暴力破解

**修复建议 / Fix**:
```rust
use validator::{Validate, ValidationError};

#[derive(Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(length(min = 3, max = 30))]
    #[validate(regex = "USERNAME_REGEX")]
    pub username: String,
    
    #[validate(email)]
    pub email: String,
    
    #[validate(length(min = 8, max = 128))]
    #[validate(custom = "validate_password_strength")]
    pub password: String,
}

fn validate_password_strength(password: &str) -> Result<(), ValidationError> {
    // 检查密码强度：至少包含大小写字母、数字
    if !password.chars().any(|c| c.is_uppercase()) 
        || !password.chars().any(|c| c.is_lowercase())
        || !password.chars().any(|c| c.is_numeric()) {
        return Err(ValidationError::new("weak_password"));
    }
    Ok(())
}
```

---

### 5. 缺少速率限制 / No Rate Limiting

**位置 / Location**: 所有端点

**风险 / Risk**:
- 暴力破解登录凭证
- DDoS 攻击
- 资源耗尽

**修复建议 / Fix**:
```rust
use tower_governor::{GovernorLayer, governor::GovernorConfigBuilder};
use std::time::Duration;

// 添加速率限制中间件
let governor_conf = Box::new(
    GovernorConfigBuilder::default()
        .per_second(10)  // 每秒最多 10 个请求
        .burst_size(20)
        .finish()
        .unwrap()
);

Router::new()
    .route("/api/auth/login", post(handlers::auth::login))
    .layer(GovernorLayer {
        config: Box::leak(governor_conf),
    })
```

---

### 6. 错误信息可能泄露敏感信息 / Information Disclosure in Errors

**位置 / Location**: `backend/src/error.rs:24-31`

```rust
AppError::Database(_) => (
    StatusCode::INTERNAL_SERVER_ERROR, 
    "Database error".to_string()  // ❌ 在生产环境应该更通用
),
```

**风险 / Risk**:
- 数据库错误可能暴露表结构
- 内部实现细节泄露

**修复建议 / Fix**:
```rust
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        // 记录详细错误用于调试
        tracing::error!("Error occurred: {:?}", self);
        
        let (status, message) = match self {
            AppError::Database(e) => {
                // 生产环境返回通用消息
                if cfg!(debug_assertions) {
                    (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e))
                } else {
                    (StatusCode::INTERNAL_SERVER_ERROR, "An error occurred".to_string())
                }
            },
            // ... 其他错误类型
        };
        
        (status, Json(json!({ "error": message }))).into_response()
    }
}
```

---

### 7. 缺少日志审计 / Missing Audit Logging

**位置 / Location**: 所有关键操作

**风险 / Risk**:
- 无法追踪安全事件
- 难以调查安全事件
- 不符合合规要求

**修复建议 / Fix**:
```rust
// 在关键操作处添加审计日志
pub async fn login(
    State(pool): State<PgPool>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    tracing::info!(
        email = %payload.email,
        "Login attempt"
    );
    
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
    
    // 验证密码...
    
    tracing::info!(
        user_id = %user.id,
        email = %payload.email,
        "Login successful"
    );
    
    // ...
}
```

---

### 8. 用户枚举漏洞 / User Enumeration Vulnerability

**位置 / Location**: `backend/src/handlers/auth.rs:31-56`

**风险 / Risk**:
- 注册时如果邮箱已存在会返回不同错误
- 攻击者可以枚举有效用户

**修复建议 / Fix**:
```rust
pub async fn register(
    State(pool): State<PgPool>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
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
    
    match result {
        Ok(user) => {
            let token = create_jwt(user.id)?;
            Ok(Json(AuthResponse { token, username: user.username }))
        },
        Err(sqlx::Error::Database(db_err)) if db_err.is_unique_violation() => {
            // 返回通用错误，不泄露邮箱是否已存在
            Err(AppError::BadRequest("Registration failed".into()))
        },
        Err(e) => Err(e.into()),
    }
}
```

---

## 🟢 低危问题 / Low Risk Issues

### 9. 缺少分页 / Missing Pagination

**位置 / Location**: `backend/src/handlers/market.rs:11-21`

```rust
pub async fn list_problems(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<Problem>>, AppError> {
    let problems = sqlx::query_as::<_, Problem>(
        "SELECT * FROM problems ORDER BY created_at DESC"  // ❌ 无限制
    )
```

**风险 / Risk**:
- 返回所有数据可能导致性能问题
- 内存消耗过大

**修复建议 / Fix**:
```rust
#[derive(Deserialize)]
pub struct PaginationParams {
    #[serde(default = "default_page")]
    page: i64,
    #[serde(default = "default_limit")]
    limit: i64,
}

fn default_page() -> i64 { 1 }
fn default_limit() -> i64 { 20 }

pub async fn list_problems(
    State(pool): State<PgPool>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<PaginatedResponse<Problem>>, AppError> {
    let offset = (params.page - 1) * params.limit;
    let limit = params.limit.min(100); // 限制最大每页数量
    
    let problems = sqlx::query_as::<_, Problem>(
        "SELECT * FROM problems ORDER BY created_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&pool)
    .await?;
    
    // ...
}
```

---

### 10. 缺少请求体大小限制 / No Request Body Size Limit

**位置 / Location**: `backend/src/main.rs`

**风险 / Risk**:
- 恶意用户可以发送巨大的请求体
- DoS 攻击

**修复建议 / Fix**:
```rust
use tower_http::limit::RequestBodyLimitLayer;

Router::new()
    // ...
    .layer(RequestBodyLimitLayer::new(1024 * 1024)) // 1MB 限制
```

---

### 11. 缺少 SQL 注入防护文档 / Missing SQL Injection Documentation

**当前状态 / Current State**: ✅ 已使用参数化查询，基本安全

**建议 / Recommendation**: 
- 添加注释说明所有查询都使用参数化
- 在代码审查清单中强调这一点

---

### 12. 缺少内容安全策略 / Missing Content Security Policy

**修复建议 / Fix**:
```rust
use tower_http::set_header::SetResponseHeaderLayer;

Router::new()
    .layer(SetResponseHeaderLayer::overriding(
        header::CONTENT_SECURITY_POLICY,
        HeaderValue::from_static("default-src 'self'"),
    ))
    .layer(SetResponseHeaderLayer::overriding(
        header::X_FRAME_OPTIONS,
        HeaderValue::from_static("DENY"),
    ))
    .layer(SetResponseHeaderLayer::overriding(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    ))
```

---

## 安全最佳实践建议 / Security Best Practices

### 1. 环境变量验证
启动时验证所有必需的环境变量：
```rust
fn validate_env_vars() -> Result<(), String> {
    std::env::var("DATABASE_URL")
        .map_err(|_| "DATABASE_URL not set")?;
    
    let jwt_secret = std::env::var("JWT_SECRET")
        .map_err(|_| "JWT_SECRET not set")?;
    
    if jwt_secret.len() < 32 {
        return Err("JWT_SECRET must be at least 32 characters".to_string());
    }
    
    Ok(())
}
```

### 2. 使用 Helmet 风格的安全头
```rust
use axum::middleware;

async fn security_headers<B>(
    req: Request<B>,
    next: Next<B>,
) -> Response {
    let mut response = next.run(req).await;
    let headers = response.headers_mut();
    
    headers.insert("X-Frame-Options", "DENY".parse().unwrap());
    headers.insert("X-Content-Type-Options", "nosniff".parse().unwrap());
    headers.insert("X-XSS-Protection", "1; mode=block".parse().unwrap());
    headers.insert("Strict-Transport-Security", 
        "max-age=31536000; includeSubDomains".parse().unwrap());
    
    response
}

Router::new()
    .layer(middleware::from_fn(security_headers))
```

### 3. 实现账户锁定机制
```rust
// 在数据库添加字段
// failed_login_attempts INT DEFAULT 0
// locked_until TIMESTAMPTZ

// 登录失败时递增计数
// 达到阈值时锁定账户
// 锁定期间拒绝登录尝试
```

### 4. 添加密码重置功能（带安全令牌）
```rust
// 生成安全的重置令牌
// 设置过期时间（如 1 小时）
// 发送到注册邮箱
// 验证后允许重置密码
```

### 5. 实现 2FA（可选）
```toml
[dependencies]
totp-rs = "5.0"
```

---

## 部署清单 / Deployment Checklist

- [ ] 设置强 JWT_SECRET（至少 32 字符）
- [ ] 配置 CORS 只允许特定域名
- [ ] 启用 HTTPS（Vercel 自动提供）
- [ ] 设置数据库连接池限制
- [ ] 配置速率限制
- [ ] 启用请求体大小限制
- [ ] 添加安全响应头
- [ ] 配置日志级别（生产环境 info/warn/error）
- [ ] 设置环境变量验证
- [ ] 配置 OAuth 回调 URL 白名单
- [ ] 启用数据库 SSL/TLS
- [ ] 定期备份数据库
- [ ] 设置监控和告警
- [ ] 进行渗透测试
- [ ] 代码安全审计

---

## 参考资源 / References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Rust Security Guidelines](https://anssi-fr.github.io/rust-guide/)
- [Axum Security Best Practices](https://github.com/tokio-rs/axum/discussions)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)

---

**更新日期 / Last Updated**: 2025-12-31  
**下次审计 / Next Review**: 建议每 3 个月进行一次安全审计
