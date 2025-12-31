# OfflineLeetPractice Backend

A Rust-based serverless backend service for the OfflineLeetPractice problem marketplace, deployed on Vercel with Supabase PostgreSQL.

[中文文档](./README-zh.md)

## Features

- **User Authentication**: Email/password registration, login, and OAuth integration (GitHub, Google)
- **Problem Marketplace**: Upload, browse, and download coding problems
- **JWT-based Authorization**: Secure API endpoints with token-based authentication
- **Serverless Architecture**: Built for Vercel Serverless Functions
- **PostgreSQL Database**: Managed by Supabase with connection pooling

## Tech Stack

- **Framework**: [Axum](https://github.com/tokio-rs/axum) - Ergonomic web framework for Rust
- **Runtime**: [Tokio](https://tokio.rs/) - Asynchronous runtime
- **Database**: PostgreSQL (via [Supabase](https://supabase.com/))
- **ORM**: [SQLx](https://github.com/launchbadge/sqlx) - Async SQL toolkit
- **Authentication**: JWT (jsonwebtoken) + Argon2 password hashing
- **Deployment**: [Vercel Serverless Functions](https://vercel.com/docs/functions)

## Prerequisites

- Rust 1.70+ and Cargo
- Supabase account (or PostgreSQL database)
- Vercel account (for deployment)
- GitHub/Google OAuth credentials (optional, for OAuth login)

## Database Setup

### 1. Create a Supabase Project

1. Sign up at [supabase.com](https://supabase.com/)
2. Create a new project
3. Note your database connection string

### 2. Initialize Database Schema

Run the SQL schema located in `backend/schema.sql`:

```bash
psql "your-supabase-connection-string" < backend/schema.sql
```

Or execute directly in Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Paste and execute the contents of `backend/schema.sql`

The schema creates:
- `users` table: User accounts with OAuth support
- `problems` table: Problem marketplace entries
- Necessary indexes for performance

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Database URL Format

For Supabase, use the **connection pooling** URL (recommended for serverless):

```
postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

Find this in: **Supabase Dashboard → Settings → Database → Connection Pooling**

## Local Development

### 1. Install Dependencies

```bash
cd backend
cargo build
```

### 2. Run Locally

```bash
cargo run
```

The server will start, but note that it's designed for Vercel's serverless runtime. For local testing, you may need to modify `main.rs` to add a standard HTTP server listener.

### 3. Test Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Configure Project

Ensure `vercel.json` exists in the project root:

```json
{
  "functions": {
    "backend/src/main.rs": {
      "runtime": "vercel-rust@1.1.0"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/src/main.rs"
    }
  ]
}
```

### 3. Set Environment Variables

In Vercel Dashboard or via CLI:

```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
```

### 4. Deploy

```bash
vercel --prod
```

Your backend will be available at: `https://your-project.vercel.app/api/*`

## API Endpoints

### Health Check

```
GET /api/health
```

Returns `"OK"` if service is running.

### Authentication

#### Register

```
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}

Response: { "token": "jwt-token", "username": "string" }
```

#### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}

Response: { "token": "jwt-token", "username": "string" }
```

#### GitHub OAuth

```
GET /api/auth/github?code=<auth-code>

Response: { "token": "jwt-token", "username": "string" }
```

#### Google OAuth

```
GET /api/auth/google?code=<auth-code>

Response: { "token": "jwt-token", "username": "string" }
```

### Problem Marketplace

#### List Problems

```
GET /api/market/problems

Response: [
  {
    "id": "uuid",
    "title": "string",
    "difficulty": "Easy|Medium|Hard",
    "tags": ["string"],
    "download_count": number,
    "created_at": "timestamp",
    "username": "string"
  }
]
```

#### Upload Problem

```
POST /api/market/problems
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "string",
  "content": { /* full problem JSON */ },
  "tags": ["string"],
  "difficulty": "Easy|Medium|Hard"
}

Response: { /* created problem */ }
```

#### Download Problem

```
GET /api/market/problems/:id/download
Authorization: Bearer <jwt-token>

Response: {
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "content": { /* full problem JSON */ },
  "tags": ["string"],
  "difficulty": "string",
  "download_count": number,
  "created_at": "timestamp"
}
```

## Project Structure

```
backend/
├── src/
│   ├── main.rs              # Entry point, Axum router setup
│   ├── auth/
│   │   └── mod.rs           # JWT & password hashing utilities
│   ├── handlers/
│   │   ├── mod.rs
│   │   ├── auth.rs          # Authentication handlers
│   │   └── market.rs        # Problem marketplace handlers
│   ├── models/
│   │   └── mod.rs           # Database models (User, Problem)
│   └── error.rs             # Custom error types
├── schema.sql               # PostgreSQL schema
├── Cargo.toml               # Rust dependencies
└── .env                     # Environment variables (not committed)
```

## Security

### ⚠️ Important Security Documents

**Before deploying to production, please read:**

- **[Security Audit Report](./SECURITY-AUDIT.md)** - Comprehensive security analysis
- **[Security Fixes Summary](./SECURITY-FIXES-SUMMARY.md)** - What we've fixed and what's pending
- **[Security Checklist](./SECURITY-CHECKLIST.md)** - Pre-deployment checklist (MUST READ)

### Security Features

1. **JWT Authentication**: Strong token-based auth with configurable expiration
2. **Password Hashing**: Argon2id (PHC winner) with automatic salting
3. **Input Validation**: All user inputs validated for format and security
4. **CORS Protection**: Configurable origin whitelist (no wildcards in production)
5. **Audit Logging**: Critical operations logged with tracing
6. **Error Handling**: No sensitive data leaks in production error messages

### Security Requirements

✅ **JWT_SECRET** must be:
- At least 32 characters long
- Cryptographically random (use `openssl rand -base64 48`)
- Never use defaults like "secret", "change-this", etc.

✅ **ALLOWED_ORIGINS** must be:
- Explicitly configured for production
- No trailing slashes
- Comma-separated list of exact domains

✅ **Database** credentials:
- Use connection pooling URL (port 6543)
- Enable SSL/TLS
- Never commit `.env` files

### Implemented Security Features

✅ **Security Headers**
- X-Frame-Options, X-Content-Type-Options, CSP, HSTS, etc.

✅ **Request Body Limits**
- Maximum 2MB per request

✅ **Pagination**
- All list endpoints support pagination (max 100 items/page)

✅ **Input Validation**
- Username, email, and password format validation

✅ **Password Security**
- Argon2 hashing algorithm
- Strong password policy

✅ **JWT Security**
- Secure secret key validation
- 7-day expiration

✅ **CORS Whitelist**
- Strict origin control

### Known Limitations

The following features are **not yet implemented**:

- ⚠️ **Rate Limiting** (disabled due to tower_governor 0.3 API limitations)
  - Recommendation: Upgrade to tower_governor 0.8+ or use alternative rate limiting
- ⚠️ **OAuth CSRF Protection** (State validation code ready, pending full OAuth implementation)
- ⚠️ Account lockout after failed login attempts
- ⚠️ Password reset functionality
- ⚠️ Email verification
- ⚠️ Two-factor authentication (2FA)

See [SECURITY-IMPROVEMENTS.md](./SECURITY-IMPROVEMENTS.md) for complete security feature list.

## Troubleshooting

### Database Connection Issues

- Ensure you're using the **connection pooling URL** from Supabase
- Check that your IP is allowed in Supabase's network restrictions
- Verify connection pool size (default: 5 connections)

### JWT Token Errors

- Ensure `JWT_SECRET` matches between deployments
- Check token expiration (default: 7 days)
- Verify `Authorization: Bearer <token>` header format

### Vercel Deployment Fails

- Check build logs in Vercel dashboard
- Ensure `vercel-rust` runtime is properly configured
- Verify all environment variables are set

## Contributing

Contributions are welcome! Please ensure:

1. Code follows Rust best practices and passes `cargo clippy`
2. All tests pass with `cargo test`
3. API changes are documented in this README

## License

This project is licensed under the MIT License.

## Support

For issues or questions:
- GitHub Issues: https://github.com/zxypro1/OfflineLeetPractice/issues
- Documentation: https://github.com/zxypro1/OfflineLeetPractice
