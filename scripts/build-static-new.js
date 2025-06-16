#!/usr/bin/env node

/**
 * 新项目结构的静态资源构建脚本
 * 适配重构后的目录结构
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class StaticBuilder {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.srcDir = path.join(projectRoot, 'src');
        this.distDir = path.join(projectRoot, 'dist');
        this.configDir = path.join(projectRoot, 'config');
    }

    // 清理构建目录
    cleanDist() {
        console.log('🧹 清理构建目录...');
        if (fs.existsSync(this.distDir)) {
            fs.rmSync(this.distDir, { recursive: true, force: true });
        }
        fs.mkdirSync(this.distDir, { recursive: true });
    }

    // 复制静态资源
    copyAssets() {
        console.log('📁 复制静态资源...');
        
        const assetsDir = path.join(this.srcDir, 'assets');
        const distAssetsDir = path.join(this.distDir, 'assets');
        
        if (fs.existsSync(assetsDir)) {
            this.copyDirectory(assetsDir, distAssetsDir);
        }
    }

    // 处理HTML文件
    processHTMLFiles() {
        console.log('📄 处理HTML文件...');
        
        const pagesDir = path.join(this.srcDir, 'pages');
        
        if (fs.existsSync(pagesDir)) {
            this.processDirectory(pagesDir, this.distDir, '.html', this.processHTML.bind(this));
        }
    }

    // 处理单个HTML文件
    processHTML(srcPath, distPath) {
        let content = fs.readFileSync(srcPath, 'utf8');
        
        // 更新资源路径
        content = this.updateResourcePaths(content);
        
        // 确保目标目录存在
        const distDir = path.dirname(distPath);
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
        }
        
        fs.writeFileSync(distPath, content);
        console.log(`✅ 处理HTML: ${path.relative(this.srcDir, srcPath)}`);
    }

    // 更新资源路径
    updateResourcePaths(content) {
        // 更新CSS路径
        content = content.replace(
            /href=["'](?:\.\.\/)*(?:static\/)?css\//g,
            'href="assets/css/'
        );
        
        // 更新JS路径
        content = content.replace(
            /src=["'](?:\.\.\/)*(?:static\/)?js\//g,
            'src="assets/js/'
        );
        
        // 更新相对路径的JS引用
        content = content.replace(
            /src=["'](?!http|https|\/\/|assets\/)([^"']*\.js)["']/g,
            (match, jsPath) => {
                // 根据文件位置调整路径
                if (jsPath.includes('core/')) {
                    return `src="assets/js/core/${path.basename(jsPath)}"`;
                } else if (jsPath.includes('components/')) {
                    return `src="assets/js/components/${path.basename(jsPath)}"`;
                } else if (jsPath.includes('data/')) {
                    return `src="assets/js/data/${path.basename(jsPath)}"`;
                } else {
                    return `src="assets/js/${path.basename(jsPath)}"`;
                }
            }
        );
        
        // 更新页面间的链接
        content = content.replace(
            /href=["'](?!http|https|\/\/|#)([^"']*\.html)["']/g,
            (match, htmlPath) => {
                const fileName = path.basename(htmlPath);
                
                // 根据文件名确定新路径
                if (fileName.includes('marketplace')) {
                    return `href="marketplace/${fileName}"`;
                } else if (fileName.includes('form')) {
                    return `href="forms/${fileName}"`;
                } else if (fileName.includes('management')) {
                    return `href="management/${fileName}"`;
                } else if (fileName.includes('detail')) {
                    return `href="details/${fileName}"`;
                } else {
                    return `href="${fileName}"`;
                }
            }
        );
        
        return content;
    }

    // 复制配置文件
    copyConfigFiles() {
        console.log('⚙️ 复制配置文件...');
        
        const configFiles = [
            { src: 'config/cloudflare/_headers', dest: '_headers' },
            { src: 'config/cloudflare/_redirects', dest: '_redirects' }
        ];
        
        configFiles.forEach(({ src, dest }) => {
            const srcPath = path.join(this.projectRoot, src);
            const destPath = path.join(this.distDir, dest);
            
            if (fs.existsSync(srcPath)) {
                fs.copyFileSync(srcPath, destPath);
                console.log(`✅ 复制配置: ${src}`);
            }
        });
    }

    // 生成sitemap
    generateSitemap() {
        console.log('🗺️ 生成sitemap...');
        
        const baseUrl = 'https://your-domain.com'; // 需要替换为实际域名
        const pages = this.getAllHTMLFiles(this.distDir);
        
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => {
    const url = page.replace(this.distDir, '').replace(/\\/g, '/').replace(/\/index\.html$/, '/');
    return `  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
}).join('\n')}
</urlset>`;
        
        fs.writeFileSync(path.join(this.distDir, 'sitemap.xml'), sitemap);
        console.log('✅ 生成sitemap.xml');
    }

    // 生成robots.txt
    generateRobots() {
        console.log('🤖 生成robots.txt...');
        
        const robots = `User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml`;
        
        fs.writeFileSync(path.join(this.distDir, 'robots.txt'), robots);
        console.log('✅ 生成robots.txt');
    }

    // 工具方法：复制目录
    copyDirectory(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const items = fs.readdirSync(src);
        
        items.forEach(item => {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            
            if (fs.statSync(srcPath).isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        });
    }

    // 工具方法：处理目录中的特定文件
    processDirectory(srcDir, destDir, extension, processor) {
        if (!fs.existsSync(srcDir)) return;
        
        const items = fs.readdirSync(srcDir);
        
        items.forEach(item => {
            const srcPath = path.join(srcDir, item);
            const stat = fs.statSync(srcPath);
            
            if (stat.isDirectory()) {
                const newDestDir = path.join(destDir, item);
                this.processDirectory(srcPath, newDestDir, extension, processor);
            } else if (path.extname(item) === extension) {
                const relativePath = path.relative(this.srcDir, srcPath);
                const destPath = path.join(destDir, relativePath.replace(/^pages[\\\/]/, ''));
                processor(srcPath, destPath);
            }
        });
    }

    // 工具方法：获取所有HTML文件
    getAllHTMLFiles(dir) {
        let htmlFiles = [];
        
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                htmlFiles = htmlFiles.concat(this.getAllHTMLFiles(itemPath));
            } else if (path.extname(item) === '.html') {
                htmlFiles.push(itemPath);
            }
        });
        
        return htmlFiles;
    }

    // 执行构建
    async build() {
        console.log('🚀 开始构建静态资源...');
        console.log('=' .repeat(50));
        
        try {
            this.cleanDist();
            this.copyAssets();
            this.processHTMLFiles();
            this.copyConfigFiles();
            this.generateSitemap();
            this.generateRobots();
            
            console.log('=' .repeat(50));
            console.log('🎉 静态资源构建完成！');
            console.log(`📁 输出目录: ${this.distDir}`);
            
            // 显示构建统计
            this.showBuildStats();
            
        } catch (error) {
            console.error('❌ 构建过程中出现错误:', error.message);
            process.exit(1);
        }
    }

    // 显示构建统计
    showBuildStats() {
        const htmlFiles = this.getAllHTMLFiles(this.distDir).length;
        const assetsDir = path.join(this.distDir, 'assets');
        let jsFiles = 0;
        let cssFiles = 0;
        
        if (fs.existsSync(assetsDir)) {
            const jsDir = path.join(assetsDir, 'js');
            const cssDir = path.join(assetsDir, 'css');
            
            if (fs.existsSync(jsDir)) {
                jsFiles = this.countFilesRecursive(jsDir, '.js');
            }
            
            if (fs.existsSync(cssDir)) {
                cssFiles = this.countFilesRecursive(cssDir, '.css');
            }
        }
        
        console.log('');
        console.log('📊 构建统计:');
        console.log(`   HTML文件: ${htmlFiles}`);
        console.log(`   JavaScript文件: ${jsFiles}`);
        console.log(`   CSS文件: ${cssFiles}`);
    }

    // 递归计算文件数量
    countFilesRecursive(dir, extension) {
        let count = 0;
        
        if (!fs.existsSync(dir)) return count;
        
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                count += this.countFilesRecursive(itemPath, extension);
            } else if (path.extname(item) === extension) {
                count++;
            }
        });
        
        return count;
    }
}

// 执行构建
if (require.main === module) {
    const projectRoot = process.cwd();
    const builder = new StaticBuilder(projectRoot);
    builder.build();
}

module.exports = StaticBuilder;