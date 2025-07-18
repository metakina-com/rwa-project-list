# RWA项目平台演示指南

## 🎯 演示目标

本演示将展示RWA项目平台的完整功能流程，包括：
- 用户注册登录管理
- 项目申请管理 
- RWA项目购买交易
- 系统集成和数据流转

## 🚀 快速开始

### 1. 启动演示环境

```bash
# 确保开发服务器正在运行
npx wrangler pages dev static --port 8080
```

访问：http://localhost:8080

### 2. 打开演示控制台

- **方法1**：按快捷键 `Ctrl + D`
- **方法2**：点击页面右上角的 🎬 按钮
- **方法3**：在浏览器控制台输入 `demo.startFullDemo()`

## 📋 演示流程

### 阶段一：用户注册登录演示

#### 1.1 自动演示
```javascript
// 在浏览器控制台执行
demo.showUserDemo()
```

#### 1.2 手动演示步骤

1. **打开登录界面**
   - 点击导航栏右侧的"登录"按钮
   - 观察登录模态框的弹出效果

2. **注册新用户**
   - 点击"注册"标签
   - 使用演示数据填充表单：
     ```
     姓名：张投资者
     邮箱：demo.investor@example.com
     密码：demo123456
     手机：13800138001
     钱包地址：0x1234567890abcdef1234567890abcdef12345678
     ```
   - 点击"注册"按钮

3. **模拟登录（推荐）**
   - 点击"模拟登录"按钮快速体验
   - 观察用户信息在导航栏的显示

4. **验证登录状态**
   - 检查导航栏显示用户信息
   - 验证用户菜单功能

#### 1.3 预期结果
- ✅ 用户成功注册/登录
- ✅ 导航栏显示用户信息
- ✅ 用户状态持久化保存
- ✅ 认证令牌正确管理

### 阶段二：项目申请管理演示

#### 2.1 自动演示
```javascript
// 在浏览器控制台执行
demo.showProjectDemo()
```

#### 2.2 手动演示步骤

1. **进入项目申请页面**
   - 点击导航栏的"智能申请"按钮
   - 或直接访问：http://localhost:8080/static/rwa_smart_form.html

2. **填写项目信息**
   - 使用演示数据或手动填写：
     ```
     项目名称：绿色能源RWA项目
     项目类型：可再生能源
     项目规模：1000万美元
     预期收益：8.5%
     项目周期：36个月
     项目描述：专注于太阳能和风能发电设施的投资项目
     ```

3. **AI风险评估**
   - 点击"AI风险评估"按钮
   - 观察AI分析结果和建议

4. **提交申请**
   - 检查表单验证
   - 提交项目申请
   - 查看提交确认

#### 2.3 预期结果
- ✅ 项目信息成功提交
- ✅ AI风险评估正常工作
- ✅ 表单验证功能完善
- ✅ 用户体验流畅

### 阶段三：RWA项目购买交易演示

#### 3.1 自动演示
```javascript
// 在浏览器控制台执行
demo.showTradingDemo()
```

#### 3.2 手动演示步骤

1. **进入交易市场**
   - 点击导航栏的"RWA交易市场"
   - 或直接访问：http://localhost:8080/static/rwa_marketplace.html

2. **浏览项目列表**
   - 查看可投资的RWA项目
   - 使用筛选和搜索功能
   - 查看项目详细信息

3. **投资决策**
   - 选择感兴趣的项目
   - 查看项目详情和风险评估
   - 设置投资金额

4. **执行交易**
   - 确认投资信息
   - 模拟支付流程
   - 查看交易确认

5. **资产管理**
   - 访问资产管理页面
   - 查看投资组合
   - 监控收益情况

#### 3.3 预期结果
- ✅ 项目展示完整清晰
- ✅ 投资流程顺畅
- ✅ 交易数据准确记录
- ✅ 资产管理功能完善

## 🛠️ 演示工具使用

### 演示控制台功能

1. **🚀 完整演示**：自动执行所有演示流程
2. **👤 用户演示**：专注于用户注册登录功能
3. **📋 项目演示**：专注于项目申请管理
4. **💰 交易演示**：专注于交易市场功能
5. **🔄 重置演示**：清除所有演示数据，重新开始

### 快捷键

- `Ctrl + D`：切换演示控制台
- `Ctrl + F`：自动填充当前页面表单

### 控制台命令

```javascript
// 获取演示数据
demo.getDemoData()

// 自动填充表单
demo.fillForm('registration') // 注册表单
demo.fillForm('project')      // 项目申请表单

// 显示提示消息
demo.showToast('自定义消息', 'info')

// 高亮元素
demo.highlightElement(document.querySelector('.target'))
```

