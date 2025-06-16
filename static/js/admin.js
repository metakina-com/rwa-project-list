// 后台管理系统主要JavaScript文件

// 全局变量
let currentSection = 'dashboard';
let currentPage = 1;
let pageSize = 10;
let isLoggedIn = false;

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
    checkLoginStatus();
});

// 检查登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('admin_token');
    if (token) {
        showAdminPanel();
        showSection('dashboard');
        loadDashboardData();
    } else {
        showLoginPage();
    }
}

// 显示登录页面
function showLoginPage() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
}

// 显示管理面板
function showAdminPanel() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'flex';
    isLoggedIn = true;
}

// 初始化管理系统
function initializeAdmin() {
    // 绑定登录表单
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // 显示加载状态
    const loginText = document.getElementById('login-text');
    const loginLoading = document.getElementById('login-loading');
    loginText.style.display = 'none';
    loginLoading.style.display = 'inline-block';
    
    try {
        // 模拟登录请求
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 简单验证（实际应用中应该调用后端API）
        if (username === 'admin' && password === 'admin123') {
            // 保存登录状态
            const token = 'admin_token_' + Date.now();
            localStorage.setItem('admin_token', token);
            if (remember) {
                localStorage.setItem('admin_remember', 'true');
            }
            
            showAdminPanel();
            showSection('dashboard');
            loadDashboardData();
            showAlert('登录成功！', 'success');
        } else {
            showAlert('用户名或密码错误！', 'danger');
        }
    } catch (error) {
        showAlert('登录失败，请稍后重试！', 'danger');
    } finally {
        // 恢复按钮状态
        loginText.style.display = 'inline';
        loginLoading.style.display = 'none';
    }
}

// 退出登录
function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_remember');
    isLoggedIn = false;
    showLoginPage();
    showAlert('已安全退出！', 'info');
}

// 显示指定页面
function showSection(sectionName) {
    if (!isLoggedIn) {
        showLoginPage();
        return;
    }
    
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const navElement = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (navElement) {
        navElement.classList.add('active');
    }
    
    // 更新页面标题
    const titles = {
        'dashboard': '仪表盘',
        'users': '用户管理',
        'projects': '项目管理',
        'tenants': '租户管理',
        'fees': '手续费管理',
        'functions': '功能管理',
        'courses': '课程管理',
        'resources': '资源库',
        'files': '文件管理',
        'settings': '系统设置'
    };
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionName];
    }
    
    currentSection = sectionName;
    
    // 隐藏仪表盘，显示动态内容
    if (sectionName === 'dashboard') {
        const dashboardSection = document.getElementById('dashboard-section');
        const dynamicContent = document.getElementById('dynamic-content');
        if (dashboardSection) {
            dashboardSection.style.display = 'block';
        }
        if (dynamicContent) {
            dynamicContent.innerHTML = '';
        }
    } else {
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
            dashboardSection.style.display = 'none';
        }
        loadSectionContent(sectionName);
    }
}

