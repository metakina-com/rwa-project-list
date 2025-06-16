// API客户端 - 与Cloudflare Functions通信
// 统一的API调用接口

class APIClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
        this.authToken = null;
    }

    // 设置认证令牌
    setAuthToken(token) {
        this.authToken = token;
    }

    // 清除认证令牌
    clearAuthToken() {
        this.authToken = null;
    }

    // 获取请求头
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        return headers;
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: { ...this.getHeaders(), ...options.headers },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API请求失败 [${endpoint}]:`, error);
            throw error;
        }
    }

    // GET请求
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    // POST请求
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT请求
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE请求
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // 项目相关API
    projects = {
        // 获取所有项目
        getAll: () => this.get('/api/projects'),
        
        // 获取单个项目
        getById: (id) => this.get(`/api/projects/${id}`),
        
        // 创建项目
        create: (projectData) => this.post('/api/projects', projectData),
        
        // 更新项目状态
        updateStatus: (id, status) => this.put(`/api/projects/${id}/status`, { status }),
        
        // 删除项目
        delete: (id) => this.delete(`/api/projects/${id}`)
    };

    // AI风险评估API
    riskAssessment = {
        // 执行风险评估
        assess: (projectId, projectData) => this.post('/api/ai-risk-assessment', {
            projectId,
            projectData
        }),
        
        // 获取项目风险评估历史
        getHistory: (projectId) => this.get(`/api/ai-risk-assessment/${projectId}`),
        
        // 获取风险评估统计
        getStats: () => this.get('/api/ai-risk-assessment/stats/overview')
    };

    // 用户相关API（预留）
    users = {
        // 用户注册
        register: (userData) => this.post('/api/users/register', userData),
        
        // 钱包注册
        registerWithWallet: (walletAddress, username = null, email = null) => this.post('/api/users/register', {
            registration_type: 'wallet',
            wallet_address: walletAddress,
            username: username,
            email: email
        }),
        
        // 钱包登录
        loginWithWallet: (walletAddress) => this.get(`/api/users/wallet/${walletAddress}`),
        
        // 用户登录
        login: (credentials) => this.post('/api/users/login', credentials),
        
        // 用户登出
        logout: () => this.post('/api/users/logout'),
        
        // 验证用户
        verify: () => this.get('/api/users/verify'),
        
        // 获取用户信息
        getProfile: (userId) => this.get(`/api/users/${userId}`),
        
        // 更新用户信息
        updateProfile: (userId, userData) => this.put(`/api/users/${userId}`, userData),
        
        // 更新KYC状态
        updateKYC: (userId, kycData) => this.put(`/api/users/${userId}/kyc`, kycData)
    };

    // 投资相关API（预留）
    investments = {
        // 创建投资
        create: (investmentData) => this.post('/api/investments', investmentData),
        
        // 获取用户投资记录
        getByUser: (userId) => this.get(`/api/investments/user/${userId}`),
        
        // 获取当前用户投资记录
        getUserInvestments: () => this.get('/api/investments/user'),
        
        // 获取项目投资记录
        getByProject: (projectId) => this.get(`/api/investments/project/${projectId}`),
        
        // 获取投资详情
        getById: (investmentId) => this.get(`/api/investments/${investmentId}`),
        
        // 更新投资状态
        updateStatus: (investmentId, status) => this.put(`/api/investments/${investmentId}/status`, { status })
    };

    // 交易相关API
    transactions = {
        // 获取用户交易记录
        getByUser: (userId) => this.get(`/api/transactions/user/${userId}`),
        
        // 获取项目交易记录
        getByProject: (projectId) => this.get(`/api/transactions/project/${projectId}`),
        
        // 获取交易详情
        getById: (transactionId) => this.get(`/api/transactions/${transactionId}`)
    };
}

// 创建全局API客户端实例
const apiClient = new APIClient();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}

// 全局错误处理
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('API请求失败')) {
        console.error('未处理的API错误:', event.reason);
        // 可以在这里添加用户友好的错误提示
        showNotification('网络请求失败，请检查网络连接', 'error');
    }
});

// 通用通知函数
function showNotification(message, type = 'info', duration = 3000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // 创建图标
    const icon = document.createElement('div');
    icon.className = 'notification-icon';
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    icon.textContent = icons[type] || icons.info;
    
    // 创建消息容器
    const messageContainer = document.createElement('div');
    messageContainer.className = 'notification-message';
    messageContainer.textContent = message;
    
    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.innerHTML = '×';
    closeButton.onclick = () => hideNotification(notification);
    
    notification.appendChild(icon);
    notification.appendChild(messageContainer);
    notification.appendChild(closeButton);
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        border-radius: 12px;
        color: white;
        font-weight: 500;
        z-index: 10001;
        max-width: 420px;
        min-width: 300px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        transform: translateX(calc(100% + 20px));
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 12px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 14px;
        line-height: 1.4;
    `;
    
    // 设置背景色和渐变
    const colors = {
        success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    notification.style.background = colors[type] || colors.info;
    
    // 图标样式
    icon.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        flex-shrink: 0;
    `;
    
    // 消息样式
    messageContainer.style.cssText = `
        flex: 1;
        margin: 0;
    `;
    
    // 关闭按钮样式
    closeButton.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.2s ease;
        flex-shrink: 0;
    `;
    
    closeButton.onmouseover = () => {
        closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
        closeButton.style.transform = 'scale(1.1)';
    };
    
    closeButton.onmouseout = () => {
        closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
        closeButton.style.transform = 'scale(1)';
    };
    
    // 隐藏通知的函数
    function hideNotification(notificationElement) {
        notificationElement.style.transform = 'translateX(calc(100% + 20px))';
        notificationElement.style.opacity = '0';
        setTimeout(() => {
            if (notificationElement.parentNode) {
                notificationElement.parentNode.removeChild(notificationElement);
            }
        }, 400);
    }
     
     document.body.appendChild(notification);
     
     // 显示动画
     setTimeout(() => {
         notification.style.transform = 'translateX(0)';
         notification.style.opacity = '1';
     }, 100);
      
      // 自动隐藏
      setTimeout(() => {
          hideNotification(notification);
      }, duration);
}

