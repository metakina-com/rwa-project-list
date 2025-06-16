#!/usr/bin/env node

/**
 * RWA项目结构重构脚本
 * 自动化执行项目结构优化
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProjectRestructurer {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.backupDir = path.join(projectRoot, 'backup-' + Date.now());
    }

    // 创建备份
    createBackup() {
        console.log('📦 创建项目备份...');
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
        
        // 备份重要文件
        const filesToBackup = [
            'package.json',
            'wrangler.toml',
            '_headers',
            '_redirects'
        ];
        
        filesToBackup.forEach(file => {
            const srcPath = path.join(this.projectRoot, file);
            const destPath = path.join(this.backupDir, file);
            if (fs.existsSync(srcPath)) {
                fs.copyFileSync(srcPath, destPath);
                console.log(`✅ 备份: ${file}`);
            }
        });
    }

    // 创建新的目录结构
    createDirectoryStructure() {
        console.log('📁 创建新的目录结构...');
        
        const directories = [
            'docs',
            'config/cloudflare',
            'src/assets/css',
            'src/assets/js/core',
            'src/assets/js/components',
            'src/assets/js/data',
            'src/assets/js/utils',
            'src/assets/images',
            'src/pages/marketplace',
            'src/pages/forms',
            'src/pages/management',
            'src/pages/details',
            'src/components',
            'dist',
            'tests'
        ];
        
        directories.forEach(dir => {
            const dirPath = path.join(this.projectRoot, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`✅ 创建目录: ${dir}`);
            }
        });
    }

    // 移动文档文件
    moveDocumentationFiles() {
        console.log('📚 移动文档文件...');
        
        const docFiles = [
            'README.md',
            'DEMO_GUIDE.md',
            'DEMO_WORKFLOW.md',
            'DEPLOYMENT.md',
            'CLOUDFLARE_SETUP.md'
        ];
        
        docFiles.forEach(file => {
            const srcPath = path.join(this.projectRoot, file);
            const destPath = path.join(this.projectRoot, 'docs', file);
            if (fs.existsSync(srcPath)) {
                fs.renameSync(srcPath, destPath);
                console.log(`✅ 移动文档: ${file}`);
            }
        });
    }

    // 移动配置文件
    moveConfigFiles() {
        console.log('⚙️ 移动配置文件...');
        
        const configFiles = [
            { src: 'wrangler.toml', dest: 'config/cloudflare/wrangler.toml' },
            { src: '_headers', dest: 'config/cloudflare/_headers' },
            { src: '_redirects', dest: 'config/cloudflare/_redirects' },
            { src: 'cors.json', dest: 'config/cors.json' }
        ];
        
        configFiles.forEach(({ src, dest }) => {
            const srcPath = path.join(this.projectRoot, src);
            const destPath = path.join(this.projectRoot, dest);
            if (fs.existsSync(srcPath)) {
                fs.renameSync(srcPath, destPath);
                console.log(`✅ 移动配置: ${src} -> ${dest}`);
            }
        });
    }

    // 整理JavaScript文件
    organizeJavaScriptFiles() {
        console.log('📜 整理JavaScript文件...');
        
        const jsFiles = [
            // 核心功能
            { src: 'static/js/api-client.js', dest: 'src/assets/js/core/api-client.js' },
            { src: 'static/js/auth.js', dest: 'src/assets/js/core/auth.js' },
            { src: 'ai_risk_engine.js', dest: 'src/assets/js/core/ai-risk-engine.js' },
            { src: 'static/js/ai_risk_engine.js', dest: 'src/assets/js/core/ai-risk-engine.js' },
            
            // 组件
            { src: 'form_handler.js', dest: 'src/assets/js/components/form-handler.js' },
            { src: 'static/js/form_handler.js', dest: 'src/assets/js/components/form-handler.js' },
            { src: 'form_processor.js', dest: 'src/assets/js/components/form-processor.js' },
            { src: 'static/js/form_processor.js', dest: 'src/assets/js/components/form-processor.js' },
            { src: 'form_ui_updater.js', dest: 'src/assets/js/components/form-ui-updater.js' },
            { src: 'static/js/form_ui_updater.js', dest: 'src/assets/js/components/form-ui-updater.js' },
            { src: 'form_validator.js', dest: 'src/assets/js/components/form-validator.js' },
            { src: 'static/js/form_validator.js', dest: 'src/assets/js/components/form-validator.js' },
            
            // 数据管理
            { src: 'project_data_generator.js', dest: 'src/assets/js/data/project-data-generator.js' },
            { src: 'static/js/project_data_generator.js', dest: 'src/assets/js/data/project-data-generator.js' },
            { src: 'project_data_manager.js', dest: 'src/assets/js/data/project-data-manager.js' },
            { src: 'static/js/project_data_manager.js', dest: 'src/assets/js/data/project-data-manager.js' },
            
            // 其他
            { src: 'demo-script.js', dest: 'scripts/demo-script.js' }
        ];
        
        jsFiles.forEach(({ src, dest }) => {
            const srcPath = path.join(this.projectRoot, src);
            const destPath = path.join(this.projectRoot, dest);
            if (fs.existsSync(srcPath)) {
                // 确保目标目录存在
                const destDir = path.dirname(destPath);
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }
                fs.renameSync(srcPath, destPath);
                console.log(`✅ 移动JS: ${src} -> ${dest}`);
            }
        });
    }

    // 整理CSS文件
    organizeCSSFiles() {
        console.log('🎨 整理CSS文件...');
        
        const cssFiles = [
            { src: 'asset_management.css', dest: 'src/assets/css/asset-management.css' },
            { src: 'static/css/asset_management.css', dest: 'src/assets/css/asset-management.css' },
            { src: 'static/css/auth.css', dest: 'src/assets/css/auth.css' }
        ];
        
        cssFiles.forEach(({ src, dest }) => {
            const srcPath = path.join(this.projectRoot, src);
            const destPath = path.join(this.projectRoot, dest);
            if (fs.existsSync(srcPath)) {
                fs.renameSync(srcPath, destPath);
                console.log(`✅ 移动CSS: ${src} -> ${dest}`);
            }
        });
    }

    // 整理HTML文件
    organizeHTMLFiles() {
        console.log('📄 整理HTML文件...');
        
        const htmlFiles = [
            { src: 'index.html', dest: 'src/pages/index.html' },
            { src: 'static/index.html', dest: 'src/pages/index.html' },
            { src: 'rwa_marketplace.html', dest: 'src/pages/marketplace/rwa-marketplace.html' },
            { src: 'static/rwa_marketplace.html', dest: 'src/pages/marketplace/rwa-marketplace.html' },
            { src: 'nft_marketplace.html', dest: 'src/pages/marketplace/nft-marketplace.html' },
            { src: 'static/nft_marketplace.html', dest: 'src/pages/marketplace/nft-marketplace.html' },
            { src: 'rwa_client_form.html', dest: 'src/pages/forms/rwa-client-form.html' },
            { src: 'static/rwa_client_form.html', dest: 'src/pages/forms/rwa-client-form.html' },
            { src: 'rwa_smart_form.html', dest: 'src/pages/forms/rwa-smart-form.html' },
            { src: 'static/rwa_smart_form.html', dest: 'src/pages/forms/rwa-smart-form.html' },
            { src: 'asset_management.html', dest: 'src/pages/management/asset-management.html' },
            { src: 'static/asset_management.html', dest: 'src/pages/management/asset-management.html' },
            { src: 'project_detail.html', dest: 'src/pages/details/project-detail.html' },
            { src: 'static/project_detail.html', dest: 'src/pages/details/project-detail.html' }
        ];
        
        htmlFiles.forEach(({ src, dest }) => {
            const srcPath = path.join(this.projectRoot, src);
            const destPath = path.join(this.projectRoot, dest);
            if (fs.existsSync(srcPath)) {
                // 如果目标文件已存在，跳过
                if (fs.existsSync(destPath)) {
                    console.log(`⚠️ 跳过重复文件: ${src}`);
                    // 删除源文件
                    fs.unlinkSync(srcPath);
                    return;
                }
                fs.renameSync(srcPath, destPath);
                console.log(`✅ 移动HTML: ${src} -> ${dest}`);
            }
        });
    }

    // 更新package.json
    updatePackageJson() {
        console.log('📦 更新package.json...');
        
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            // 更新脚本路径
            packageJson.scripts = {
                ...packageJson.scripts,
                "dev": "wrangler pages dev dist --compatibility-date=2024-01-01",
                "build": "npm run build:static && npm run build:functions",
                "build:static": "node scripts/build-static.js",
                "build:functions": "node scripts/build-functions.js",
                "deploy": "wrangler pages deploy dist",
                "db:migrate": "wrangler d1 execute rwa-database --file=./database/schema.sql",
                "db:migrate:local": "wrangler d1 execute rwa-database --local --file=./database/schema.sql",
                "db:seed": "wrangler d1 execute rwa-database --file=./database/seed.sql",
                "r2:cors": "wrangler r2 bucket cors put rwa-project-files --file config/cors.json",
                "preview": "wrangler pages dev dist --local"
            };
            
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            console.log('✅ 更新package.json脚本');
        }
    }

    // 清理空目录
    cleanupEmptyDirectories() {
        console.log('🧹 清理空目录...');
        
        const dirsToCheck = ['static/js', 'static/css', 'static'];
        
        dirsToCheck.forEach(dir => {
            const dirPath = path.join(this.projectRoot, dir);
            if (fs.existsSync(dirPath)) {
                try {
                    const files = fs.readdirSync(dirPath);
                    if (files.length === 0) {
                        fs.rmdirSync(dirPath);
                        console.log(`✅ 删除空目录: ${dir}`);
                    }
                } catch (error) {
                    console.log(`⚠️ 无法删除目录: ${dir}`);
                }
            }
        });
    }

    // 执行完整重构
    async restructure() {
        console.log('🚀 开始项目结构重构...');
        console.log('=' .repeat(50));
        
        try {
            this.createBackup();
            this.createDirectoryStructure();
            this.moveDocumentationFiles();
            this.moveConfigFiles();
            this.organizeJavaScriptFiles();
            this.organizeCSSFiles();
            this.organizeHTMLFiles();
            this.updatePackageJson();
            this.cleanupEmptyDirectories();
            
            console.log('=' .repeat(50));
            console.log('🎉 项目结构重构完成！');
            console.log('');
            console.log('📋 后续步骤：');
            console.log('1. 检查并更新HTML文件中的资源引用路径');
            console.log('2. 更新构建脚本以适应新的目录结构');
            console.log('3. 测试所有功能是否正常工作');
            console.log('4. 更新Cloudflare Pages配置');
            console.log('');
            console.log(`💾 备份文件位置: ${this.backupDir}`);
            
        } catch (error) {
            console.error('❌ 重构过程中出现错误:', error.message);
            console.log('💾 请检查备份文件并手动恢复');
        }
    }
}

// 执行重构
if (require.main === module) {
    const projectRoot = process.cwd();
    const restructurer = new ProjectRestructurer(projectRoot);
    restructurer.restructure();
}

module.exports = ProjectRestructurer;