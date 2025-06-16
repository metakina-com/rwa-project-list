#!/usr/bin/env node
// Functions构建脚本
// 用于验证和准备Cloudflare Pages Functions

const fs = require('fs');
const path = require('path');

console.log('🔧 开始构建Functions...');

// 检查functions目录
const functionsDir = path.join(__dirname, '..', 'functions');
if (!fs.existsSync(functionsDir)) {
  console.error('❌ functions目录不存在');
  process.exit(1);
}

// 检查API函数
const apiDir = path.join(functionsDir, 'api');
if (!fs.existsSync(apiDir)) {
  console.error('❌ functions/api目录不存在');
  process.exit(1);
}

// 验证必要的API文件
const requiredApis = [
  'projects.js',
  'ai-risk-assessment.js'
];

let missingApis = [];
requiredApis.forEach(api => {
  const apiPath = path.join(apiDir, api);
  if (!fs.existsSync(apiPath)) {
    missingApis.push(api);
  } else {
    // 简单的语法检查
    try {
      const content = fs.readFileSync(apiPath, 'utf8');
      if (!content.includes('export') && !content.includes('module.exports')) {
        console.warn(`⚠️  ${api} 可能缺少导出语句`);
      }
      console.log(`✅ ${api} 验证通过`);
    } catch (error) {
      console.error(`❌ ${api} 读取失败:`, error.message);
    }
  }
});

if (missingApis.length > 0) {
  console.error('❌ 缺少以下API文件:', missingApis.join(', '));
  process.exit(1);
}

// 检查依赖项
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['hono', 'zod', '@cloudflare/ai'];
  
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies || !packageJson.dependencies[dep]
  );
  
  if (missingDeps.length > 0) {
    console.warn('⚠️  缺少以下依赖项:', missingDeps.join(', '));
    console.log('💡 请运行: npm install', missingDeps.join(' '));
  }
}

console.log('✅ Functions构建完成');
console.log('🔗 API端点:');
console.log('  - /api/projects');
console.log('  - /api/ai-risk-assessment');
console.log('🚀 Functions准备就绪');