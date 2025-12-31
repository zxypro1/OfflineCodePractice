# Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Market  │  │  Manage  │  │   Auth   │  │   Stats  │       │
│  │   Page   │  │   Page   │  │  Modal   │  │   Page   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/JSON
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Vercel Serverless Function                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Rust Backend (Axum)                      │  │
│  │                                                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │   Auth   │  │  Market  │  │  Error   │               │  │
│  │  │ Handlers │  │ Handlers │  │ Handling │               │  │
│  │  └──────────┘  └──────────┘  └──────────┘               │  │
│  │                      │                                     │  │
│  │  ┌──────────────────┴──────────────────┐                 │  │
│  │  │        JWT & Auth Middleware        │                 │  │
│  │  └──────────────────┬──────────────────┘                 │  │
│  │                      │                                     │  │
│  │  ┌──────────────────┴──────────────────┐                 │  │
│  │  │        SQLx Database Layer          │                 │  │
│  │  └──────────────────┬──────────────────┘                 │  │
│  └───────────────────────┼──────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │ PostgreSQL Protocol
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│               Supabase (Managed PostgreSQL)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Database                             │  │
│  │  ┌────────────┐              ┌────────────┐              │  │
│  │  │   users    │──────────────│  problems  │              │  │
│  │  │            │  user_id FK  │            │              │  │
│  │  └────────────┘              └────────────┘              │  │
│  │                                                            │  │
│  │  Indices: username, email, github_id, tags (GIN)         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             Connection Pooling (PgBouncer)                │  │
│  │         Port 6543 - Transaction Mode                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

External Services (Optional):
┌──────────────┐    ┌──────────────┐
│   GitHub     │    │    Google    │
│    OAuth     │    │    OAuth     │
└──────────────┘    └──────────────┘
```

## Request Flow

### 1. User Registration/Login

```
User → Frontend → POST /api/auth/register
                  → Rust Backend
                    → Hash password (Argon2)
                    → Insert into users table
                    → Generate JWT
                  ← JWT Token
        ← Store token in localStorage
```

### 2. OAuth Authentication (GitHub/Google)

```
User → Click "Login with GitHub"
     → Redirect to GitHub OAuth
     → User authorizes
     → Callback with code
     → Frontend → GET /api/auth/github?code=xxx
                → Rust Backend
                  → Exchange code for GitHub token
                  → Fetch user info from GitHub API
                  → Find or create user in DB
                  → Generate JWT
                ← JWT Token
        ← Store token in localStorage
```

### 3. Upload Problem to Marketplace

```
User (authenticated) → Frontend → POST /api/market/problems
                                   Authorization: Bearer <JWT>
                                   { title, content, tags, difficulty }
                                → Rust Backend
                                  → Decode & verify JWT
                                  → Extract user_id from token
                                  → Insert problem with user_id
                                  → Return problem data
                                ← { id, title, ... }
                      ← Success notification
```

### 4. Download Problem from Marketplace

```
User (authenticated) → Frontend → GET /api/market/problems/:id/download
                                   Authorization: Bearer <JWT>
                                → Rust Backend
                                  → Decode & verify JWT
                                  → Increment download_count
                                  → Fetch problem by id
                                  → Return full problem JSON
                                ← { content: {...} }
                      → POST /api/add-problem (local API)
                        → Save to public/problems.json
                      ← Added to local library
