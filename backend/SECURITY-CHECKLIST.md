# 安全部署检查清单 / Security Deployment Checklist

在部署到生产环境之前，请确保完成以下所有检查项。  
Before deploying to production, ensure all items are completed.

---

## 🔴 必须完成（部署前）/ MUST DO (Before Deployment)

### 环境变量 / Environment Variables

- [ ] **JWT_SECRET 已设置为强随机字符串**
  - [ ] 至少 32 字符长度
  - [ ] 使用 `openssl rand -base64 48` 生成
  - [ ] 不包含 "secret", "change", "example" 等词
  - [ ] 在 Vercel 环境变量中设置
  
  ```bash
  # 生成安全的 JWT 密钥
  openssl rand -base64 48
  
  # 在 Vercel 中设置
  vercel env add JWT_SECRET production
  ```

- [ ] **DATABASE_URL 已正确配置**
  - [ ] 使用 Supabase 连接池 URL (端口 6543)
  - [ ] 启用 SSL/TLS 连接
  - [ ] 数据库密码强度足够（16+ 字符）
  
- [ ] **ALLOWED_ORIGINS 已配置**
  - [ ] 只包含实际的生产域名
  - [ ] 格式正确（无尾部斜杠）
  - [ ] 已测试 CORS 配置
  
  ```bash
  # 示例
  ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
  ```

### OAuth 配置（如果使用）/ OAuth Configuration

- [ ] **GitHub OAuth**
  - [ ] GITHUB_CLIENT_ID 已设置
  - [ ] GITHUB_CLIENT_SECRET 已安全存储
  - [ ] 回调 URL 已在 GitHub 应用设置中配置
  - [ ] 限制了应用权限（最小权限原则）

- [ ] **Google OAuth**
  - [ ] GOOGLE_CLIENT_ID 已设置
  - [ ] GOOGLE_CLIENT_SECRET 已安全存储
  - [ ] 已在 Google Cloud Console 配置授权来源
  - [ ] 已添加授权重定向 URI

---

## 🟡 强烈推荐 / Highly Recommended

### 代码安全 / Code Security

- [ ] **已审查所有代码更改**
  - [ ] 无硬编码的凭证或密钥
  - [ ] 所有数据库查询使用参数化查询
  - [ ] 输入验证已实施
  - [ ] 错误消息不泄露敏感信息

- [ ] **日志配置**
  - [ ] 生产环境日志级别设置为 `info` 或 `warn`
  - [ ] 敏感数据（密码、令牌）不记录到日志
  - [ ] 关键操作有审计日志

### 数据库安全 / Database Security

- [ ] **Supabase 安全设置**
  - [ ] 启用行级安全策略 (RLS)
  - [ ] 数据库访问仅通过后端 API
  - [ ] 定期备份已启用
  - [ ] 监控和告警已配置

- [ ] **连接池配置**
  ```rust
  PgPoolOptions::new()
      .max_connections(5)  // ✓ 适合 serverless
      .acquire_timeout(std::time::Duration::from_secs(3))
      .connect(&database_url)
  ```

### 部署配置 / Deployment Configuration

- [ ] **Vercel 设置**
  - [ ] 环境变量仅在 Production 环境设置
  - [ ] 启用了 HTTPS（Vercel 默认）
  - [ ] 配置了自定义域名（推荐）
  - [ ] 启用了边缘缓存（如适用）

- [ ] **监控和告警**
  - [ ] 设置了错误追踪（如 Sentry）
  - [ ] 配置了性能监控
  - [ ] 异常情况会发送告警

---

## 🟢 建议实施 / Recommended

### 高级安全特性 / Advanced Security Features

- [ ] **速率限制**
  ```toml
  [dependencies]
  tower-governor = "0.1"
  ```
  - [ ] 登录端点限制：10 req/min
  - [ ] 注册端点限制：5 req/hour
  - [ ] API 端点限制：100 req/min

- [ ] **请求体大小限制**
  ```rust
  .layer(RequestBodyLimitLayer::new(1024 * 1024)) // 1MB
  ```

