# Quick Start Guide

Get the OfflineLeetPractice backend running in 5 minutes.

## Prerequisites

- Rust installed ([rustup.rs](https://rustup.rs/))
- A Supabase account (free tier works)

## Step-by-Step

### 1. Create Supabase Database

1. Go to [supabase.com](https://supabase.com/) and create a project
2. In **SQL Editor**, paste and run `backend/schema.sql`
3. Go to **Settings → Database → Connection Pooling**
4. Copy the connection string (mode: Transaction)

### 2. Configure Environment

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@xxx.pooler.supabase.com:6543/postgres
JWT_SECRET=change-this-to-a-random-string-min-32-chars
```

Generate a secure JWT secret:
```bash
openssl rand -base64 32
```

### 3. Test Locally (Optional)

```bash
cd backend
cargo run
```

**Note**: The current implementation is designed for Vercel serverless. For local testing, you may want to add a standard HTTP server listener.

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET

# Deploy
vercel --prod
```

Your API will be live at: `https://your-project.vercel.app/api/`

### 5. Test Your API

```bash
# Replace with your Vercel URL
API_URL="https://your-project.vercel.app"

# Health check
curl $API_URL/api/health

# Register a user
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"securepass123"}'

# The response contains a JWT token - save it!
```

## Next Steps

- Read the full [README](./README.md) for detailed documentation
- Configure OAuth (GitHub/Google) for social login
- Integrate with your frontend application

## Common Issues

**"Database connection failed"**
→ Use the **Connection Pooling** URL from Supabase, not the direct connection string

**"JWT_SECRET must be set"**
→ Make sure you added environment variables in Vercel

**"Build failed on Vercel"**
→ Check that `vercel.json` exists in project root and references `backend/src/main.rs`

---

For more help, see [README.md](./README.md) or [README-zh.md](./README-zh.md)
