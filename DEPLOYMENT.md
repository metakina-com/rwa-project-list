# RWA项目平台 - Cloudflare部署指南

## 📋 部署前检查清单

### ✅ 项目结构完整性
- [x] `static/` - 静态文件目录
- [x] `functions/api/` - API函数
- [x] `database/` - 数据库架构和种子数据
- [x] `scripts/` - 构建脚本
- [x] `wrangler.toml` - Cloudflare配置
- [x] `package.json` - 项目依赖
- [x] `_headers` - HTTP头配置
- [x] `_redirects` - 路由重定向

### ✅ 必要配置文件
- [x] Wrangler配置文件
- [x] 构建脚本
- [x] 数据库架构
- [x] API函数实现
- [x] 安全头配置

## 🚀 部署步骤

### 1. 环境准备

```bash
# 安装依赖
npm install

# 登录Cloudflare
npx wrangler login
```

### 2. 数据库设置

```bash
# 创建D1数据库
npx wrangler d1 create rwa-database

# 更新wrangler.toml中的database_id
# 将返回的database_id替换到wrangler.toml中

# 应用数据库架构
npx wrangler d1 migrations apply rwa-database --local
npx wrangler d1 migrations apply rwa-database --remote

# 导入种子数据
npx wrangler d1 execute rwa-database --file=./database/seed.sql --local
npx wrangler d1 execute rwa-database --file=./database/seed.sql --remote
```

### 3. KV命名空间设置

```bash
# 创建KV命名空间
npx wrangler kv:namespace create "CACHE"
npx wrangler kv:namespace create "CACHE" --preview

# 更新wrangler.toml中的KV namespace ID
```

### 4. 构建项目

```bash
# 运行构建脚本
npm run build

# 或者分别运行
npm run build:static
npm run build:functions
```

### 5. 本地测试

```bash
# 启动本地开发服务器
npm run dev

# 或者预览模式
npm run preview
```

### 6. 部署到生产环境

```bash
# 部署到Cloudflare Pages
npm run deploy

# 或者直接使用wrangler
npx wrangler pages deploy static
```

## ⚙️ 配置说明

### wrangler.toml 关键配置

```toml
# 需要更新的配置项
[d1_databases]
database_id = "your-actual-database-id"  # 替换为实际的数据库ID

[kv_namespaces]
id = "your-actual-kv-namespace-id"       # 替换为实际的KV命名空间ID
preview_id = "your-preview-kv-id"        # 替换为预览环境KV ID

# 注意：Cloudflare Pages 不支持 [build] 和 [[routes]] 配置
# 构建和路由由 Pages 自动处理
```

### 环境变量设置

在Cloudflare Pages控制台中设置以下环境变量：

```
ENVIRONMENT=production
API_BASE_URL=https://your-project.pages.dev
CSP_HEADER=default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
```

## 🔧 API端点

部署后可用的API端点：

- `GET /api/projects` - 获取项目列表
- `GET /api/projects/:id` - 获取项目详情
- `POST /api/projects` - 创建新项目
- `POST /api/ai-risk-assessment` - AI风险评估

## 📱 页面路由

- `/` - 首页
- `/marketplace` - RWA市场
- `/client-form` - 客户表单
- `/smart-form` - 智能表单
- `/asset-management` - 资产管理
- `/nft-marketplace` - NFT市场
- `/project/:id` - 项目详情

## 🛡️ 安全配置

### CSP (内容安全策略)
已在`_headers`文件中配置了严格的CSP策略，包括：
- 脚本源限制
- 样式源限制
- 图片源限制
- 连接源限制

### CORS配置
API端点已配置CORS头，支持跨域请求。

## 📊 监控和日志

### Cloudflare Analytics
- 访问Cloudflare Pages控制台查看流量分析
- 监控API调用频率和错误率

### 错误追踪
- 检查Wrangler日志：`npx wrangler pages deployment tail`
- 查看函数执行日志

## 🔄 CI/CD 集成

### GitHub Actions (推荐)

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: rwa-project-platform
          directory: static
```

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查database_id是否正确
   - 确认数据库已创建并应用了架构

2. **API函数404错误**
   - 检查functions目录结构
   - 确认路由配置正确

3. **静态资源加载失败**
   - 检查_headers文件中的CSP配置
   - 确认文件路径正确

4. **KV存储访问失败**
   - 检查KV命名空间ID
   - 确认权限配置

### 调试命令

```bash
# 查看部署状态
npx wrangler pages deployment list

# 查看实时日志
npx wrangler pages deployment tail

# 测试数据库连接
npx wrangler d1 execute rwa-database --command="SELECT COUNT(*) FROM projects"

# 测试KV存储
npx wrangler kv:key list --namespace-id=your-kv-id
```

## 📞 支持

如遇到部署问题，请检查：
1. Cloudflare Pages文档
2. Wrangler CLI文档
3. 项目GitHub Issues

---

**部署完成后，你的RWA项目平台将在Cloudflare的全球CDN上运行，享受极速访问和高可用性！** 🌍✨