- [ ] **安全响应头**
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Strict-Transport-Security
  - [ ] Content-Security-Policy

### 账户安全 / Account Security

- [ ] **密码策略增强**
  - [ ] 最小长度 8 字符（已实现 ✓）
  - [ ] 要求大小写字母和数字（已实现 ✓）
  - [ ] 可选：要求特殊字符
  - [ ] 可选：密码历史检查

- [ ] **账户保护**
  - [ ] 登录失败次数限制
  - [ ] 账户锁定机制
  - [ ] 密码重置功能
  - [ ] 邮件验证

- [ ] **Session 管理**
  - [ ] Token 刷新机制
  - [ ] Token 撤销功能
  - [ ] 强制登出功能

### 数据保护 / Data Protection

- [ ] **敏感数据处理**
  - [ ] 用户邮箱不在公开 API 中暴露
  - [ ] 个人信息访问控制
  - [ ] 符合 GDPR/CCPA（如适用）

- [ ] **审计和合规**
  - [ ] 保存关键操作日志
  - [ ] 定期安全审计
  - [ ] 漏洞扫描

---

## 📝 部署检查清单 / Pre-Deployment Checklist

### 1. 环境准备
```bash
# 检查所有环境变量
vercel env ls

# 验证生产环境配置
vercel env pull .env.production

# 检查 JWT 密钥强度
echo $JWT_SECRET | wc -c  # 应该 >= 32
```

### 2. 代码审查
```bash
# Rust 代码检查
cd backend
cargo clippy -- -D warnings
cargo fmt --check

# 安全审计
cargo audit
```

### 3. 测试
```bash
# 运行所有测试
cargo test

# 手动测试关键流程
# - 注册新用户
# - 登录
# - 上传题目（需认证）
# - 下载题目（需认证）
# - 错误处理
```

### 4. 部署
```bash
# 部署到生产环境
vercel --prod

# 验证部署
curl https://your-api.vercel.app/api/health

# 测试 CORS
curl -H "Origin: https://your-frontend.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: authorization" \
     -X OPTIONS \
     https://your-api.vercel.app/api/auth/login
```

### 5. 监控
- 检查 Vercel 日志
- 监控数据库连接
- 验证错误率
- 检查响应时间

---

## 🔒 安全最佳实践提醒 / Security Best Practices Reminder

1. **永远不要**
   - ❌ 提交 `.env` 文件到版本控制
   - ❌ 在日志中记录密码或令牌
   - ❌ 使用默认或示例密钥
   - ❌ 在客户端存储敏感数据
   - ❌ 信任用户输入

2. **始终**
   - ✅ 使用参数化查询（SQLx 已提供）
   - ✅ 验证所有输入
   - ✅ 使用 HTTPS
   - ✅ 定期更新依赖
   - ✅ 记录安全事件

3. **定期**
   - 🔄 审查访问日志
   - 🔄 更新依赖包 (`cargo update`)
   - 🔄 检查安全公告
   - 🔄 备份数据库
   - 🔄 审计权限

---

## 🚨 应急响应计划 / Incident Response Plan

### 如果发现安全问题 / If Security Issue Found

1. **立即行动**
   - 评估影响范围
   - 如果严重，考虑临时关闭服务
   - 保存相关日志

2. **修复**
   - 修复漏洞
   - 测试修复方案
   - 紧急部署

3. **后续**
   - 通知受影响用户（如需要）
   - 更新安全文档
   - 审查类似问题

### 联系方式 / Contact

- GitHub Issues: https://github.com/zxypro1/OfflineLeetPractice/issues
- Security Email: [设置专用安全邮箱]

---

## ✅ 最终确认 / Final Confirmation

部署前，确认以下声明：

- [ ] 我已阅读并理解所有安全建议
- [ ] 所有高危问题已修复
- [ ] 环境变量已正确配置
- [ ] 已进行充分测试
- [ ] 监控和告警已就绪
- [ ] 应急响应计划已准备

**部署人员签名**: ________________  
**日期**: ________________

---

*Last Updated: 2025-12-31*  
*Version: 1.0*
