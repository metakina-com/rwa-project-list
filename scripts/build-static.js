#!/usr/bin/env node
// 静态文件构建脚本
// 用于优化和准备静态资源用于生产部署

const fs = require('fs');
const path = require('path');

console.log('🔨 开始构建静态文件...');

// 确保static目录存在
const staticDir = path.join(__dirname, '..', 'static');
if (!fs.existsSync(staticDir)) {
  console.error('❌ static目录不存在');
  process.exit(1);
}

// 检查必要的文件
const requiredFiles = [
  'index.html',
  'asset_management.html',
  'rwa_marketplace.html',
  'rwa_client_form.html',
  'rwa_smart_form.html',
  'nft_marketplace.html',
  'project_detail.html'
];

let missingFiles = [];
requiredFiles.forEach(file => {
  const filePath = path.join(staticDir, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.warn('⚠️  缺少以下文件:', missingFiles.join(', '));
}

// 检查CSS和JS目录
const cssDir = path.join(staticDir, 'css');
const jsDir = path.join(staticDir, 'js');

if (!fs.existsSync(cssDir)) {
  console.log('📁 创建CSS目录');
  fs.mkdirSync(cssDir, { recursive: true });
}

if (!fs.existsSync(jsDir)) {
  console.log('📁 创建JS目录');
  fs.mkdirSync(jsDir, { recursive: true });
}

// 复制根目录的重复文件到static（如果不存在）
const rootDir = path.join(__dirname, '..');
const filesToCopy = [
  { src: 'index.html', dest: 'index.html' },
  { src: 'nft_marketplace.html', dest: 'nft_marketplace.html' },
  { src: 'project_detail.html', dest: 'project_detail.html' },
  { src: 'rwa_client_form.html', dest: 'rwa_client_form.html' },
  { src: 'rwa_marketplace.html', dest: 'rwa_marketplace.html' },
  { src: 'rwa_smart_form.html', dest: 'rwa_smart_form.html' }
];

filesToCopy.forEach(({ src, dest }) => {
  const srcPath = path.join(rootDir, src);
  const destPath = path.join(staticDir, dest);
  
  if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
    console.log(`📄 复制 ${src} 到 static/${dest}`);
    fs.copyFileSync(srcPath, destPath);
  }
});

console.log('✅ 静态文件构建完成');
console.log(`📊 静态文件目录: ${staticDir}`);

// 输出文件统计
const files = fs.readdirSync(staticDir, { recursive: true });
console.log(`📈 总文件数: ${files.length}`);
console.log('🚀 准备部署到Cloudflare Pages');