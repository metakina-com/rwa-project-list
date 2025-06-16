const fs = require('fs');
const path = require('path');

// 构建重新组织后的项目
function buildReorganizedProject() {
    console.log('开始构建重新组织的项目...');
    
    // 确保dist目录存在
    const distDir = path.join(__dirname, '..', 'dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }
    
    // 复制页面文件
    const srcPagesDir = path.join(__dirname, '..', 'src', 'pages');
    const distPagesDir = path.join(distDir, 'pages');
    
    if (fs.existsSync(srcPagesDir)) {
        copyDirectory(srcPagesDir, distPagesDir);
        console.log('✓ 页面文件已复制');
    }
    
    // Also copy the user flow page to root for easy access
    const userFlowSrc = path.join(__dirname, '..', 'src', 'pages', 'user_flow.html');
    const userFlowDest = path.join(distDir, 'user_flow.html');
    if (fs.existsSync(userFlowSrc)) {
        fs.copyFileSync(userFlowSrc, userFlowDest);
        console.log('Copied user_flow.html to root for easy access');
    }
    
    // 复制脚本文件
    const srcScriptsDir = path.join(__dirname, '..', 'src', 'scripts');
    const distScriptsDir = path.join(distDir, 'scripts');
    
    if (fs.existsSync(srcScriptsDir)) {
        copyDirectory(srcScriptsDir, distScriptsDir);
        console.log('✓ 脚本文件已复制');
    }
    
    // 复制样式文件
    const srcStylesDir = path.join(__dirname, '..', 'src', 'styles');
    const distStylesDir = path.join(distDir, 'styles');
    
    if (fs.existsSync(srcStylesDir)) {
        copyDirectory(srcStylesDir, distStylesDir);
        console.log('✓ 样式文件已复制');
    }
    
    // 复制static目录（保持向后兼容）
    const staticDir = path.join(__dirname, '..', 'static');
    const distStaticDir = path.join(distDir, 'static');
    
    if (fs.existsSync(staticDir)) {
        copyDirectory(staticDir, distStaticDir);
        console.log('✓ Static目录已复制');
    }
    
    // 复制配置文件
    const configFiles = ['wrangler.toml', '_headers', '_redirects', 'cors.json'];
    configFiles.forEach(file => {
        const srcFile = path.join(__dirname, '..', file);
        const distFile = path.join(distDir, file);
        
        if (fs.existsSync(srcFile)) {
            fs.copyFileSync(srcFile, distFile);
            console.log(`✓ ${file} 已复制`);
        }
    });
    
    console.log('\n构建完成！输出目录: dist/');
}

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    
    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

if (require.main === module) {
    buildReorganizedProject();
}

module.exports = { buildReorganizedProject };