# RWA项目结构重构执行指南

## 概述

本指南将帮助您安全地重构RWA项目的目录结构，提高项目的可维护性和开发效率。

## 重构前准备

### 1. 备份项目
```bash
# 创建完整项目备份
cp -r rwa-project-platform rwa-project-platform-backup

# 或者使用Git提交当前状态
git add .
git commit -m "重构前的项目状态备份"
```

### 2. 确认依赖
```bash
# 确保所有依赖已安装
npm install

# 测试当前项目是否正常运行
npm run dev
```

## 自动化重构（推荐）

### 使用重构脚本
```bash
# 执行自动重构脚本
node scripts/restructure-project.js
```

脚本将自动完成以下操作：
- ✅ 创建项目备份
- ✅ 创建新的目录结构
- ✅ 移动文档文件到docs目录
- ✅ 移动配置文件到config目录
- ✅ 整理JavaScript文件到模块化目录
- ✅ 整理CSS文件
- ✅ 整理HTML文件
- ✅ 更新package.json脚本
- ✅ 清理空目录

## 手动重构步骤

如果您希望手动执行重构，请按以下步骤操作：

### 第一阶段：创建目录结构

```bash
# 创建新的目录结构
mkdir -p docs
mkdir -p config/cloudflare
mkdir -p src/assets/{css,js/{core,components,data,utils},images}
mkdir -p src/pages/{marketplace,forms,management,details}
mkdir -p src/components
mkdir -p dist
mkdir -p tests
```

### 第二阶段：移动文档文件

```bash
# 移动文档到docs目录
mv README.md docs/
mv DEMO_GUIDE.md docs/
mv DEMO_WORKFLOW.md docs/
mv DEPLOYMENT.md docs/
mv CLOUDFLARE_SETUP.md docs/
```

### 第三阶段：移动配置文件

```bash
# 移动配置文件
mv wrangler.toml config/cloudflare/
mv _headers config/cloudflare/
mv _redirects config/cloudflare/
mv cors.json config/
```

### 第四阶段：整理源代码文件

#### JavaScript文件
```bash
# 核心功能
mv static/js/api-client.js src/assets/js/core/
mv static/js/auth.js src/assets/js/core/
mv ai_risk_engine.js src/assets/js/core/ai-risk-engine.js

# 组件
mv form_handler.js src/assets/js/components/form-handler.js
mv form_processor.js src/assets/js/components/form-processor.js
mv form_ui_updater.js src/assets/js/components/form-ui-updater.js
mv form_validator.js src/assets/js/components/form-validator.js

# 数据管理
mv project_data_generator.js src/assets/js/data/project-data-generator.js
mv project_data_manager.js src/assets/js/data/project-data-manager.js
```

#### CSS文件
```bash
# 移动CSS文件
mv asset_management.css src/assets/css/asset-management.css
mv static/css/auth.css src/assets/css/
```

#### HTML文件
```bash
# 移动HTML文件
mv index.html src/pages/
mv rwa_marketplace.html src/pages/marketplace/rwa-marketplace.html
mv nft_marketplace.html src/pages/marketplace/nft-marketplace.html
mv rwa_client_form.html src/pages/forms/rwa-client-form.html
mv rwa_smart_form.html src/pages/forms/rwa-smart-form.html
mv asset_management.html src/pages/management/asset-management.html
mv project_detail.html src/pages/details/project-detail.html
```

## 重构后配置

### 1. 更新构建脚本

使用新的构建脚本：
```bash
# 复制新的构建脚本
cp scripts/build-static-new.js scripts/build-static.js
```

### 2. 更新package.json

确保package.json中的脚本已更新：
```json
{
  "scripts": {
    "dev": "wrangler pages dev dist --compatibility-date=2024-01-01",
    "build": "npm run build:static && npm run build:functions",
    "build:static": "node scripts/build-static.js",
    "deploy": "wrangler pages deploy dist",
    "preview": "wrangler pages dev dist --local"
  }
}
```

### 3. 更新HTML文件中的路径引用

重构脚本会自动更新大部分路径，但您可能需要手动检查和调整：

```html
<!-- 旧路径 -->
<link rel="stylesheet" href="css/style.css">
<script src="js/script.js"></script>

<!-- 新路径 -->
<link rel="stylesheet" href="assets/css/style.css">
<script src="assets/js/core/script.js"></script>
```

## 测试重构结果

### 1. 构建测试
```bash
# 执行构建
npm run build

# 检查构建输出
ls -la dist/
```

### 2. 功能测试
```bash
# 启动开发服务器
npm run dev

# 在浏览器中测试所有页面功能
```

### 3. 部署测试
```bash
# 预览部署
npm run preview

# 实际部署（确认无误后）
npm run deploy
```

## 常见问题解决

### 1. 路径引用错误

**问题**：页面加载时出现404错误

**解决**：检查HTML文件中的资源路径是否正确更新

```bash
# 搜索可能的错误路径
grep -r "static/" src/
grep -r "../" src/
```

### 2. 构建失败

**问题**：npm run build失败

**解决**：
1. 检查所有文件是否正确移动
2. 确认构建脚本路径正确
3. 检查package.json脚本配置

### 3. 功能异常

**问题**：某些JavaScript功能不工作

**解决**：
1. 检查浏览器控制台错误
2. 确认JavaScript文件路径正确
3. 检查模块依赖关系

## 回滚方案

如果重构过程中出现问题，可以使用以下方法回滚：

### 使用备份恢复
```bash
# 删除当前目录
rm -rf rwa-project-platform

# 恢复备份
cp -r rwa-project-platform-backup rwa-project-platform
```

### 使用Git恢复
```bash
# 恢复到重构前的状态
git reset --hard HEAD~1

# 或者恢复到特定提交
git reset --hard <commit-hash>
```

## 重构完成检查清单

- [ ] 所有文件已正确移动到新位置
- [ ] HTML文件中的路径引用已更新
- [ ] package.json脚本已更新
- [ ] 构建脚本正常工作
- [ ] 所有页面功能正常
- [ ] 开发服务器正常启动
- [ ] 部署流程正常
- [ ] 文档已更新
- [ ] 团队成员已通知新的项目结构

## 后续优化建议

1. **模块化改进**：考虑使用ES6模块或构建工具进行进一步模块化
2. **代码分割**：实现按需加载以提高性能
3. **自动化测试**：添加单元测试和集成测试
4. **CI/CD优化**：更新持续集成流程以适应新结构
5. **文档完善**：更新开发文档和API文档

## 支持

如果在重构过程中遇到问题，请：
1. 检查本指南的常见问题部分
2. 查看项目的备份文件
3. 联系开发团队获取支持

---

**注意**：重构是一个重要的操作，请确保在生产环境中实施前充分测试。