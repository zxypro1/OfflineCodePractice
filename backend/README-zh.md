# OfflineLeetPractice 后端服务

基于 Rust 的无服务器后端服务，为 OfflineLeetPractice 题目市场提供支持，部署在 Vercel，使用 Supabase PostgreSQL 数据库。

[English Documentation](./README.md)

## 功能特性

- **用户认证**：邮箱/密码注册登录，以及 OAuth 集成（GitHub、Google）
- **题目市场**：上传、浏览和下载算法题目
- **JWT 授权**：基于令牌的安全 API 端点保护
- **无服务器架构**：专为 Vercel Serverless Functions 打造
- **PostgreSQL 数据库**：由 Supabase 管理，支持连接池

## 技术栈

- **框架**：[Axum](https://github.com/tokio-rs/axum) - Rust 人体工程学 Web 框架
- **运行时**：[Tokio](https://tokio.rs/) - 异步运行时
- **数据库**：PostgreSQL（通过 [Supabase](https://supabase.com/)）
- **ORM**：[SQLx](https://github.com/launchbadge/sqlx) - 异步 SQL 工具包
- **认证**：JWT (jsonwebtoken) + Argon2 密码哈希
- **部署**：[Vercel Serverless Functions](https://vercel.com/docs/functions)

## 前置要求

- Rust 1.70+ 和 Cargo
- Supabase 账号（或 PostgreSQL 数据库）
- Vercel 账号（用于部署）
- GitHub/Google OAuth 凭证（可选，用于第三方登录）

## 数据库设置

### 1. 创建 Supabase 项目

1. 在 [supabase.com](https://supabase.com/) 注册
2. 创建新项目
3. 记录数据库连接字符串

### 2. 初始化数据库架构

运行位于 `backend/schema.sql` 的 SQL 架构：

```bash
psql "your-supabase-connection-string" < backend/schema.sql
```

或在 Supabase SQL 编辑器中直接执行：

1. 进入 Supabase 项目控制台
2. 导航至 **SQL Editor**
3. 粘贴并执行 `backend/schema.sql` 的内容

该架构创建：
- `users` 表：支持 OAuth 的用户账户
- `problems` 表：题目市场条目
- 性能优化所需的索引

## 环境变量

在 `backend/` 目录创建 `.env` 文件：

```env
# 数据库（Supabase）
DATABASE_URL=postgresql://postgres:[密码]@[主机]:[端口]/postgres

# JWT 密钥（生成一个强随机字符串）
JWT_SECRET=你的超级安全jwt密钥请修改这个

# GitHub OAuth（可选）
GITHUB_CLIENT_ID=你的github客户端id
GITHUB_CLIENT_SECRET=你的github客户端密钥

# Google OAuth（可选）
GOOGLE_CLIENT_ID=你的google客户端id
GOOGLE_CLIENT_SECRET=你的google客户端密钥
```

### 数据库 URL 格式

对于 Supabase，建议使用**连接池** URL（推荐用于无服务器）：

```
postgresql://postgres.xxxxxxxxxxxx:[你的密码]@aws-0-[区域].pooler.supabase.com:6543/postgres
```

在此处查找：**Supabase 控制台 → Settings → Database → Connection Pooling**

## 本地开发

### 1. 安装依赖

```bash
cd backend
cargo build
```

### 2. 本地运行

```bash
cargo run
```

服务器将启动，但请注意它是为 Vercel 的无服务器运行时设计的。如需本地测试，可能需要修改 `main.rs` 添加标准 HTTP 服务器监听器。

### 3. 测试端点

```bash
# 健康检查
curl http://localhost:3000/api/health

# 注册用户
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 部署到 Vercel

### 1. 安装 Vercel CLI

```bash
npm i -g vercel
```

### 2. 配置项目

确保项目根目录存在 `vercel.json`：

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

### 3. 设置环境变量

在 Vercel 控制台或通过 CLI：

```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
```

### 4. 部署

```bash
vercel --prod
```

你的后端将可通过以下地址访问：`https://your-project.vercel.app/api/*`

## API 端点

### 健康检查

```
GET /api/health
```

服务正常运行时返回 `"OK"`。

### 认证

#### 注册

```
POST /api/auth/register
Content-Type: application/json

{
  "username": "字符串",
  "email": "字符串",
  "password": "字符串"
}

响应：{ "token": "jwt令牌", "username": "字符串" }
```

#### 登录

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "字符串",
  "password": "字符串"
}

响应：{ "token": "jwt令牌", "username": "字符串" }
```

#### GitHub OAuth

```
GET /api/auth/github?code=<授权码>

响应：{ "token": "jwt令牌", "username": "字符串" }
```

#### Google OAuth

```
GET /api/auth/google?code=<授权码>

响应：{ "token": "jwt令牌", "username": "字符串" }
```

### 题目市场

#### 列出题目

```
GET /api/market/problems

响应：[
  {
    "id": "uuid",
    "title": "字符串",
    "difficulty": "Easy|Medium|Hard",
    "tags": ["字符串"],
    "download_count": 数字,
    "created_at": "时间戳",
    "username": "字符串"
  }
]
```

#### 上传题目

```
POST /api/market/problems
Authorization: Bearer <jwt令牌>
Content-Type: application/json

{
  "title": "字符串",
  "content": { /* 完整的题目 JSON */ },
  "tags": ["字符串"],
  "difficulty": "Easy|Medium|Hard"
}

响应：{ /* 创建的题目 */ }
```

#### 下载题目

```
GET /api/market/problems/:id/download
Authorization: Bearer <jwt令牌>

响应：{
  "id": "uuid",
  "user_id": "uuid",
  "title": "字符串",
  "content": { /* 完整的题目 JSON */ },
  "tags": ["字符串"],
  "difficulty": "字符串",
  "download_count": 数字,
  "created_at": "时间戳"
}
```

## 项目结构

```
backend/
├── src/
│   ├── main.rs              # 入口点，Axum 路由设置
│   ├── auth/
│   │   └── mod.rs           # JWT 和密码哈希工具
│   ├── handlers/
│   │   ├── mod.rs
│   │   ├── auth.rs          # 认证处理器
│   │   └── market.rs        # 题目市场处理器
│   ├── models/
│   │   └── mod.rs           # 数据库模型（User、Problem）
│   └── error.rs             # 自定义错误类型
├── schema.sql               # PostgreSQL 架构
├── Cargo.toml               # Rust 依赖
└── .env                     # 环境变量（不提交到版本控制）
```

## 安全性

### ⚠️ 重要安全文档

**部署到生产环境前，请务必阅读：**

- **[安全审计报告](./SECURITY-AUDIT.md)** - 全面的安全分析
- **[安全修复总结](./SECURITY-FIXES-SUMMARY.md)** - 已修复和待处理的问题
- **[安全检查清单](./SECURITY-CHECKLIST.md)** - 部署前检查清单（必读）

### 安全特性

1. **JWT 认证**：强令牌认证，可配置过期时间
2. **密码哈希**：Argon2id（PHC 获奖算法）自动加盐
3. **输入验证**：所有用户输入经过格式和安全验证
4. **CORS 保护**：可配置来源白名单（生产环境无通配符）
5. **审计日志**：使用 tracing 记录关键操作
6. **错误处理**：生产环境错误消息不泄露敏感数据

### 安全要求

✅ **JWT_SECRET** 必须：
- 至少 32 字符长度
- 加密随机生成（使用 `openssl rand -base64 48`）
- 绝不使用默认值如 "secret"、"change-this" 等

✅ **ALLOWED_ORIGINS** 必须：
- 生产环境显式配置
- 无尾部斜杠
- 逗号分隔的精确域名列表

✅ **数据库**凭证：
- 使用连接池 URL（端口 6543）
- 启用 SSL/TLS
- 绝不提交 `.env` 文件

### 已实现的安全特性

✅ **安全响应头**
- X-Frame-Options、X-Content-Type-Options、CSP、HSTS 等

✅ **请求体大小限制**
- 每个请求最大 2MB

✅ **分页功能**
- 所有列表端点支持分页（最大 100 条/页）

✅ **输入验证**
- 用户名、邮箱、密码格式验证

✅ **密码安全**
- Argon2 哈希算法
- 强密码策略

✅ **JWT 安全**
- 安全密钥验证
- 7 天过期时间

✅ **CORS 白名单**
- 严格的来源控制

### 已知限制

以下功能**尚未实现**：

- ⚠️ **速率限制**（由于 tower_governor 0.3 API 限制，暂未启用）
  - 建议：升级到 tower_governor 0.8+ 或使用其他速率限制方案
- ⚠️ **OAuth CSRF 保护**（State 验证代码已准备，待 OAuth 完整实现后启用）
- ⚠️ 登录失败后账户锁定
- ⚠️ 密码重置功能
- ⚠️ 邮箱验证
- ⚠️ 双因素认证 (2FA)

完整的安全功能列表请参阅 [SECURITY-IMPROVEMENTS.md](./SECURITY-IMPROVEMENTS.md)。

## 故障排除

### 数据库连接问题

- 确保使用来自 Supabase 的**连接池 URL**
- 检查 Supabase 网络限制中是否允许你的 IP
- 验证连接池大小（默认：5 个连接）

### JWT 令牌错误

- 确保不同部署之间的 `JWT_SECRET` 匹配
- 检查令牌过期时间（默认：7 天）
- 验证 `Authorization: Bearer <token>` 头格式

### Vercel 部署失败

- 检查 Vercel 控制台中的构建日志
- 确保 `vercel-rust` 运行时配置正确
- 验证所有环境变量已设置

## 贡献

欢迎贡献！请确保：

1. 代码遵循 Rust 最佳实践并通过 `cargo clippy`
2. 所有测试通过 `cargo test`
3. API 变更在此 README 中记录

## 许可证

本项目采用 MIT 许可证。

## 支持

如有问题或疑问：
- GitHub Issues：https://github.com/zxypro1/OfflineLeetPractice/issues
- 文档：https://github.com/zxypro1/OfflineLeetPractice
