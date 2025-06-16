# 项目结构说明

## 重新组织后的目录结构

```
rwa-project-list/
├── src/                          # 源代码目录
│   ├── pages/                    # 页面文件
│   │   ├── index_original.html   # 主页（从根目录移动）
│   │   ├── rwa_marketplace.html  # RWA市场页面
│   │   ├── project_detail.html   # 项目详情页面
│   │   ├── nft_marketplace.html  # NFT市场页面
│   │   ├── rwa_client_form.html  # 客户表单页面
│   │   └── rwa_smart_form.html   # 智能表单页面
│   ├── scripts/                  # JavaScript文件
│   │   ├── ai_risk_engine.js     # AI风险引擎
│   │   ├── form_handler.js       # 表单处理器
│   │   ├── form_processor.js     # 表单处理器
│   │   ├── form_ui_updater.js    # 表单UI更新器
│   │   ├── form_validator.js     # 表单验证器
│   │   ├── project_data_generator.js # 项目数据生成器
│   │   ├── project_data_manager.js   # 项目数据管理器
│   │   └── demo-script.js        # 演示脚本
│   └── styles/                   # CSS样式文件
│       └── asset_management.css  # 资产管理样式
├── static/                       # 静态文件目录（保持向后兼容）
│   ├── css/
│   ├── js/
│   └── *.html
├── scripts/                      # 构建和工具脚本
│   ├── build-static.js          # 原始构建脚本
│   ├── build-functions.js       # 函数构建脚本
│   ├── build-reorganized.js     # 新的构建脚本
│   ├── build-static-new.js      # 新的静态构建脚本
│   └── restructure-project.js   # 重构脚本
├── functions/                    # Cloudflare Functions
├── database/                     # 数据库文件
├── cloudflare-config/           # Cloudflare配置
├── docs/                        # 文档目录
│   ├── CLOUDFLARE_SETUP.md
│   ├── DEMO_GUIDE.md
│   ├── DEMO_WORKFLOW.md
│   ├── DEPLOYMENT.md
│   ├── PROJECT_STRUCTURE_OPTIMIZATION.md
│   └── RESTRUCTURE_GUIDE.md
└── dist/                        # 构建输出目录
```

## 主要改进

### 1. 源代码组织
- **src/pages/**: 所有HTML页面文件集中管理
- **src/scripts/**: 所有JavaScript文件集中管理
- **src/styles/**: 所有CSS文件集中管理

### 2. 构建系统
- **build:reorganized**: 新的构建命令，处理重新组织的结构
- **dev:new**: 新的开发服务器命令，使用dist目录

### 3. 向后兼容
- 保留原有的static目录结构
- 原有的构建脚本继续可用

## 使用方法

### 开发模式
```bash
# 使用新结构开发
npm run build:reorganized
npm run dev:new

# 或使用原有结构
npm run dev
```

### 构建部署
```bash
# 构建新结构
npm run build:reorganized

# 或使用原有构建
npm run build
```

## 下一步优化建议

1. **统一资源路径**: 更新HTML文件中的资源引用路径
2. **移除重复文件**: 清理static目录中的重复文件
3. **完善构建流程**: 集成资源压缩和优化
4. **添加类型检查**: 为JavaScript文件添加TypeScript支持