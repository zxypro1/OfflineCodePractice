# 部署注意事项 / Deployment Notes

**版本**: 1.0  
**日期**: 2025-12-31

---

## 🚨 重要提示 / Important Notice

### 速率限制当前未启用 / Rate Limiting Currently Disabled

由于 `tower_governor` 0.3 版本的 API 复杂性，速率限制功能当前处于禁用状态。在部署到生产环境前，**强烈建议**采用以下任一方案：

---

## 🛡️ 速率限制解决方案 / Rate Limiting Solutions

### 方案 A: Vercel/Cloudflare 级别限制（推荐）

**优点**: 无需修改代码，保护更全面

#### Vercel 配置

在 `vercel.json` 中添加：

```json
{
  "functions": {
    "api/**/*.rs": {
      "maxDuration": 10,
      "memory": 1024
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Rate-Limit",
          "value": "60"
        }
      ]
    }
  ]
}
```

然后在 Vercel Dashboard 中配置：
1. 进入项目设置 → Firewall
2. 启用 Rate Limiting
3. 配置规则：
   - `/api/auth/register`: 3 请求/小时
   - `/api/auth/login`: 10 请求/分钟
   - `/api/*`: 60 请求/分钟

#### Cloudflare 配置

1. 添加网站到 Cloudflare
2. 进入 Security → WAF → Rate Limiting Rules
3. 创建规则：

```
规则 1: 注册限制
- URI Path contains "/api/auth/register"
- Requests: 3 per 1 hour
- Action: Block

规则 2: 登录限制
- URI Path contains "/api/auth/login"
- Requests: 10 per 1 minute
- Action: Block

规则 3: API 限制
- URI Path starts with "/api/"
- Requests: 60 per 1 minute
- Action: Challenge
```

---

### 方案 B: 升级 tower_governor（需要代码修改）

#### 步骤

1. 更新 `backend/Cargo.toml`:

```toml
[dependencies]
tower_governor = "0.8"  # 升级到 0.8+
```

2. 更新 `backend/src/middleware/rate_limit.rs`:

```rust
use tower_governor::{
    governor::GovernorConfigBuilder,
    key_extractor::SmartIpKeyExtractor,
    GovernorLayer,
};

pub fn auth_rate_limiter() -> GovernorLayer {
    let config = GovernorConfigBuilder::default()
        .requests_per_second(10)
        .burst_size(15)
        .use_headers()
        .finish()
        .unwrap();

    GovernorLayer::with_config(config)
}
```

3. 重新编译和测试：

```bash
cd backend
cargo check
cargo test
```

---

### 方案 C: 使用 Nginx 反向代理（自托管）

如果自托管，在 Nginx 前添加速率限制：

```nginx
http {
    # 定义速率限制区域
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=register:10m rate=3r/h;
    limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;

    server {
        listen 443 ssl;
        server_name your-api-domain.com;

        # 注册端点
        location /api/auth/register {
            limit_req zone=register burst=1 nodelay;
            proxy_pass http://localhost:3001;
        }

        # 登录端点
        location /api/auth/login {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://localhost:3001;
        }

        # 其他 API
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://localhost:3001;
        }
    }
}
```

---

## 📋 部署前检查清单 / Pre-Deployment Checklist

### 环境变量

确保所有必需的环境变量已设置：

```bash
# 必需
DATABASE_URL=postgresql://...  # Supabase 连接池 URL
JWT_SECRET=<32+ 字符的强随机密钥>
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ALLOWED_ORIGINS=https://your-frontend.vercel.app

# 可选
RUST_LOG=info
```

### 验证 JWT_SECRET

```bash
# JWT_SECRET 必须满足：
# - 至少 32 字符
# - 不能是 "secret"、"test"、"password" 等弱密钥
# - 推荐生成方式：
openssl rand -base64 48
```

### 验证数据库连接

```bash
# 测试数据库连接
psql "$DATABASE_URL" -c "SELECT 1;"
```

### CORS 配置

确保 `ALLOWED_ORIGINS` 包含所有合法的前端域名：

```bash
# 开发环境
ALLOWED_ORIGINS=http://localhost:3000

# 生产环境
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com
```

---

## 🔧 Vercel 部署步骤 / Vercel Deployment Steps

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 配置 vercel.json

确保包含以下配置：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/src/main.rs",
      "use": "vercel-rust@4.1.0",
      "config": {
        "distDir": "backend"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/src/main.rs"
    }
  ]
}
```

### 3. 设置环境变量

```bash
# 在 Vercel Dashboard 中设置，或使用 CLI：
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add ALLOWED_ORIGINS
```

### 4. 部署

```bash
# 预览部署
vercel

