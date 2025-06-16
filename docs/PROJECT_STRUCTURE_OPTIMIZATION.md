# RWA项目平台结构优化方案

## 当前项目结构问题分析

### 1. 文件重复和分散
- **HTML文件重复**：根目录和static目录都有相同的HTML文件
- **JavaScript文件分散**：部分JS文件在根目录，部分在static/js目录
- **CSS文件分散**：asset_management.css在根目录，其他CSS在static/css目录

### 2. 目录结构不清晰
- 缺乏明确的前端/后端分离
- 静态资源组织不够规范
- 配置文件和源码混合

### 3. 文件命名不一致
- 部分文件使用下划线命名（snake_case）
- 部分文件使用连字符命名（kebab-case）

## 优化后的项目结构

```
rwa-project-platform/
├── docs/                           # 文档目录
│   ├── README.md
│   ├── DEMO_GUIDE.md
│   ├── DEMO_WORKFLOW.md
│   ├── DEPLOYMENT.md
│   └── CLOUDFLARE_SETUP.md
├── config/                         # 配置文件目录
│   ├── cloudflare/
│   │   ├── _headers
│   │   ├── _redirects
│   │   └── wrangler.toml
│   └── cors.json
├── database/                       # 数据库相关
│   ├── schema.sql
│   └── seed.sql
├── functions/                      # Cloudflare Functions
│   └── api/
│       ├── ai-risk-assessment.js
│       ├── projects.js
│       ├── upload.js
│       └── users.js
├── scripts/                        # 构建和部署脚本
│   ├── build-functions.js
│   ├── build-static.js
│   └── demo-script.js
├── src/                           # 源代码目录
│   ├── assets/                    # 静态资源
│   │   ├── css/
│   │   │   ├── main.css
│   │   │   ├── auth.css
│   │   │   ├── marketplace.css
│   │   │   └── asset-management.css
│   │   ├── js/
│   │   │   ├── core/              # 核心功能
│   │   │   │   ├── api-client.js
│   │   │   │   ├── auth.js
│   │   │   │   └── ai-risk-engine.js
│   │   │   ├── components/        # 组件
│   │   │   │   ├── form-handler.js
│   │   │   │   ├── form-processor.js
│   │   │   │   ├── form-ui-updater.js
│   │   │   │   └── form-validator.js
│   │   │   ├── data/              # 数据管理
│   │   │   │   ├── project-data-generator.js
│   │   │   │   └── project-data-manager.js
│   │   │   └── utils/             # 工具函数
│   │   └── images/                # 图片资源
│   ├── pages/                     # 页面文件
│   │   ├── index.html
│   │   ├── marketplace/
│   │   │   ├── rwa-marketplace.html
│   │   │   └── nft-marketplace.html
│   │   ├── forms/
│   │   │   ├── rwa-client-form.html
│   │   │   └── rwa-smart-form.html
│   │   ├── management/
│   │   │   └── asset-management.html
│   │   └── details/
│   │       └── project-detail.html
│   └── components/                # 可复用组件
│       ├── header.html
│       ├── footer.html
│       └── navigation.html
├── dist/                          # 构建输出目录
├── tests/                         # 测试文件
├── .gitignore
├── package.json
└── package-lock.json
```

## 重构步骤

### 第一阶段：目录重组
1. 创建新的目录结构
2. 移动文档文件到docs目录
3. 移动配置文件到config目录
4. 创建src目录作为源码根目录

### 第二阶段：文件整理
1. 合并重复的HTML文件
2. 统一JavaScript文件到src/assets/js目录
3. 统一CSS文件到src/assets/css目录
4. 按功能模块组织文件

### 第三阶段：命名规范化
1. 统一使用kebab-case命名
2. 更新所有文件引用路径
3. 更新构建脚本

### 第四阶段：构建优化
1. 更新package.json脚本
2. 修改构建脚本以适应新结构
3. 更新Cloudflare配置

## 优化收益

### 1. 提高可维护性
- 清晰的目录结构便于开发者理解
- 模块化组织便于功能扩展
- 统一的命名规范减少混淆

### 2. 提升开发效率
- 快速定位文件位置
- 避免重复文件的维护成本
- 便于团队协作

### 3. 优化构建流程
- 更好的资源管理
- 支持模块化打包
- 便于实现代码分割

### 4. 增强扩展性
- 为未来功能预留空间
- 支持组件化开发
- 便于集成第三方库

## 实施建议

1. **渐进式重构**：分阶段实施，避免一次性大改动
2. **保持向后兼容**：重构过程中确保现有功能正常
3. **更新文档**：及时更新开发文档和部署指南
4. **测试验证**：每个阶段完成后进行充分测试

## 注意事项

1. **路径更新**：所有文件引用路径需要相应更新
2. **构建脚本**：需要修改构建和部署脚本
3. **Cloudflare配置**：可能需要调整Pages配置
4. **团队沟通**：确保团队成员了解新的项目结构