// 加载页面内容
function loadSectionContent(sectionName) {
    const content = getSectionContent(sectionName);
    document.getElementById('dynamic-content').innerHTML = content;
    
    // 根据页面类型加载数据
    switch(sectionName) {
        case 'users':
            loadUsersData();
            break;
        case 'projects':
            loadProjectsData();
            break;
        case 'tenants':
            loadTenantsData();
            break;
        case 'fees':
            loadFeesData();
            break;
        case 'functions':
            loadFunctionsData();
            break;
        case 'courses':
            loadCoursesData();
            break;
        case 'resources':
            loadResourcesData();
            break;
        case 'files':
            loadFilesData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

// 获取页面HTML内容
function getSectionContent(sectionName) {
    const contents = {
        'users': getUsersContent(),
        'projects': getProjectsContent(),
        'tenants': getTenantsContent(),
        'fees': getFeesContent(),
        'functions': getFunctionsContent(),
        'courses': getCoursesContent(),
        'resources': getResourcesContent(),
        'files': getFilesContent(),
        'settings': getSettingsContent()
    };
    return contents[sectionName] || '<div class="text-center py-8">页面内容加载中...</div>';
}

// 用户管理页面内容
function getUsersContent() {
    return `
        <div class="card p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold">用户管理</h3>
                <button onclick="showAddUserModal()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    <i class="fas fa-plus mr-2"></i>添加用户
                </button>
            </div>
            
            <!-- 搜索和筛选 -->
            <div class="flex flex-wrap gap-4 mb-6">
                <div class="flex-1 min-w-64">
                    <input type="text" id="userSearch" placeholder="搜索用户..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <select id="userStatusFilter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">所有状态</option>
                    <option value="active">活跃</option>
                    <option value="inactive">非活跃</option>
                    <option value="suspended">已暂停</option>
                </select>
                <select id="kycStatusFilter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">KYC状态</option>
                    <option value="pending">待审核</option>
                    <option value="approved">已通过</option>
                    <option value="rejected">已拒绝</option>
                </select>
            </div>
            
            <!-- 用户列表 -->
            <div class="overflow-x-auto">
                <table class="w-full table-auto">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">用户ID</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">姓名</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">邮箱</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">钱包地址</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">KYC状态</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">注册时间</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <!-- 数据将通过JavaScript加载 -->
                    </tbody>
                </table>
            </div>
            
            <!-- 分页 -->
            <div id="usersPagination" class="flex justify-between items-center mt-6">
                <!-- 分页控件将通过JavaScript生成 -->
            </div>
        </div>
    `;
}

// 项目管理页面内容
function getProjectsContent() {
    return `
        <div class="card p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold">项目管理</h3>
                <button onclick="showAddProjectModal()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    <i class="fas fa-plus mr-2"></i>添加项目
                </button>
            </div>
            
            <!-- 项目统计 -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="text-blue-600 text-sm font-medium">总项目数</div>
                    <div class="text-2xl font-bold text-blue-800" id="totalProjects">-</div>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="text-green-600 text-sm font-medium">活跃项目</div>
                    <div class="text-2xl font-bold text-green-800" id="activeProjects">-</div>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <div class="text-yellow-600 text-sm font-medium">待审核</div>
                    <div class="text-2xl font-bold text-yellow-800" id="pendingProjects">-</div>
                </div>
                <div class="bg-red-50 p-4 rounded-lg">
                    <div class="text-red-600 text-sm font-medium">已暂停</div>
                    <div class="text-2xl font-bold text-red-800" id="suspendedProjects">-</div>
                </div>
            </div>
            
            <!-- 搜索和筛选 -->
            <div class="flex flex-wrap gap-4 mb-6">
                <div class="flex-1 min-w-64">
                    <input type="text" id="projectSearch" placeholder="搜索项目..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <select id="projectTypeFilter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">所有类型</option>
                    <option value="real_estate">房地产</option>
                    <option value="infrastructure">基础设施</option>
                    <option value="energy">能源</option>
                    <option value="agriculture">农业</option>
                </select>
                <select id="projectStatusFilter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">所有状态</option>
                    <option value="筹备中">筹备中</option>
                    <option value="募资中">募资中</option>
                    <option value="运营中">运营中</option>
                    <option value="已完成">已完成</option>
                </select>
            </div>
            
            <!-- 项目列表 -->
            <div class="overflow-x-auto">
                <table class="w-full table-auto">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">项目ID</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">项目名称</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">类型</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">资产价值</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">创建时间</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                        </tr>
                    </thead>
                    <tbody id="projectsTableBody">
                        <!-- 数据将通过JavaScript加载 -->
                    </tbody>
                </table>
            </div>
            
            <!-- 分页 -->
            <div id="projectsPagination" class="flex justify-between items-center mt-6">
                <!-- 分页控件将通过JavaScript生成 -->
            </div>
        </div>
    `;
}

// 租户管理页面内容
function getTenantsContent() {
    return `
        <div class="card p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold">租户管理</h3>
                <button onclick="showAddTenantModal()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    <i class="fas fa-plus mr-2"></i>添加租户
                </button>
            </div>
            
            <!-- 租户统计 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-purple-50 p-4 rounded-lg">
                    <div class="text-purple-600 text-sm font-medium">总租户数</div>
                    <div class="text-2xl font-bold text-purple-800" id="totalTenants">-</div>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="text-green-600 text-sm font-medium">活跃租户</div>
                    <div class="text-2xl font-bold text-green-800" id="activeTenants">-</div>
                </div>
                <div class="bg-orange-50 p-4 rounded-lg">
                    <div class="text-orange-600 text-sm font-medium">月收入</div>
                    <div class="text-2xl font-bold text-orange-800" id="monthlyRevenue">-</div>
                </div>
            </div>
            
            <!-- 租户列表 -->
            <div class="overflow-x-auto">
                <table class="w-full table-auto">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">租户ID</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">公司名称</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">联系人</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">套餐类型</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">到期时间</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                        </tr>
                    </thead>
                    <tbody id="tenantsTableBody">
                        <!-- 数据将通过JavaScript加载 -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 手续费管理页面内容
function getFeesContent() {
    return `
        <div class="space-y-6">
            <!-- 手续费配置 -->
            <div class="card p-6">
                <h3 class="text-xl font-semibold mb-6">手续费配置</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">交易手续费 (%)</label>
                        <input type="number" id="transactionFee" step="0.01" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">提现手续费 (%)</label>
                        <input type="number" id="withdrawalFee" step="0.01" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">平台服务费 (%)</label>
                        <input type="number" id="platformFee" step="0.01" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">最低手续费 (CNY)</label>
                        <input type="number" id="minimumFee" step="0.01" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
                
                <div class="mt-6">
                    <button onclick="saveFeeSettings()" class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        保存设置
                    </button>
                </div>
            </div>
            
            <!-- 手续费统计 -->
            <div class="card p-6">
                <h3 class="text-xl font-semibold mb-6">手续费统计</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <div class="text-blue-600 text-sm font-medium">今日收入</div>
                        <div class="text-2xl font-bold text-blue-800" id="todayFeeIncome">-</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg">
                        <div class="text-green-600 text-sm font-medium">本月收入</div>
                        <div class="text-2xl font-bold text-green-800" id="monthlyFeeIncome">-</div>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg">
                        <div class="text-purple-600 text-sm font-medium">总收入</div>
                        <div class="text-2xl font-bold text-purple-800" id="totalFeeIncome">-</div>
                    </div>
                    <div class="bg-orange-50 p-4 rounded-lg">
                        <div class="text-orange-600 text-sm font-medium">平均费率</div>
                        <div class="text-2xl font-bold text-orange-800" id="averageFeeRate">-</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 功能管理页面内容
function getFunctionsContent() {
    return `
        <div class="card p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold">功能管理</h3>
                <button onclick="showAddFunctionModal()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    <i class="fas fa-plus mr-2"></i>添加功能
                </button>
            </div>
            
            <!-- 功能模块列表 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="functionsGrid">
                <!-- 功能卡片将通过JavaScript生成 -->
            </div>
        </div>
    `;
}

// 课程管理页面内容
function getCoursesContent() {
    return `
        <div class="card p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold">课程管理</h3>
                <button onclick="showAddCourseModal()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    <i class="fas fa-plus mr-2"></i>添加课程
                </button>
            </div>
            
            <!-- 课程统计 -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-indigo-50 p-4 rounded-lg">
                    <div class="text-indigo-600 text-sm font-medium">总课程数</div>
                    <div class="text-2xl font-bold text-indigo-800" id="totalCourses">-</div>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="text-green-600 text-sm font-medium">已发布</div>
                    <div class="text-2xl font-bold text-green-800" id="publishedCourses">-</div>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <div class="text-yellow-600 text-sm font-medium">草稿</div>
                    <div class="text-2xl font-bold text-yellow-800" id="draftCourses">-</div>
                </div>
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="text-blue-600 text-sm font-medium">总学员</div>
                    <div class="text-2xl font-bold text-blue-800" id="totalStudents">-</div>
                </div>
            </div>
            
            <!-- 课程列表 -->
            <div class="overflow-x-auto">
                <table class="w-full table-auto">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">课程ID</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">课程名称</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">分类</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">讲师</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">学员数</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                        </tr>
                    </thead>
                    <tbody id="coursesTableBody">
                        <!-- 数据将通过JavaScript加载 -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 资源库页面内容
function getResourcesContent() {
    return `
        <div class="card p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold">资源库管理</h3>
                <div class="flex space-x-2">
                    <button onclick="showUploadResourceModal()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        <i class="fas fa-upload mr-2"></i>上传资源
                    </button>
                    <button onclick="showCreateFolderModal()" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                        <i class="fas fa-folder-plus mr-2"></i>新建文件夹
                    </button>
                </div>
            </div>
            
            <!-- 资源分类 -->
            <div class="flex flex-wrap gap-2 mb-6">
                <button onclick="filterResources('all')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors resource-filter active">
                    全部
                </button>
                <button onclick="filterResources('documents')" class="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors resource-filter">
                    文档
                </button>
                <button onclick="filterResources('images')" class="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors resource-filter">
                    图片
                </button>
                <button onclick="filterResources('videos')" class="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors resource-filter">
                    视频
                </button>
                <button onclick="filterResources('templates')" class="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors resource-filter">
                    模板
                </button>
            </div>
            
            <!-- 资源网格 -->
            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4" id="resourcesGrid">
                <!-- 资源项将通过JavaScript生成 -->
            </div>
        </div>
    `;
}

// 文件管理页面内容
function getFilesContent() {
    return `
        <div class="card p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold">文件管理</h3>
                <button onclick="showUploadFileModal()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    <i class="fas fa-upload mr-2"></i>上传文件
                </button>
            </div>
            
            <!-- 文件统计 -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="text-blue-600 text-sm font-medium">总文件数</div>
                    <div class="text-2xl font-bold text-blue-800" id="totalFiles">-</div>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="text-green-600 text-sm font-medium">存储使用</div>
                    <div class="text-2xl font-bold text-green-800" id="storageUsed">-</div>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <div class="text-yellow-600 text-sm font-medium">本月上传</div>
                    <div class="text-2xl font-bold text-yellow-800" id="monthlyUploads">-</div>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <div class="text-purple-600 text-sm font-medium">下载次数</div>
                    <div class="text-2xl font-bold text-purple-800" id="totalDownloads">-</div>
                </div>
            </div>
            
            <!-- 文件列表 -->
            <div class="overflow-x-auto">
                <table class="w-full table-auto">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">文件名</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">类型</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">大小</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">关联项目</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">上传时间</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                        </tr>
                    </thead>
                    <tbody id="filesTableBody">
                        <!-- 数据将通过JavaScript加载 -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 系统设置页面内容
function getSettingsContent() {
    return `
        <div class="space-y-6">
            <!-- 基本设置 -->
            <div class="card p-6">
                <h3 class="text-xl font-semibold mb-6">基本设置</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">系统名称</label>
                        <input type="text" id="systemName" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">系统版本</label>
                        <input type="text" id="systemVersion" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">联系邮箱</label>
                        <input type="email" id="contactEmail" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">客服电话</label>
                        <input type="tel" id="supportPhone" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
            </div>
            
            <!-- 安全设置 -->
            <div class="card p-6">
                <h3 class="text-xl font-semibold mb-6">安全设置</h3>
                
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-medium">双因素认证</h4>
                            <p class="text-sm text-gray-500">为管理员账户启用双因素认证</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="twoFactorAuth" class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-medium">登录日志</h4>
                            <p class="text-sm text-gray-500">记录所有管理员登录活动</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="loginLogging" class="sr-only peer" checked>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>
            
            <!-- 保存按钮 -->
            <div class="flex justify-end">
                <button onclick="saveSettings()" class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    保存设置
                </button>
            </div>
        </div>
    `;
}

// 数据加载函数
function loadDashboardData() {
    // 模拟数据加载
    console.log('加载仪表盘数据');
}

function loadUsersData() {
    // 模拟用户数据
    const users = [
        {
            id: 'user_001',
            name: '张三',
            email: 'zhangsan@example.com',
            wallet: '0x1234...5678',
            kyc_status: 'approved',
            created_at: '2024-01-15'
        },
        {
            id: 'user_002',
            name: '李四',
            email: 'lisi@example.com',
            wallet: '0x5678...9012',
            kyc_status: 'pending',
            created_at: '2024-01-16'
        }
    ];
    
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = users.map(user => `
        <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td class="px-4 py-3 text-sm">${user.id}</td>
            <td class="px-4 py-3 text-sm font-medium">${user.name}</td>
            <td class="px-4 py-3 text-sm">${user.email}</td>
            <td class="px-4 py-3 text-sm font-mono">${user.wallet}</td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 text-xs rounded-full ${
                    user.kyc_status === 'approved' ? 'bg-green-100 text-green-800' :
                    user.kyc_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }">
                    ${user.kyc_status === 'approved' ? '已通过' : user.kyc_status === 'pending' ? '待审核' : '已拒绝'}
                </span>
            </td>
            <td class="px-4 py-3 text-sm">${user.created_at}</td>
            <td class="px-4 py-3 text-sm">
                <button onclick="editUser('${user.id}')" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteUser('${user.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function loadProjectsData() {
    // 模拟项目数据
    const projects = [
        {
            id: 'proj_001',
            name: '上海商业地产项目',
            type: 'real_estate',
            asset_value: '50,000,000',
            status: '募资中',
            created_at: '2024-01-10'
        },
        {
            id: 'proj_002',
            name: '新能源基础设施',
            type: 'energy',
            asset_value: '30,000,000',
            status: '筹备中',
            created_at: '2024-01-12'
        }
    ];
    
    // 更新统计数据
    document.getElementById('totalProjects').textContent = projects.length;
    document.getElementById('activeProjects').textContent = projects.filter(p => p.status === '募资中').length;
    document.getElementById('pendingProjects').textContent = projects.filter(p => p.status === '筹备中').length;
    document.getElementById('suspendedProjects').textContent = '0';
    
    const tbody = document.getElementById('projectsTableBody');
    tbody.innerHTML = projects.map(project => `
        <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td class="px-4 py-3 text-sm">${project.id}</td>
            <td class="px-4 py-3 text-sm font-medium">${project.name}</td>
            <td class="px-4 py-3 text-sm">${project.type}</td>
            <td class="px-4 py-3 text-sm">¥${project.asset_value}</td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 text-xs rounded-full ${
                    project.status === '募资中' ? 'bg-green-100 text-green-800' :
                    project.status === '筹备中' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                }">
                    ${project.status}
                </span>
            </td>
            <td class="px-4 py-3 text-sm">${project.created_at}</td>
            <td class="px-4 py-3 text-sm">
                <button onclick="editProject('${project.id}')" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProject('${project.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function loadTenantsData() {
    // 模拟租户数据
    const tenants = [
        {
            id: 'tenant_001',
            company: '金融科技有限公司',
            contact: '王经理',
            plan: '企业版',
            expiry: '2024-12-31',
            status: 'active'
        }
    ];
    
    document.getElementById('totalTenants').textContent = tenants.length;
    document.getElementById('activeTenants').textContent = tenants.filter(t => t.status === 'active').length;
    document.getElementById('monthlyRevenue').textContent = '¥128,000';
    
    const tbody = document.getElementById('tenantsTableBody');
    tbody.innerHTML = tenants.map(tenant => `
        <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td class="px-4 py-3 text-sm">${tenant.id}</td>
            <td class="px-4 py-3 text-sm font-medium">${tenant.company}</td>
            <td class="px-4 py-3 text-sm">${tenant.contact}</td>
            <td class="px-4 py-3 text-sm">${tenant.plan}</td>
            <td class="px-4 py-3 text-sm">${tenant.expiry}</td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    活跃
                </span>
            </td>
            <td class="px-4 py-3 text-sm">
                <button onclick="editTenant('${tenant.id}')" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTenant('${tenant.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function loadFeesData() {
    // 加载手续费数据
    document.getElementById('transactionFee').value = '0.5';
    document.getElementById('withdrawalFee').value = '1.0';
    document.getElementById('platformFee').value = '2.0';
    document.getElementById('minimumFee').value = '10.00';
    
    document.getElementById('todayFeeIncome').textContent = '¥1,234';
    document.getElementById('monthlyFeeIncome').textContent = '¥45,678';
    document.getElementById('totalFeeIncome').textContent = '¥234,567';
    document.getElementById('averageFeeRate').textContent = '1.2%';
}

function loadFunctionsData() {
    // 模拟功能模块数据
    const functions = [
        { id: 'func_001', name: '用户认证', status: 'active', description: 'KYC/AML用户身份验证' },
        { id: 'func_002', name: '智能合约', status: 'active', description: '自动化合约执行' },
        { id: 'func_003', name: '风险评估', status: 'active', description: 'AI驱动的风险分析' },
        { id: 'func_004', name: '支付网关', status: 'maintenance', description: '多种支付方式集成' }
    ];
    
    const grid = document.getElementById('functionsGrid');
    grid.innerHTML = functions.map(func => `
        <div class="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-4">
                <h4 class="font-semibold">${func.name}</h4>
                <span class="px-2 py-1 text-xs rounded-full ${
                    func.status === 'active' ? 'bg-green-100 text-green-800' :
                    func.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }">
                    ${func.status === 'active' ? '运行中' : func.status === 'maintenance' ? '维护中' : '停用'}
                </span>
            </div>
            <p class="text-sm text-gray-600 mb-4">${func.description}</p>
            <div class="flex space-x-2">
                <button onclick="toggleFunction('${func.id}')" class="text-blue-600 hover:text-blue-800 text-sm">
                    ${func.status === 'active' ? '停用' : '启用'}
                </button>
                <button onclick="configureFunction('${func.id}')" class="text-gray-600 hover:text-gray-800 text-sm">
                    配置
                </button>
            </div>
        </div>
    `).join('');
}

function loadCoursesData() {
    // 模拟课程数据
    const courses = [
        {
            id: 'course_001',
            name: 'RWA基础知识',
            category: '基础课程',
            instructor: '李教授',
            students: 156,
            status: 'published'
        },
        {
            id: 'course_002',
            name: '区块链投资策略',
            category: '进阶课程',
            instructor: '张专家',
            students: 89,
            status: 'draft'
        }
    ];
    
    document.getElementById('totalCourses').textContent = courses.length;
    document.getElementById('publishedCourses').textContent = courses.filter(c => c.status === 'published').length;
    document.getElementById('draftCourses').textContent = courses.filter(c => c.status === 'draft').length;
    document.getElementById('totalStudents').textContent = courses.reduce((sum, c) => sum + c.students, 0);
    
    const tbody = document.getElementById('coursesTableBody');
    tbody.innerHTML = courses.map(course => `
        <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td class="px-4 py-3 text-sm">${course.id}</td>
            <td class="px-4 py-3 text-sm font-medium">${course.name}</td>
            <td class="px-4 py-3 text-sm">${course.category}</td>
            <td class="px-4 py-3 text-sm">${course.instructor}</td>
            <td class="px-4 py-3 text-sm">${course.students}</td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 text-xs rounded-full ${
                    course.status === 'published' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                }">
                    ${course.status === 'published' ? '已发布' : '草稿'}
                </span>
            </td>
            <td class="px-4 py-3 text-sm">
                <button onclick="editCourse('${course.id}')" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteCourse('${course.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function loadResourcesData() {
    // 模拟资源数据
    const resources = [
        { id: 'res_001', name: '项目模板.docx', type: 'document', size: '2.5MB', category: 'templates' },
        { id: 'res_002', name: '公司logo.png', type: 'image', size: '156KB', category: 'images' },
        { id: 'res_003', name: '介绍视频.mp4', type: 'video', size: '45MB', category: 'videos' },
        { id: 'res_004', name: '用户手册.pdf', type: 'document', size: '3.2MB', category: 'documents' }
    ];
    
    const grid = document.getElementById('resourcesGrid');
    grid.innerHTML = resources.map(resource => `
        <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div class="text-center">
                <i class="fas ${
                    resource.type === 'document' ? 'fa-file-alt text-blue-500' :
                    resource.type === 'image' ? 'fa-image text-green-500' :
                    resource.type === 'video' ? 'fa-video text-red-500' :
                    'fa-file text-gray-500'
                } text-3xl mb-2"></i>
                <h4 class="font-medium text-sm mb-1 truncate">${resource.name}</h4>
                <p class="text-xs text-gray-500">${resource.size}</p>
            </div>
        </div>
    `).join('');
}

function loadFilesData() {
    // 模拟文件数据
    const files = [
        {
            name: '项目计划书.pdf',
            type: 'PDF',
            size: '2.5MB',
            project: '上海商业地产',
            upload_time: '2024-01-15',
            status: 'active'
        },
        {
            name: '财务报表.xlsx',
            type: 'Excel',
            size: '1.2MB',
            project: '新能源项目',
            upload_time: '2024-01-16',
            status: 'active'
        }
    ];
    
    document.getElementById('totalFiles').textContent = files.length;
    document.getElementById('storageUsed').textContent = '3.7MB';
    document.getElementById('monthlyUploads').textContent = files.length;
    document.getElementById('totalDownloads').textContent = '45';
    
    const tbody = document.getElementById('filesTableBody');
    tbody.innerHTML = files.map(file => `
        <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td class="px-4 py-3 text-sm font-medium">${file.name}</td>
            <td class="px-4 py-3 text-sm">${file.type}</td>
            <td class="px-4 py-3 text-sm">${file.size}</td>
            <td class="px-4 py-3 text-sm">${file.project}</td>
            <td class="px-4 py-3 text-sm">${file.upload_time}</td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    正常
                </span>
            </td>
            <td class="px-4 py-3 text-sm">
                <button onclick="downloadFile('${file.name}')" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-download"></i>
                </button>
                <button onclick="deleteFile('${file.name}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function loadSettingsData() {
    // 加载系统设置
    document.getElementById('systemName').value = '元话RWA数字投行';
    document.getElementById('systemVersion').value = 'v1.0.0';
    document.getElementById('contactEmail').value = 'admin@yuanhua-rwa.com';
    document.getElementById('supportPhone').value = '+86-400-123-4567';
}

// 模态框和操作函数
function showAddUserModal() {
    alert('添加用户功能 - 待实现');
}

function showAddProjectModal() {
    alert('添加项目功能 - 待实现');
}

function showAddTenantModal() {
    alert('添加租户功能 - 待实现');
}

function showAddFunctionModal() {
    alert('添加功能功能 - 待实现');
}

function showAddCourseModal() {
    alert('添加课程功能 - 待实现');
}

function showUploadResourceModal() {
    alert('上传资源功能 - 待实现');
}

function showCreateFolderModal() {
    alert('创建文件夹功能 - 待实现');
}

function showUploadFileModal() {
    alert('上传文件功能 - 待实现');
}

function saveFeeSettings() {
    alert('手续费设置已保存');
}

function saveSettings() {
    alert('系统设置已保存');
}

// 编辑和删除操作
function editUser(id) {
    alert(`编辑用户: ${id}`);
}

function deleteUser(id) {
    if (confirm('确定要删除此用户吗？')) {
        alert(`删除用户: ${id}`);
    }
}

function editProject(id) {
    alert(`编辑项目: ${id}`);
}

function deleteProject(id) {
    if (confirm('确定要删除此项目吗？')) {
        alert(`删除项目: ${id}`);
    }
}

function editTenant(id) {
    alert(`编辑租户: ${id}`);
}

function deleteTenant(id) {
    if (confirm('确定要删除此租户吗？')) {
        alert(`删除租户: ${id}`);
    }
}

function editCourse(id) {
    alert(`编辑课程: ${id}`);
}

function deleteCourse(id) {
    if (confirm('确定要删除此课程吗？')) {
        alert(`删除课程: ${id}`);
    }
}

function toggleFunction(id) {
    alert(`切换功能状态: ${id}`);
}

function configureFunction(id) {
    alert(`配置功能: ${id}`);
}

function filterResources(category) {
    // 更新筛选按钮状态
    document.querySelectorAll('.resource-filter').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-100', 'text-blue-800');
        btn.classList.add('bg-gray-100', 'text-gray-800');
    });
    
    event.target.classList.remove('bg-gray-100', 'text-gray-800');
    event.target.classList.add('active', 'bg-blue-100', 'text-blue-800');
    
    // 这里可以添加实际的筛选逻辑
    console.log(`筛选资源类别: ${category}`);
}

function downloadFile(filename) {
    alert(`下载文件: ${filename}`);
}

function deleteFile(filename) {
    if (confirm('确定要删除此文件吗？')) {
        alert(`删除文件: ${filename}`);
    }
}

// 切换下拉菜单
function toggleDropdown(element) {
    const dropdown = element.closest('.dropdown');
    dropdown.classList.toggle('active');
    
    // 点击外部关闭下拉菜单
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

// 显示模态框
function showModal(title, content, confirmCallback) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalConfirm = document.getElementById('modal-confirm');
    
    if (modalTitle) modalTitle.textContent = title;
    if (modalBody) modalBody.innerHTML = content;
    if (modal) modal.classList.add('active');
    
    // 绑定确认按钮事件
    if (modalConfirm) {
        modalConfirm.onclick = function() {
            if (confirmCallback) {
                confirmCallback();
            }
            closeModal();
        };
    }
}

// 关闭模态框
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 显示提示消息
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 18px; cursor: pointer;">&times;</button>
    `;
    
    // 插入到页面顶部
    const container = document.querySelector('.content-area') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 3000);
}