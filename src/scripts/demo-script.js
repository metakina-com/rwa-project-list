/**
 * RWA项目平台演示脚本
 * 提供自动化演示功能和测试数据
 */

class DemoScript {
    constructor() {
        this.currentStep = 0;
        this.demoData = this.initDemoData();
        this.init();
    }

    // 初始化演示数据
    initDemoData() {
        return {
            users: {
                investor: {
                    name: '张投资者',
                    email: 'demo.investor@example.com',
                    password: 'demo123456',
                    phone: '13800138001',
                    wallet: '0x1234567890abcdef1234567890abcdef12345678',
                    role: 'investor'
                },
                projectOwner: {
                    name: '李项目方',
                    email: 'demo.project@example.com',
                    password: 'demo123456',
                    phone: '13800138002',
                    wallet: '0xabcdef1234567890abcdef1234567890abcdef12',
                    role: 'project_owner'
                }
            },
            projects: {
                greenEnergy: {
                    name: '绿色能源RWA项目',
                    type: '可再生能源',
                    scale: '1000万美元',
                    expectedReturn: '8.5%',
                    duration: '36个月',
                    description: '专注于太阳能和风能发电设施的投资项目，具有稳定的现金流和政府政策支持。',
                    riskLevel: '中等',
                    minInvestment: 10000
                },
                realEstate: {
                    name: '商业地产投资项目',
                    type: '房地产',
                    scale: '5000万美元',
                    expectedReturn: '7.2%',
                    duration: '60个月',
                    description: '位于核心商业区的优质办公楼投资项目，租金收入稳定。',
                    riskLevel: '低',
                    minInvestment: 50000
                }
            },
            investments: {
                amount: 50000,
                currency: 'USD',
                duration: 36
            }
        };
    }

    // 初始化演示环境
    init() {
        this.createDemoUI();
        this.bindEvents();
        console.log('🎬 RWA项目平台演示脚本已加载');
        console.log('📋 可用演示功能：');
        console.log('  - demo.startFullDemo() - 开始完整演示');
        console.log('  - demo.showUserDemo() - 用户注册登录演示');
        console.log('  - demo.startInvestorPath() - 投资者路径演示');
        console.log('  - demo.startProjectOwnerPath() - 项目方路径演示');
        console.log('  - demo.fillForm(type) - 自动填充表单');
    }

    // 创建演示控制界面
    createDemoUI() {
        const demoPanel = document.createElement('div');
        demoPanel.id = 'demoPanel';
        demoPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            font-family: monospace;
            font-size: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            display: none;
        `;

        demoPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #4f46e5;">🎬 演示控制台</h3>
                <button onclick="demo.togglePanel()" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer;">×</button>
            </div>
            <div id="demoStatus" style="margin-bottom: 15px; padding: 10px; background: rgba(79, 70, 229, 0.2); border-radius: 5px;">
                演示状态：待开始
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button onclick="demo.startFullDemo()" class="demo-btn">🚀 完整演示</button>
                <button onclick="demo.showUserDemo()" class="demo-btn">👤 用户注册登录</button>
                <button onclick="demo.startInvestorPath()" class="demo-btn">💰 投资者路径</button>
                <button onclick="demo.startProjectOwnerPath()" class="demo-btn">📋 项目方路径</button>
                <button onclick="demo.resetDemo()" class="demo-btn" style="background: #ef4444;">🔄 重置演示</button>
            </div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #374151;">
                <div style="font-size: 10px; color: #9ca3af;">快捷键：</div>
                <div style="font-size: 10px; color: #9ca3af;">Ctrl+D - 切换面板</div>
                <div style="font-size: 10px; color: #9ca3af;">Ctrl+F - 自动填充</div>
            </div>
        `;

        // 添加按钮样式
        const style = document.createElement('style');
        style.textContent = `
            .demo-btn {
                padding: 8px 12px;
                background: #4f46e5;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 11px;
                transition: all 0.2s;
            }
            .demo-btn:hover {
                background: #3730a3;
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(demoPanel);

        // 创建切换按钮
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = '🎬';
        toggleBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            z-index: 10001;
            box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
            transition: all 0.3s;
        `;
        toggleBtn.onclick = () => this.togglePanel();
        document.body.appendChild(toggleBtn);
    }

