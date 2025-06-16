# Cloudflare 服务配置指南

本项目使用 Cloudflare 的多项服务来提供完整的 RWA 项目管理平台功能。

## 服务概览

- **Cloudflare Pages**: 静态网站托管
- **Cloudflare Workers**: 无服务器 API 后端
- **Cloudflare D1**: SQLite 数据库
- **Cloudflare R2**: 对象存储（文件上传）
- **Cloudflare Workers AI**: AI 风险评估
- **Cloudflare KV**: 键值存储（缓存）

## 配置步骤

### 1. 创建 Cloudflare D1 数据库

```bash
# 创建生产数据库
npx wrangler d1 create rwa-database

# 创建开发数据库（可选）
npx wrangler d1 create rwa-database-dev

# 执行数据库迁移
npx wrangler d1 execute rwa-database --file=./database/schema.sql
```

### 2. 创建 Cloudflare R2 存储桶

```bash
# 创建生产存储桶
npx wrangler r2 bucket create rwa-project-files

# 创建预览存储桶（可选）
npx wrangler r2 bucket create rwa-project-files-preview
```

### 3. 创建 KV 命名空间

```bash
# 创建缓存命名空间
npx wrangler kv:namespace create "CACHE"

# 创建预览命名空间（可选）
npx wrangler kv:namespace create "CACHE" --preview
```

### 4. 更新 wrangler.toml 配置

将创建的资源 ID 更新到 `wrangler.toml` 文件中：

```toml
[[d1_databases]]
binding = "DB"
database_name = "rwa-database"
database_id = "your-actual-database-id"  # 替换为实际 ID

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "rwa-project-files"

[[kv_namespaces]]
binding = "CACHE"
id = "your-actual-kv-id"  # 替换为实际 ID
```

### 5. 配置 R2 存储桶 CORS

为了支持前端文件上传，需要配置 R2 存储桶的 CORS 策略：

```bash
# 创建 cors.json 文件
echo '[
  {
    "AllowedOrigins": ["https://rwa-project-platform.pages.dev", "http://localhost:8788"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]' > cors.json

# 应用 CORS 配置
npx wrangler r2 bucket cors put rwa-project-files --file cors.json
```

### 6. 设置自定义域名（可选）

如果需要为 R2 存储桶设置自定义域名：

1. 在 Cloudflare 仪表板中添加自定义域名
2. 更新 `upload.js` 中的文件 URL 生成逻辑
3. 配置 DNS 记录指向 R2 存储桶

## 环境变量配置

在 Cloudflare Pages 项目设置中配置以下环境变量：

```
ENVIRONMENT=production
API_BASE_URL=https://rwa-project-platform.pages.dev
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=https://rwa-project-platform.pages.dev
```

## 部署

### 使用 Cloudflare Pages

1. 连接 GitHub 仓库到 Cloudflare Pages
2. 设置构建配置：
   - 构建命令：`npm run build`（如果有）
   - 输出目录：`static`
3. 配置环境变量
4. 部署

### 使用 Wrangler CLI

```bash
# 部署 Workers
npx wrangler deploy

# 部署 Pages
npx wrangler pages deploy static
```

## 数据库管理

### 查看数据库内容

```bash
# 连接到数据库
npx wrangler d1 execute rwa-database --command="SELECT * FROM projects LIMIT 10;"

# 查看表结构
npx wrangler d1 execute rwa-database --command=".schema"
```

### 备份数据库

```bash
# 导出数据
npx wrangler d1 export rwa-database --output=backup.sql
```

### 恢复数据库

```bash
# 从备份恢复
npx wrangler d1 execute rwa-database --file=backup.sql
```

## 监控和日志

### 查看 Workers 日志

```bash
# 实时查看日志
npx wrangler tail

# 查看特定 Worker 的日志
npx wrangler tail --name rwa-project-platform
```

### 监控指标

在 Cloudflare 仪表板中可以查看：
- 请求数量和延迟
- 错误率
- 数据库查询性能
- 存储使用情况

## 安全配置

### API 安全

1. 配置 CORS 策略
2. 实施速率限制
3. 验证文件上传类型和大小
4. 使用 HTTPS

### 数据库安全

1. 使用参数化查询防止 SQL 注入
2. 实施访问控制
3. 定期备份数据

### 文件存储安全

1. 验证文件类型
2. 限制文件大小
3. 扫描恶意文件
4. 设置适当的访问权限

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `wrangler.toml` 中的数据库 ID
   - 确认数据库已创建并迁移

2. **文件上传失败**
   - 检查 R2 存储桶配置
   - 验证 CORS 设置
   - 确认文件大小限制

3. **AI 评估失败**
   - 检查 Workers AI 绑定
   - 验证模型可用性
   - 查看错误日志

### 调试命令

```bash
# 本地开发
npx wrangler dev

# 查看配置
npx wrangler whoami
npx wrangler kv:namespace list
npx wrangler r2 bucket list
npx wrangler d1 list
```

## 成本优化

1. **合理使用 Workers AI**
   - 实施缓存机制
   - 批量处理请求
   - 选择合适的模型

2. **优化 R2 存储**
   - 设置生命周期策略
   - 压缩文件
   - 清理无用文件

3. **数据库优化**
   - 使用索引
   - 优化查询
   - 定期清理数据

## 扩展功能

### 添加队列处理

```bash
# 创建队列
npx wrangler queues create rwa-processing-queue
```

### 添加分析功能

```bash
# 创建分析数据集
npx wrangler analytics-engine create rwa-analytics
```

## 支持

如果遇到问题，请查看：
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)