# 生产部署
vercel --prod
```

### 5. 验证部署

```bash
# 检查健康端点
curl https://your-api.vercel.app/api/health

# 检查安全响应头
curl -I https://your-api.vercel.app/api/health

# 测试分页
curl "https://your-api.vercel.app/api/market/problems?page=1&limit=10"
```

---

## 🔒 安全配置建议 / Security Configuration Recommendations

### 1. 启用 HTTPS Only

确保所有流量都通过 HTTPS：

- Vercel 自动启用 HTTPS
- 如自托管，配置 SSL 证书（Let's Encrypt）

### 2. 配置 HSTS

在生产环境，HSTS 会自动启用（见 `security_headers.rs`）。

### 3. 设置 Supabase 网络限制

在 Supabase Dashboard 中：
1. 进入 Settings → Database
2. 启用 "Connection Pooling"
3. 在 "Network Restrictions" 中添加 Vercel IP 范围

### 4. 监控和告警

#### Vercel Integration

安装 Sentry 或其他监控工具：

```bash
npm install --save @sentry/nextjs
```

在代码中配置：

```rust
use tracing_subscriber;

tracing_subscriber::fmt()
    .with_env_filter("info")
    .init();
```

---

## 📊 性能优化建议 / Performance Optimization

### 1. 数据库连接池

当前配置：

```rust
PgPoolOptions::new()
    .max_connections(5)  // Vercel Serverless 推荐值
    .connect(&database_url)
    .await?
```

如流量增大，可调整为：
- 低流量: 3-5 连接
- 中流量: 10-15 连接
- 高流量: 20-30 连接（需升级 Supabase 套餐）

### 2. JWT 过期时间

当前: 7 天

根据安全需求调整：
- 高安全: 1 小时 + Refresh Token
- 平衡: 7 天（当前配置）
- 长期: 30 天（不推荐）

### 3. 分页默认值

当前配置：
- 默认 page: 1
- 默认 limit: 20
- 最大 limit: 100

根据数据量调整：
- 小数据集: limit 50
- 大数据集: limit 10-20
- 超大数据集: limit 10，启用游标分页

---

## 🐛 常见问题 / Troubleshooting

### 问题 1: 数据库连接失败

**症状**: `error connecting to database`

**解决方案**:
1. 检查 `DATABASE_URL` 格式是否正确
2. 确认使用的是 Supabase 连接池 URL（端口 6543）
3. 检查 Supabase 网络限制
4. 验证连接池大小

### 问题 2: JWT 验证失败

**症状**: `Unauthorized` 或 `Invalid token`

**解决方案**:
1. 确认 `JWT_SECRET` 在所有部署中一致
2. 检查 token 是否过期
3. 验证 `Authorization: Bearer <token>` 格式

### 问题 3: CORS 错误

**症状**: `CORS policy: No 'Access-Control-Allow-Origin'`

**解决方案**:
1. 检查 `ALLOWED_ORIGINS` 是否包含前端域名
2. 确认没有尾部斜杠
3. 验证协议（http/https）匹配

### 问题 4: 速率限制警告

**症状**: 日志中出现 `Rate limiting is currently disabled`

**解决方案**:
- 这是预期行为
- 使用上述方案 A、B 或 C 启用速率限制

---

## 📞 支持 / Support

如遇到问题：

1. **查看日志**: Vercel Dashboard → Deployments → [选择部署] → Runtime Logs
2. **检查文档**: 
   - [SECURITY-IMPROVEMENTS.md](./SECURITY-IMPROVEMENTS.md)
   - [README.md](./README.md)
3. **提交 Issue**: https://github.com/zxypro1/OfflineLeetPractice/issues

---

## ✅ 部署后验证 / Post-Deployment Verification

### 自动化测试脚本

```bash
#!/bin/bash

API_URL="https://your-api.vercel.app"

echo "1. 检查健康端点..."
curl -f $API_URL/api/health || exit 1

echo "2. 检查安全响应头..."
curl -sI $API_URL/api/health | grep -q "X-Frame-Options: DENY" || exit 1

echo "3. 测试分页功能..."
curl -f "$API_URL/api/market/problems?page=1&limit=10" || exit 1

echo "4. 测试输入验证（应失败）..."
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"a","email":"invalid","password":"weak"}' \
  | grep -q "error" || exit 1

echo "✅ 所有检查通过！"
```

保存为 `verify-deployment.sh`，然后运行：

```bash
chmod +x verify-deployment.sh
./verify-deployment.sh
```

---

**部署前必读**: 请确保选择并实施了速率限制方案（A、B 或 C）后再投入生产使用。

**最后更新**: 2025-12-31