// 加载状态管理
class LoadingManager {
    constructor() {
        this.loadingCount = 0;
        this.overlay = null;
    }
    
    show(message = '加载中...') {
        this.loadingCount++;
        
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay';
            this.overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                backdrop-filter: blur(2px);
            `;
            
            const spinner = document.createElement('div');
            spinner.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            `;
            
            const spinnerIcon = document.createElement('div');
            spinnerIcon.style.cssText = `
                width: 40px;
                height: 40px;
                border: 4px solid #f3f4f6;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            `;
            
            const text = document.createElement('div');
            text.textContent = message;
            text.style.cssText = `
                color: #374151;
                font-weight: 500;
            `;
            
            // 添加旋转动画
            if (!document.querySelector('#loading-spinner-style')) {
                const style = document.createElement('style');
                style.id = 'loading-spinner-style';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            spinner.appendChild(spinnerIcon);
            spinner.appendChild(text);
            this.overlay.appendChild(spinner);
            document.body.appendChild(this.overlay);
        }
    }
    
    hide() {
        this.loadingCount = Math.max(0, this.loadingCount - 1);
        
        if (this.loadingCount === 0 && this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
}

// 创建全局加载管理器
const loadingManager = new LoadingManager();

// 为API客户端添加加载状态
const originalRequest = APIClient.prototype.request;
APIClient.prototype.request = async function(endpoint, options = {}) {
    const showLoading = options.showLoading !== false;
    
    if (showLoading) {
        loadingManager.show();
    }
    
    try {
        const result = await originalRequest.call(this, endpoint, options);
        return result;
    } finally {
        if (showLoading) {
            loadingManager.hide();
        }
    }
};

// 创建全局API客户端实例
window.apiClient = new APIClient();