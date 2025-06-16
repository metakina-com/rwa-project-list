/**
 * 用户认证管理模块
 * 提供登录、注册、会话管理等功能
 */

class AuthManager {
    constructor() {
        this.apiClient = window.apiClient;
        this.currentUser = null;
        this.authToken = null;
        this.init();
    }

    // 初始化认证管理器
    init() {
        // 从localStorage恢复用户状态
        this.loadUserFromStorage();
        
        // 验证令牌有效性
        if (this.authToken) {
            this.verifyToken();
        }
    }

    // 从本地存储加载用户信息
    loadUserFromStorage() {
        try {
            const userInfo = localStorage.getItem('userInfo');
            const authToken = localStorage.getItem('authToken');
            
            if (userInfo && authToken) {
                this.currentUser = JSON.parse(userInfo);
                this.authToken = authToken;
                
                // 设置API客户端的认证头
                this.apiClient.setAuthToken(authToken);
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
            this.clearUserData();
        }
    }

    // 保存用户信息到本地存储
    saveUserToStorage(user, token) {
        try {
            localStorage.setItem('userInfo', JSON.stringify(user));
            localStorage.setItem('authToken', token);
            localStorage.setItem('userLoggedIn', 'true');
        } catch (error) {
            console.error('保存用户信息失败:', error);
        }
    }

    // 清除用户数据
    clearUserData() {
        this.currentUser = null;
        this.authToken = null;
        localStorage.removeItem('userInfo');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userLoggedIn');
        
        // 清除API客户端的认证头
        this.apiClient.clearAuthToken();
    }

    // 用户注册
    async register(userData) {
        try {
            const response = await this.apiClient.users.register(userData);
            
            if (response.success) {
                this.currentUser = response.user;
                this.authToken = response.token;
                
                // 保存到本地存储
                this.saveUserToStorage(response.user, response.token);
                
                // 设置API客户端的认证头
                this.apiClient.setAuthToken(response.token);
                
                // 触发登录成功事件
                this.triggerAuthEvent('register', response.user);
                
                return {
                    success: true,
                    message: response.message,
                    user: response.user
                };
            } else {
                return {
                    success: false,
                    error: response.error || '注册失败'
                };
            }
        } catch (error) {
            console.error('注册错误:', error);
            return {
                success: false,
                error: error.message || '注册失败，请稍后重试'
            };
        }
    }

    // 用户登录
    async login(credentials) {
        try {
            const response = await this.apiClient.users.login(credentials);
            
            if (response.success) {
                this.currentUser = response.user;
                this.authToken = response.token;
                
                // 保存到本地存储
                this.saveUserToStorage(response.user, response.token);
                
                // 设置API客户端的认证头
                this.apiClient.setAuthToken(response.token);
                
                // 触发登录成功事件
                this.triggerAuthEvent('login', response.user);
                
                return {
                    success: true,
                    message: response.message,
                    user: response.user
                };
            } else {
                return {
                    success: false,
                    error: response.error || '登录失败'
                };
            }
        } catch (error) {
            console.error('登录错误:', error);
            return {
                success: false,
                error: error.message || '登录失败，请稍后重试'
            };
        }
    }

    // 用户登出
    async logout() {
        try {
            // 调用API登出
            await this.apiClient.users.logout();
        } catch (error) {
            console.error('登出API调用失败:', error);
        } finally {
            // 无论API调用是否成功，都清除本地数据
            const user = this.currentUser;
            this.clearUserData();
            
            // 触发登出事件
            this.triggerAuthEvent('logout', user);
        }
    }

    // 验证令牌有效性
    async verifyToken() {
        try {
            const response = await this.apiClient.users.verify();
            
            if (!response.valid) {
                // 令牌无效，清除用户数据
                this.clearUserData();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('令牌验证失败:', error);
            this.clearUserData();
            return false;
        }
    }

    // 获取当前用户信息
    getCurrentUser() {
        return this.currentUser;
    }

    // 检查用户是否已登录
    isLoggedIn() {
        return !!(this.currentUser && this.authToken);
    }

    // 检查用户是否已完成KYC
    isKYCApproved() {
        return this.currentUser && this.currentUser.kyc_status === 'approved';
    }

    // 更新用户信息
    async updateProfile(userData) {
        try {
            const response = await this.apiClient.users.updateProfile(userData);
            
            if (response.success) {
                this.currentUser = response.user;
                this.saveUserToStorage(response.user, this.authToken);
                
                // 触发用户信息更新事件
                this.triggerAuthEvent('profileUpdate', response.user);
                
                return {
                    success: true,
                    message: response.message,
                    user: response.user
                };
            } else {
                return {
                    success: false,
                    error: response.error || '更新失败'
                };
            }
        } catch (error) {
            console.error('更新用户信息错误:', error);
            return {
                success: false,
                error: error.message || '更新失败，请稍后重试'
            };
        }
    }

    // 触发认证相关事件
    triggerAuthEvent(eventType, userData) {
        const event = new CustomEvent('authStateChange', {
            detail: {
                type: eventType,
                user: userData,
                isLoggedIn: this.isLoggedIn()
            }
        });
        
        document.dispatchEvent(event);
    }

    // 显示登录模态框
    showLoginModal() {
        const existingModal = document.getElementById('authModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; margin: 5% auto;">
                <div class="modal-header">
                    <h2 id="authModalTitle">用户登录</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="auth-tabs">
                        <button class="tab-btn active" onclick="authManager.switchAuthTab('login')">登录</button>
                        <button class="tab-btn" onclick="authManager.switchAuthTab('register')">注册</button>
                    </div>
                    
                    <!-- 登录表单 -->
                    <form id="loginForm" class="auth-form" style="display: block;">
                        <div class="form-group">
                            <label class="form-label">邮箱</label>
                            <input type="email" class="form-input" id="loginEmail" placeholder="请输入邮箱" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-input" id="loginPassword" placeholder="请输入密码" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="authManager.simulateLogin()">模拟登录</button>
                            <button type="submit" class="btn btn-primary">登录</button>
                        </div>
                    </form>
                    
                    <!-- 注册表单 -->
                    <form id="registerForm" class="auth-form" style="display: none;">
                        <div class="form-group">
                            <label class="form-label">姓名</label>
                            <input type="text" class="form-input" id="registerName" placeholder="请输入姓名" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">邮箱</label>
                            <input type="email" class="form-input" id="registerEmail" placeholder="请输入邮箱" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-input" id="registerPassword" placeholder="请输入密码（至少6位）" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码</label>
                            <input type="password" class="form-input" id="confirmPassword" placeholder="请再次输入密码" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">手机号（可选）</label>
                            <input type="tel" class="form-input" id="registerPhone" placeholder="请输入手机号">
                        </div>
                        <div class="form-group">
                            <label class="form-label">钱包地址（可选）</label>
                            <input type="text" class="form-input" id="registerWallet" placeholder="请输入钱包地址">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">注册</button>
                        </div>
                    </form>
                    
                    <div id="authMessage" class="message" style="display: none;"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定表单提交事件
        this.bindAuthFormEvents();
    }

    // 切换认证标签页
    switchAuthTab(tab) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const title = document.getElementById('authModalTitle');
        const tabs = document.querySelectorAll('.tab-btn');

        tabs.forEach(t => t.classList.remove('active'));

        if (tab === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            title.textContent = '用户登录';
            tabs[0].classList.add('active');
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            title.textContent = '用户注册';
            tabs[1].classList.add('active');
        }

        this.clearAuthMessage();
    }

    // 绑定认证表单事件
    bindAuthFormEvents() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });
    }

    // 处理登录
    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showAuthMessage('请输入邮箱和密码', 'error');
            return;
        }

        this.showAuthMessage('正在登录...', 'info');

        const result = await this.login({ email, password });

        if (result.success) {
            this.showAuthMessage('登录成功！', 'success');
            setTimeout(() => {
                document.getElementById('authModal').remove();
            }, 1000);
        } else {
            this.showAuthMessage(result.error, 'error');
        }
    }

    // 处理注册
    async handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const phone = document.getElementById('registerPhone').value;
        const wallet_address = document.getElementById('registerWallet').value;

        if (!name || !email || !password) {
            this.showAuthMessage('请填写必填字段', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showAuthMessage('两次输入的密码不一致', 'error');
            return;
        }

        if (password.length < 6) {
            this.showAuthMessage('密码至少需要6位', 'error');
            return;
        }

        this.showAuthMessage('正在注册...', 'info');

        const userData = {
            name,
            email,
            password
        };

        if (phone) userData.phone = phone;
        if (wallet_address) userData.wallet_address = wallet_address;

        const result = await this.register(userData);

        if (result.success) {
            this.showAuthMessage('注册成功！', 'success');
            setTimeout(() => {
                document.getElementById('authModal').remove();
            }, 1000);
        } else {
            this.showAuthMessage(result.error, 'error');
        }
    }

    // 模拟登录（用于演示）
    simulateLogin() {
        const mockUser = {
            id: 'demo_user_' + Date.now(),
            email: 'demo@example.com',
            name: '演示用户',
            phone: '13800138000',
            wallet_address: '0x1234567890abcdef',
            kyc_status: 'approved'
        };

        const mockToken = 'demo_token_' + Date.now();

        this.currentUser = mockUser;
        this.authToken = mockToken;
        this.saveUserToStorage(mockUser, mockToken);
        this.apiClient.setAuthToken(mockToken);

        this.triggerAuthEvent('login', mockUser);
        this.showAuthMessage('模拟登录成功！', 'success');

        setTimeout(() => {
            const modal = document.getElementById('authModal');
            if (modal) modal.remove();
        }, 1000);
    }

    // 显示认证消息
    showAuthMessage(message, type = 'info') {
        const messageEl = document.getElementById('authMessage');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `message ${type}`;
            messageEl.style.display = 'block';
        }
    }

    // 清除认证消息
    clearAuthMessage() {
        const messageEl = document.getElementById('authMessage');
        if (messageEl) {
            messageEl.style.display = 'none';
        }
    }

    // 更新页面用户显示
    updateUserDisplay() {
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;

        // 移除现有的用户信息或登录按钮
        const existingUserInfo = navActions.querySelector('.user-info');
        const existingLoginBtn = navActions.querySelector('.login-btn');
        if (existingUserInfo) {
            existingUserInfo.remove();
        }
        if (existingLoginBtn) {
            existingLoginBtn.remove();
        }

        if (this.isLoggedIn()) {
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <div class="user-avatar">
                    <span>${this.currentUser.name.charAt(0)}</span>
                </div>
                <div class="user-details">
                    <div class="user-name">${this.currentUser.name}</div>
                    <div class="user-status">KYC: ${this.getKYCStatusText()}</div>
                </div>
                <div class="user-actions">
                    <button class="btn btn-sm" onclick="authManager.showProfileModal()">个人中心</button>
                    <button class="btn btn-sm btn-secondary" onclick="authManager.logout()">登出</button>
                </div>
            `;
            navActions.appendChild(userInfo);
        } else {
            const loginBtn = document.createElement('button');
            loginBtn.className = 'btn btn-primary login-btn';
            loginBtn.textContent = '登录';
            loginBtn.onclick = () => this.showLoginModal();
            navActions.appendChild(loginBtn);
        }
    }

    // 获取KYC状态文本
    getKYCStatusText() {
        const statusMap = {
            'pending': '待审核',
            'approved': '已通过',
            'rejected': '已拒绝'
        };
        return statusMap[this.currentUser?.kyc_status] || '未知';
    }

    // 显示个人中心模态框
    showProfileModal() {
        // 这里可以实现个人中心功能
        alert('个人中心功能开发中...');
    }
}

// 创建全局认证管理器实例
window.authManager = new AuthManager();

// 监听认证状态变化
document.addEventListener('authStateChange', (event) => {
    const { type, user, isLoggedIn } = event.detail;
    
    console.log('认证状态变化:', type, user, isLoggedIn);
    
    // 更新用户显示
    window.authManager.updateUserDisplay();
    
    // 可以在这里添加其他需要响应认证状态变化的逻辑
});

// 创建全局认证管理器实例
window.authManager = new AuthManager();

// 页面加载完成后初始化用户显示
document.addEventListener('DOMContentLoaded', () => {
    window.authManager.updateUserDisplay();
});