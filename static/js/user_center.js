/**
 * 用户个人中心管理模块
 * 提供用户信息管理、投资管理、订单管理等功能
 */

class UserCenterManager {
    constructor() {
        this.apiClient = window.apiClient;
        this.authManager = window.authManager;
        this.currentUser = null;
        this.userInvestments = [];
        this.userOrders = [];
        this.currentSection = 'dashboard';
        this.init();
    }

    // 初始化用户中心
    async init() {
        // 检查用户登录状态
        if (!this.authManager.isLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }

        this.currentUser = this.authManager.getCurrentUser();
        this.setupEventListeners();
        await this.loadUserData();
        this.updateUserInfo();
        this.loadDashboardData();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 导航菜单点击事件
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // 个人资料表单提交
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }

        // 密码修改表单提交
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }

        // 充值表单提交
        const depositForm = document.getElementById('depositForm');
        if (depositForm) {
            depositForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processDeposit();
            });
        }
    }

    // 切换页面部分
    switchSection(sectionName) {
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // 更新内容显示
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        this.currentSection = sectionName;

        // 根据不同部分加载相应数据
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'investments':
                this.loadInvestments();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'wallet':
                this.loadWalletData();
                break;
            case 'notifications':
                this.loadNotifications();
                break;
        }
    }

    // 加载用户数据
    async loadUserData() {
        try {
            // 加载用户投资数据
            const investmentResponse = await this.apiClient.investments.getUserInvestments();
            this.userInvestments = investmentResponse.investments || [];

            // 加载用户订单数据
            // const orderResponse = await this.apiClient.orders.getUserOrders();
            // this.userOrders = orderResponse.orders || [];

        } catch (error) {
            console.error('加载用户数据失败:', error);
            this.showNotification('加载数据失败，请刷新页面重试', 'error');
        }
    }

    // 更新用户信息显示
    updateUserInfo() {
        if (!this.currentUser) return;

        // 更新用户头像
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.textContent = this.currentUser.username ? this.currentUser.username.charAt(0).toUpperCase() : 'U';
        }

        // 更新用户名和邮箱
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        if (userName) userName.textContent = this.currentUser.username || '用户名';
        if (userEmail) userEmail.textContent = this.currentUser.email || 'user@example.com';

        // 填充个人资料表单
        this.fillProfileForm();
    }

    // 填充个人资料表单
    fillProfileForm() {
        const fields = {
            'fullName': this.currentUser.fullName || '',
            'phone': this.currentUser.phone || '',
            'idCard': this.currentUser.idCard || '',
            'occupation': this.currentUser.occupation || ''
        };

        Object.keys(fields).forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = fields[fieldId];
            }
        });
    }

    // 加载仪表板数据
    async loadDashboardData() {
        try {
            // 计算投资统计
            const totalInvestment = this.userInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
            const totalReturn = this.userInvestments.reduce((sum, inv) => sum + (inv.currentValue || inv.amount || 0) - (inv.amount || 0), 0);
            const activeInvestments = this.userInvestments.filter(inv => inv.status === 'active').length;

            // 更新统计显示
            this.updateElement('totalInvestment', `¥${this.formatNumber(totalInvestment)}`);
            this.updateElement('totalReturn', `¥${this.formatNumber(totalReturn)}`);
            this.updateElement('activeInvestments', activeInvestments.toString());

            // 加载最近投资
            this.loadRecentInvestments();

        } catch (error) {
            console.error('加载仪表板数据失败:', error);
        }
    }

    // 加载最近投资
    loadRecentInvestments() {
        const container = document.getElementById('recentInvestments');
        if (!container) return;

        const recentInvestments = this.userInvestments.slice(0, 5);
        
        if (recentInvestments.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">暂无投资记录</p>';
            return;
        }

        container.innerHTML = recentInvestments.map(investment => `
            <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div>
                    <h4 class="font-medium">${investment.projectName || '投资项目'}</h4>
                    <p class="text-sm text-gray-500">${this.formatDate(investment.createdAt)}</p>
                </div>
                <div class="text-right">
                    <div class="font-medium">¥${this.formatNumber(investment.amount || 0)}</div>
                    <div class="text-sm ${this.getStatusColor(investment.status)}">
                        ${this.getStatusText(investment.status)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 加载投资列表
    async loadInvestments() {
        const container = document.getElementById('investmentsList');
        if (!container) return;

        if (this.userInvestments.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">暂无投资记录</p>';
            return;
        }

        container.innerHTML = this.userInvestments.map(investment => `
            <div class="investment-card">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold">${investment.projectName || '投资项目'}</h3>
                    <span class="px-3 py-1 rounded-full text-sm ${this.getStatusBadgeClass(investment.status)}">
                        ${this.getStatusText(investment.status)}
                    </span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <div class="text-sm text-gray-500">投资金额</div>
                        <div class="font-medium">¥${this.formatNumber(investment.amount || 0)}</div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-500">当前价值</div>
                        <div class="font-medium">¥${this.formatNumber(investment.currentValue || investment.amount || 0)}</div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-500">收益率</div>
                        <div class="font-medium ${this.getReturnColor(investment)}">
                            ${this.calculateReturn(investment)}%
                        </div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-500">投资日期</div>
                        <div class="font-medium">${this.formatDate(investment.createdAt)}</div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button class="btn-primary" onclick="userCenter.viewInvestmentDetail('${investment.id}')">查看详情</button>
                    ${investment.status === 'active' ? '<button class="btn btn-outline" onclick="userCenter.sellInvestment(\'' + investment.id + '\'))">卖出</button>' : ''}
                </div>
            </div>
        `).join('');
    }

    // 加载订单列表
    async loadOrders() {
        const container = document.getElementById('ordersList');
        if (!container) return;

        // 模拟订单数据
        const mockOrders = [
            {
                id: '1',
                productName: 'RWA房地产投资基金',
                amount: 50000,
                status: 'completed',
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                productName: 'RWA艺术品投资',
                amount: 30000,
                status: 'pending',
                createdAt: new Date().toISOString()
            }
        ];

        if (mockOrders.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">暂无订单记录</p>';
            return;
        }

        container.innerHTML = mockOrders.map(order => `
            <div class="investment-card">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold">${order.productName}</h3>
                    <span class="px-3 py-1 rounded-full text-sm ${this.getStatusBadgeClass(order.status)}">
                        ${this.getStatusText(order.status)}
                    </span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <div class="text-sm text-gray-500">订单金额</div>
                        <div class="font-medium">¥${this.formatNumber(order.amount)}</div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-500">订单编号</div>
                        <div class="font-medium">#${order.id}</div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-500">下单时间</div>
                        <div class="font-medium">${this.formatDate(order.createdAt)}</div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button class="btn-primary" onclick="userCenter.viewOrderDetail('${order.id}')">查看详情</button>
                    ${order.status === 'pending' ? '<button class="btn btn-outline" onclick="userCenter.cancelOrder(\'' + order.id + '\'))">取消订单</button>' : ''}
                </div>
            </div>
        `).join('');
    }

    // 加载钱包数据
    async loadWalletData() {
        try {
            // 模拟钱包余额
            const walletBalance = 125000;
            this.updateElement('walletBalance', `¥${this.formatNumber(walletBalance)}`);

            // 加载交易记录
            this.loadTransactionHistory();

        } catch (error) {
            console.error('加载钱包数据失败:', error);
        }
    }

    // 加载交易记录
    loadTransactionHistory() {
        const container = document.getElementById('transactionHistory');
        if (!container) return;

        // 模拟交易记录
        const mockTransactions = [
            { type: 'deposit', amount: 50000, date: new Date().toISOString(), description: '银行卡充值' },
            { type: 'investment', amount: -30000, date: new Date().toISOString(), description: '购买RWA产品' },
            { type: 'return', amount: 1500, date: new Date().toISOString(), description: '投资收益' }
        ];

        container.innerHTML = mockTransactions.map(transaction => `
            <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                    <div class="font-medium">${transaction.description}</div>
                    <div class="text-sm text-gray-500">${this.formatDate(transaction.date)}</div>
                </div>
                <div class="font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}">
                    ${transaction.amount > 0 ? '+' : ''}¥${this.formatNumber(Math.abs(transaction.amount))}
                </div>
            </div>
        `).join('');
    }

    // 加载通知列表
    async loadNotifications() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        // 模拟通知数据
        const mockNotifications = [
            {
                id: '1',
                title: '投资收益到账',
                content: '您的RWA房地产投资基金产生收益¥1,500',
                type: 'success',
                read: false,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                title: '系统维护通知',
                content: '系统将于今晚22:00-24:00进行维护升级',
                type: 'info',
                read: true,
                createdAt: new Date().toISOString()
            }
        ];

        container.innerHTML = mockNotifications.map(notification => `
            <div class="investment-card ${!notification.read ? 'border-l-4 border-blue-500' : ''}">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold mb-2">${notification.title}</h3>
                        <p class="text-gray-600 mb-2">${notification.content}</p>
                        <div class="text-sm text-gray-500">${this.formatDate(notification.createdAt)}</div>
                    </div>
                    <div class="ml-4">
                        ${!notification.read ? '<span class="w-3 h-3 bg-blue-500 rounded-full"></span>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 更新个人资料
    async updateProfile() {
        try {
            const formData = {
                fullName: document.getElementById('fullName').value,
                phone: document.getElementById('phone').value,
                idCard: document.getElementById('idCard').value,
                occupation: document.getElementById('occupation').value
            };

            const response = await this.authManager.updateProfile(formData);
            
            if (response.success) {
                this.showNotification('个人资料更新成功', 'success');
                this.currentUser = { ...this.currentUser, ...formData };
            } else {
                this.showNotification(response.error || '更新失败', 'error');
            }
        } catch (error) {
            console.error('更新个人资料失败:', error);
            this.showNotification('更新失败，请稍后重试', 'error');
        }
    }

    // 修改密码
    async changePassword() {
        try {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                this.showNotification('新密码和确认密码不匹配', 'error');
                return;
            }

            // 调用API修改密码
            // const response = await this.apiClient.users.changePassword({
            //     currentPassword,
            //     newPassword
            // });

            // 模拟成功响应
            this.showNotification('密码修改成功', 'success');
            document.getElementById('passwordForm').reset();

        } catch (error) {
            console.error('修改密码失败:', error);
            this.showNotification('修改密码失败，请稍后重试', 'error');
        }
    }

    // 处理充值
    async processDeposit() {
        try {
            const amount = parseFloat(document.getElementById('depositAmount').value);
            const paymentMethod = document.getElementById('paymentMethod').value;

            if (!amount || amount <= 0) {
                this.showNotification('请输入有效的充值金额', 'error');
                return;
            }

            // 调用API处理充值
            // const response = await this.apiClient.wallet.deposit({
            //     amount,
            //     paymentMethod
            // });

            // 模拟成功响应
            this.showNotification(`充值¥${this.formatNumber(amount)}成功`, 'success');
            this.hideDepositModal();
            this.loadWalletData();

        } catch (error) {
            console.error('充值失败:', error);
            this.showNotification('充值失败，请稍后重试', 'error');
        }
    }

    // 显示充值模态框
    showDepositModal() {
        const modal = document.getElementById('depositModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    // 隐藏充值模态框
    hideDepositModal() {
        const modal = document.getElementById('depositModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        document.getElementById('depositForm').reset();
    }

    // 工具方法
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    formatNumber(num) {
        return new Intl.NumberFormat('zh-CN').format(num);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('zh-CN');
    }

    getStatusText(status) {
        const statusMap = {
            'active': '进行中',
            'completed': '已完成',
            'cancelled': '已取消',
            'pending': '待处理'
        };
        return statusMap[status] || status;
    }

    getStatusColor(status) {
        const colorMap = {
            'active': 'text-green-600',
            'completed': 'text-blue-600',
            'cancelled': 'text-red-600',
            'pending': 'text-yellow-600'
        };
        return colorMap[status] || 'text-gray-600';
    }

    getStatusBadgeClass(status) {
        const classMap = {
            'active': 'bg-green-100 text-green-800',
            'completed': 'bg-blue-100 text-blue-800',
            'cancelled': 'bg-red-100 text-red-800',
            'pending': 'bg-yellow-100 text-yellow-800'
        };
        return classMap[status] || 'bg-gray-100 text-gray-800';
    }

    calculateReturn(investment) {
        const amount = investment.amount || 0;
        const currentValue = investment.currentValue || amount;
        if (amount === 0) return '0.00';
        return (((currentValue - amount) / amount) * 100).toFixed(2);
    }

    getReturnColor(investment) {
        const returnRate = parseFloat(this.calculateReturn(investment));
        return returnRate >= 0 ? 'text-green-600' : 'text-red-600';
    }

    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        } text-white`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // 查看投资详情
    viewInvestmentDetail(investmentId) {
        // 跳转到投资详情页面或显示详情模态框
        this.showNotification('投资详情功能开发中...', 'info');
    }

    // 卖出投资
    sellInvestment(investmentId) {
        if (confirm('确定要卖出这项投资吗？')) {
            this.showNotification('卖出功能开发中...', 'info');
        }
    }

    // 查看订单详情
    viewOrderDetail(orderId) {
        this.showNotification('订单详情功能开发中...', 'info');
    }

    // 取消订单
    cancelOrder(orderId) {
        if (confirm('确定要取消这个订单吗？')) {
            this.showNotification('取消订单功能开发中...', 'info');
        }
    }
}

// 全局变量
let userCenter;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    userCenter = new UserCenterManager();
});

// 全局函数
function showDepositModal() {
    userCenter.showDepositModal();
}

function hideDepositModal() {
    userCenter.hideDepositModal();
}

function showAllInvestments() {
    userCenter.loadInvestments();
}

function filterInvestments(status) {
    // 实现投资筛选功能
    userCenter.showNotification(`筛选${userCenter.getStatusText(status)}投资`, 'info');
}