```

## Data Models

### User Model

```rust
struct User {
    id: Uuid,                    // Primary key
    username: String,            // Display name
    email: Option<String>,       // For email/password auth
    password_hash: Option<String>, // Argon2 hash
    github_id: Option<String>,   // GitHub OAuth ID
    google_id: Option<String>,   // Google OAuth ID
    avatar_url: Option<String>,  // Profile picture
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}
```

### Problem Model

```rust
struct Problem {
    id: Uuid,                    // Primary key
    user_id: Uuid,               // Foreign key → users.id
    title: String,               // Problem title
    content: serde_json::Value,  // Full problem JSON
    tags: Vec<String>,           // Searchable tags
    difficulty: String,          // Easy/Medium/Hard
    download_count: i32,         // Download tracking
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}
```

## Authentication Flow

### JWT Structure

```json
{
  "sub": "user-uuid",          // Subject (user ID)
  "iat": 1234567890,           // Issued at (timestamp)
  "exp": 1234567890            // Expiration (7 days)
}
```

### Token Verification (Middleware)

```rust
async fn from_request_parts(parts: &mut Parts, _state: &S) 
    -> Result<Claims, AppError> {
    // 1. Extract Authorization header
    let auth_header = parts.headers.get(AUTHORIZATION)?;
    
    // 2. Parse "Bearer <token>"
    let token = extract_bearer_token(auth_header)?;
    
    // 3. Decode JWT with secret
    let claims = decode_jwt(token)?;
    
    // 4. Check expiration
    if claims.exp < current_timestamp() {
        return Err(AppError::Auth("Token expired"));
    }
    
    Ok(claims)
}
```

## Security Considerations

### 1. Password Security
- **Hashing**: Argon2id (winner of Password Hashing Competition)
- **Salt**: Automatically generated per password
- **No plaintext**: Passwords never stored in plain text

### 2. JWT Security
- **Secret Key**: 256-bit cryptographically secure random string
- **Expiration**: 7 days default (configurable)
- **Signing**: HMAC-SHA256
- **Stateless**: No server-side session storage

### 3. Database Security
- **Connection**: TLS encryption enforced
- **Credentials**: Environment variables only
- **SQL Injection**: Prevented by SQLx parameterized queries
- **Connection Pooling**: Limits concurrent connections

### 4. API Security
- **CORS**: Configurable (default: permissive for development)
- **Rate Limiting**: Recommended for production (not implemented)
- **Input Validation**: Via `validator` crate
- **Error Handling**: No sensitive data in error messages

## Performance Optimization

### 1. Connection Pooling
```rust
PgPoolOptions::new()
    .max_connections(5)  // Optimized for serverless
    .connect(&database_url)
```

### 2. Database Indices
```sql
CREATE INDEX idx_problems_user_id ON problems(user_id);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_tags ON problems USING GIN(tags);
```

### 3. Serverless Cold Start
- Small binary size (~2-5 MB compiled)
- Minimal dependencies
- Fast initialization (<100ms)

## Deployment Architecture

### Vercel Edge Network

```
User Request
    ↓
Cloudflare/Vercel Edge (CDN)
    ↓
Nearest Edge Location
    ↓
Vercel Serverless Function
    ↓
Backend (Rust/Axum)
    ↓
Supabase PostgreSQL (Connection Pool)
```

### Environment Configuration

**Development:**
- Local Rust server
- Local PostgreSQL or Supabase development instance

**Production:**
- Vercel Serverless Functions (auto-scaling)
- Supabase Production database (managed)
- Environment variables via Vercel

## Error Handling

### Error Types

```rust
enum AppError {
    Database(sqlx::Error),      // Database errors
    Auth(String),               // Authentication failures
    NotFound(String),           // Resource not found
    BadRequest(String),         // Invalid input
    Internal,                   // Unexpected errors
}
```

### HTTP Status Codes

| Error Type | HTTP Status | Example |
|------------|-------------|---------|
| `Database` | 500 | Database connection failed |
| `Auth` | 401 | Invalid or expired token |
| `NotFound` | 404 | Problem not found |
| `BadRequest` | 400 | Missing required field |
| `Internal` | 500 | Unexpected server error |

## Monitoring & Logging

### Structured Logging (tracing)

```rust
tracing_subscriber::registry()
    .with(EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| "info".into()))
    .with(fmt::layer())
    .init();
```

**Log Levels:**
- `ERROR`: Critical failures
- `WARN`: Recoverable issues
- `INFO`: Request/response logging
- `DEBUG`: Detailed execution flow
- `TRACE`: Verbose debugging

## Future Enhancements

1. **Rate Limiting**: Implement per-user/IP rate limits
2. **Caching**: Redis for frequently accessed problems
3. **Full-Text Search**: PostgreSQL FTS for problem search
4. **Analytics**: Track problem popularity, user engagement
5. **Admin Panel**: Moderation tools for problem marketplace
6. **API Versioning**: `/api/v1/` endpoints for backward compatibility

---

For implementation details, see [README.md](./README.md)