    // 绑定事件
    bindEvents() {
        // 快捷键支持
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.togglePanel();
            }
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.autoFillCurrentForm();
            }
        });
    }

    // 切换演示面板
    togglePanel() {
        const panel = document.getElementById('demoPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    // 更新演示状态
    updateStatus(status) {
        const statusEl = document.getElementById('demoStatus');
        if (statusEl) {
            statusEl.textContent = `演示状态：${status}`;
        }
        console.log(`🎬 ${status}`);
    }

    // 开始完整演示
    async startFullDemo() {
        this.updateStatus('开始完整演示流程');
        
        try {
            // 第一步：用户注册登录
            await this.showUserDemo();
            await this.delay(3000);
            
            // 第二步：展示两个主要业务路径选择
            this.showBusinessPathSelection();
            await this.delay(2000);
            
            // 第三步：投资者路径 - 购买资产
            await this.showInvestorPath();
            await this.delay(3000);
            
            // 第四步：项目方路径 - 申请项目发行
            await this.showProjectOwnerPath();
            
            this.updateStatus('完整演示流程结束');
            this.showCompletionMessage();
        } catch (error) {
            console.error('演示过程中出现错误:', error);
            this.updateStatus('演示出现错误');
        }
    }

    // 用户注册登录演示
    async showUserDemo() {
        this.updateStatus('演示用户注册登录功能');
        
        // 如果用户已登录，先登出
        if (window.authManager && window.authManager.isLoggedIn()) {
            await window.authManager.logout();
            await this.delay(1000);
        }

        // 打开登录模态框
        if (window.authManager) {
            window.authManager.showLoginModal();
            await this.delay(1000);

            // 切换到注册标签
            window.authManager.switchAuthTab('register');
            await this.delay(500);

            // 自动填充注册表单
            this.fillRegistrationForm();
            await this.delay(2000);

            // 提示用户可以点击注册或使用模拟登录
            this.showToast('💡 您可以点击"注册"按钮完成注册，或点击"模拟登录"快速体验', 'info');
        } else {
            this.showToast('❌ 认证管理器未加载，请刷新页面重试', 'error');
        }
    }

    // 展示业务路径选择
    showBusinessPathSelection() {
        this.updateStatus('展示业务路径选择');
        
        const selectionModal = document.createElement('div');
        selectionModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10003;
        `;
        
        selectionModal.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 15px;
                max-width: 600px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            ">
                <h2 style="color: #4f46e5; margin-bottom: 30px;">🎯 选择您的角色路径</h2>
                <p style="color: #666; margin-bottom: 40px; font-size: 16px;">RWA平台支持两种主要业务场景，请选择您想要体验的路径：</p>
                
                <div style="display: flex; gap: 30px; justify-content: center;">
                    <div onclick="demo.startInvestorPath()" style="
                        cursor: pointer;
                        padding: 30px;
                        border: 2px solid #e5e7eb;
                        border-radius: 10px;
                        transition: all 0.3s;
                        width: 200px;
                    " onmouseover="this.style.borderColor='#4f46e5'; this.style.transform='translateY(-5px)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.transform='translateY(0)'">
                        <div style="font-size: 48px; margin-bottom: 15px;">💰</div>
                        <h3 style="color: #4f46e5; margin-bottom: 10px;">投资者路径</h3>
                        <p style="color: #666; font-size: 14px;">浏览和购买RWA资产<br>管理投资组合</p>
                    </div>
                    
                    <div onclick="demo.startProjectOwnerPath()" style="
                        cursor: pointer;
                        padding: 30px;
                        border: 2px solid #e5e7eb;
                        border-radius: 10px;
                        transition: all 0.3s;
                        width: 200px;
                    " onmouseover="this.style.borderColor='#4f46e5'; this.style.transform='translateY(-5px)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.transform='translateY(0)'">
                        <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
                        <h3 style="color: #4f46e5; margin-bottom: 10px;">项目方路径</h3>
                        <p style="color: #666; font-size: 14px;">申请项目发行<br>管理RWA资产</p>
                    </div>
                </div>
                
                <button onclick="this.parentElement.parentElement.remove()" style="
                    margin-top: 30px;
                    padding: 10px 20px;
                    background: #6b7280;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">稍后选择</button>
            </div>
        `;
        
        document.body.appendChild(selectionModal);
        this.showToast('🎯 请选择您想要体验的业务路径', 'info');
    }
    
    // 投资者路径演示
    async startInvestorPath() {
        // 关闭选择模态框
        document.querySelectorAll('[style*="rgba(0, 0, 0, 0.8)"]').forEach(modal => modal.remove());
        
        this.updateStatus('开始投资者路径演示');
        this.showToast('🚀 开始投资者路径：浏览和购买RWA资产', 'info');
        
        await this.delay(1000);
        await this.showTradingDemo();
    }
    
    // 项目方路径演示
    async startProjectOwnerPath() {
        // 关闭选择模态框
        document.querySelectorAll('[style*="rgba(0, 0, 0, 0.8)"]').forEach(modal => modal.remove());
        
        this.updateStatus('开始项目方路径演示');
        this.showToast('🚀 开始项目方路径：申请项目发行管理资产', 'info');
        
        await this.delay(1000);
        await this.showProjectDemo();
    }
    
    // 投资者路径 - 购买资产
    async showInvestorPath() {
        this.updateStatus('演示投资者购买资产流程');
        await this.showTradingDemo();
    }
    
    // 项目方路径 - 申请项目发行
    async showProjectOwnerPath() {
        this.updateStatus('演示项目方申请发行流程');
        await this.showProjectDemo();
    }
    
    // 项目申请演示
    async showProjectDemo() {
        this.updateStatus('演示项目申请功能');
        
        // 确保用户已登录
        if (!window.authManager || !window.authManager.isLoggedIn()) {
            this.showToast('⚠️ 请先登录后再进行项目申请演示', 'warning');
            return;
        }

        // 导航到智能申请页面
        this.showToast('🔄 正在跳转到项目申请页面...', 'info');
        await this.delay(1000);
        
        // 模拟点击智能申请按钮
        const ctaButton = document.querySelector('.cta-button');
        if (ctaButton) {
            this.highlightElement(ctaButton);
            this.showToast('👆 点击"智能申请"按钮进入项目申请页面', 'info');
        } else {
            this.showToast('💡 请手动点击"智能申请"按钮或访问 rwa_smart_form.html', 'info');
        }
    }

    // 交易演示
    async showTradingDemo() {
        this.updateStatus('演示交易功能');
        
        // 确保用户已登录
        if (!window.authManager || !window.authManager.isLoggedIn()) {
            this.showToast('⚠️ 请先登录后再进行交易演示', 'warning');
            return;
        }

        // 导航到交易市场
        this.showToast('🔄 正在跳转到RWA交易市场...', 'info');
        await this.delay(1000);
        
        // 查找交易市场链接
        const marketLink = document.querySelector('a[href*="rwa_marketplace"]');
        if (marketLink) {
            this.highlightElement(marketLink);
            this.showToast('👆 点击"RWA交易市场"进入交易页面', 'info');
        } else {
            this.showToast('💡 请手动点击"RWA交易市场"或访问 rwa_marketplace.html', 'info');
        }
    }

    // 自动填充注册表单
    fillRegistrationForm() {
        const userData = this.demoData.users.investor;
        
        const fields = {
            'registerName': userData.name,
            'registerEmail': userData.email,
            'registerPassword': userData.password,
            'confirmPassword': userData.password,
            'registerPhone': userData.phone,
            'registerWallet': userData.wallet
        };

        Object.entries(fields).forEach(([id, value]) => {
            const field = document.getElementById(id);
            if (field) {
                field.value = value;
                // 触发输入事件
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        this.showToast('✅ 注册表单已自动填充', 'success');
    }

    // 自动填充当前页面表单
    autoFillCurrentForm() {
        const currentPage = window.location.pathname;
        
        if (currentPage.includes('rwa_smart_form') || document.querySelector('#projectForm')) {
            this.fillProjectForm();
        } else if (document.querySelector('#loginForm') || document.querySelector('#registerForm')) {
            this.fillRegistrationForm();
        } else {
            this.showToast('💡 当前页面没有可填充的表单', 'info');
        }
    }

    // 填充项目申请表单
    fillProjectForm() {
        const projectData = this.demoData.projects.greenEnergy;
        
        const fields = {
            'projectName': projectData.name,
            'projectType': projectData.type,
            'projectScale': projectData.scale,
            'expectedReturn': projectData.expectedReturn,
            'projectDuration': projectData.duration,
            'projectDescription': projectData.description
        };

        Object.entries(fields).forEach(([id, value]) => {
            const field = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
            if (field) {
                field.value = value;
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        this.showToast('✅ 项目申请表单已自动填充', 'success');
    }

    // 高亮元素
    highlightElement(element) {
        element.style.boxShadow = '0 0 20px #4f46e5';
        element.style.transform = 'scale(1.05)';
        element.style.transition = 'all 0.3s';
        
        setTimeout(() => {
            element.style.boxShadow = '';
            element.style.transform = '';
        }, 3000);
    }

    // 显示提示消息
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            max-width: 350px;
            padding: 15px 20px;
            background: ${this.getToastColor(type)};
            color: white;
            border-radius: 8px;
            z-index: 10002;
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s ease-out;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // 添加动画样式
        if (!document.querySelector('#toastAnimation')) {
            const style = document.createElement('style');
            style.id = 'toastAnimation';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    // 获取提示消息颜色
    getToastColor(type) {
        const colors = {
            'info': '#3b82f6',
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444'
        };
        return colors[type] || colors.info;
    }

    // 显示完成消息
    showCompletionMessage() {
        const message = `
🎉 演示完成！

您已体验了RWA项目平台的核心功能：
✅ 用户注册登录管理
✅ 项目申请管理
✅ RWA项目购买交易

接下来您可以：
• 深入体验各个功能模块
• 查看资产管理页面
• 测试不同用户角色
• 探索更多高级功能
        `;
        
        alert(message);
    }

    // 重置演示
    resetDemo() {
        this.currentStep = 0;
        this.updateStatus('演示已重置');
        
        // 登出用户
        if (window.authManager && window.authManager.isLoggedIn()) {
            window.authManager.logout();
        }
        
        // 清除所有模态框
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
        
        // 返回首页
        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
            window.location.href = '/';
        }
        
        this.showToast('🔄 演示环境已重置', 'info');
    }

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 获取演示数据
    getDemoData() {
        return this.demoData;
    }

    // 设置演示数据
    setDemoData(data) {
        this.demoData = { ...this.demoData, ...data };
    }
}

// 创建全局演示实例
window.demo = new DemoScript();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 RWA项目平台演示环境已准备就绪！');
    console.log('💡 按 Ctrl+D 打开演示控制台');
});

// 导出演示脚本（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DemoScript;
}