## 🎭 演示场景

### 场景1：投资者完整流程

1. **角色**：个人投资者
2. **目标**：寻找并投资RWA项目
3. **流程**：
   - 注册账户 → 浏览项目 → 风险评估 → 投资决策 → 资产管理

### 场景2：项目方申请流程

1. **角色**：项目发起方
2. **目标**：申请RWA项目上线
3. **流程**：
   - 注册账户 → 填写项目信息 → AI风险评估 → 提交审核 → 项目上线

### 场景3：平台管理流程

1. **角色**：平台管理员
2. **目标**：管理项目和用户
3. **流程**：
   - 审核项目申请 → 风险评估 → 项目上线 → 交易监控 → 数据分析

## 📊 演示数据

### 测试用户账户

```javascript
// 投资者账户
{
  name: '张投资者',
  email: 'demo.investor@example.com',
  password: 'demo123456',
  phone: '13800138001',
  wallet: '0x1234567890abcdef1234567890abcdef12345678'
}

// 项目方账户
{
  name: '李项目方',
  email: 'demo.project@example.com',
  password: 'demo123456',
  phone: '13800138002',
  wallet: '0xabcdef1234567890abcdef1234567890abcdef12'
}
```

### 示例项目数据

```javascript
// 绿色能源项目
{
  name: '绿色能源RWA项目',
  type: '可再生能源',
  scale: '1000万美元',
  expectedReturn: '8.5%',
  duration: '36个月',
  description: '专注于太阳能和风能发电设施的投资项目',
  riskLevel: '中等',
  minInvestment: 10000
}

// 商业地产项目
{
  name: '商业地产投资项目',
  type: '房地产',
  scale: '5000万美元',
  expectedReturn: '7.2%',
  duration: '60个月',
  description: '位于核心商业区的优质办公楼投资项目',
  riskLevel: '低',
  minInvestment: 50000
}
```

## 🔍 故障排除

### 常见问题

1. **演示控制台不显示**
   - 检查 `demo-script.js` 是否正确加载
   - 刷新页面重试
   - 检查浏览器控制台错误信息

2. **自动填充不工作**
   - 确保在正确的页面使用对应功能
   - 检查表单元素ID是否匹配
   - 手动填写表单数据

3. **登录功能异常**
   - 检查 `auth.js` 和 `api-client.js` 加载状态
   - 使用"模拟登录"功能
   - 检查本地存储权限

4. **页面跳转失败**
   - 确保所有HTML文件在正确位置
   - 检查文件路径和链接
   - 手动输入URL访问

### 调试命令

```javascript
// 检查演示状态
console.log('Demo loaded:', typeof demo !== 'undefined')
console.log('Auth manager:', typeof authManager !== 'undefined')
console.log('API client:', typeof apiClient !== 'undefined')

// 检查用户状态
if (window.authManager) {
  console.log('User logged in:', authManager.isLoggedIn())
  console.log('User info:', authManager.getUserInfo())
}

// 检查演示数据
console.log('Demo data:', demo.getDemoData())
```

## 📝 演示检查清单

### 演示前准备
- [ ] 开发服务器正常运行
- [ ] 所有JavaScript文件正确加载
- [ ] 演示控制台可以正常打开
- [ ] 测试数据准备完毕

### 用户功能检查
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 模拟登录功能正常
- [ ] 用户信息显示正确
- [ ] 登出功能正常

### 项目功能检查
- [ ] 项目申请页面正常访问
- [ ] 表单填写和验证正常
- [ ] AI风险评估功能正常
- [ ] 项目提交功能正常

### 交易功能检查
- [ ] 交易市场页面正常访问
- [ ] 项目列表显示正常
- [ ] 项目详情查看正常
- [ ] 投资流程完整
- [ ] 资产管理功能正常

### 系统集成检查
- [ ] 页面间跳转正常
- [ ] 数据流转正确
- [ ] 用户状态保持
- [ ] 错误处理完善

## 🎉 演示总结

完成演示后，您将体验到：

1. **完整的用户管理系统**
   - 安全的注册登录机制
   - 用户信息管理
   - 会话状态维护

2. **智能的项目申请流程**
   - 直观的表单设计
   - AI辅助风险评估
   - 完善的数据验证

3. **专业的交易市场平台**
   - 丰富的项目展示
   - 便捷的投资流程
   - 全面的资产管理

4. **无缝的系统集成**
   - 模块间数据互通
   - 统一的用户体验
   - 可扩展的架构设计

这个RWA项目平台演示展现了现代金融科技平台的核心能力，为真实世界资产的数字化和交易提供了完整的解决方案。