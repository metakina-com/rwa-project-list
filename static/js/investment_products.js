/**
 * 投资产品管理模块
 * 提供产品展示、筛选、购买、创建等功能
 */

class InvestmentProductsManager {
    constructor() {
        this.apiClient = window.apiClient;
        this.authManager = window.authManager;
        this.products = [];
        this.filteredProducts = [];
        this.currentCategory = 'all';
        this.currentPage = 1;
        this.pageSize = 9;
        this.selectedProduct = null;
        this.init();
    }

    // 初始化
    async init() {
        // 检查用户登录状态
        if (!this.authManager.isLoggedIn()) {
            window.location.href = 'auth.html';
            return;
        }

        this.setupEventListeners();
        await this.loadProducts();
        this.renderProducts();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 分类筛选
        document.querySelectorAll('.filter-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterByCategory(category);
            });
        });

        // 搜索
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchProducts(e.target.value);
            });
        }

        // 排序
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortProducts(e.target.value);
            });
        }

        // 加载更多
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreProducts();
            });
        }

        // 投资表单提交
        const investForm = document.getElementById('investForm');
        if (investForm) {
            investForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleInvestment();
            });
        }

        // 创建产品表单提交
        const createProductForm = document.getElementById('createProductForm');
        if (createProductForm) {
            createProductForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateProduct();
            });
        }

        // 退出登录
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    // 加载产品数据
    async loadProducts() {
        try {
            // 模拟产品数据
            this.products = [
                {
                    id: '1',
                    name: 'RWA豪华住宅投资基金',
                    category: 'real-estate',
                    description: '投资于一线城市核心地段的豪华住宅项目，具有稳定的租金收益和良好的升值潜力。',
                    targetAmount: 5000000,
                    currentAmount: 3200000,
                    expectedReturn: 8.5,
                    minInvestment: 50000,
                    period: 24,
                    riskLevel: 'medium',
                    status: 'active',
                    createdAt: new Date('2024-01-15').toISOString(),
                    images: ['https://via.placeholder.com/400x300?text=豪华住宅'],
                    details: {
                        location: '上海市浦东新区',
                        propertyType: '高端住宅',
                        totalUnits: 120,
                        expectedOccupancy: '95%',
                        managementFee: '1.5%'
                    }
                },
                {
                    id: '2',
                    name: '当代艺术品投资组合',
                    category: 'art',
                    description: '精选当代知名艺术家作品，通过专业团队管理，为投资者提供艺术品投资机会。',
                    targetAmount: 2000000,
                    currentAmount: 1500000,
                    expectedReturn: 12.0,
                    minInvestment: 30000,
                    period: 36,
                    riskLevel: 'high',
                    status: 'active',
                    createdAt: new Date('2024-01-20').toISOString(),
                    images: ['https://via.placeholder.com/400x300?text=艺术品'],
                    details: {
                        artists: '10位知名艺术家',
                        artworks: '25件精选作品',
                        insurance: '全额保险',
                        storage: '专业艺术品仓储',
                        authentication: '权威机构认证'
                    }
                },
                {
                    id: '3',
                    name: '黄金储备投资基金',
                    category: 'commodity',
                    description: '投资于实物黄金储备，通过专业的贵金属管理团队，为投资者提供稳健的保值增值机会。',
                    targetAmount: 10000000,
                    currentAmount: 7500000,
                    expectedReturn: 6.8,
                    minInvestment: 20000,
                    period: 12,
                    riskLevel: 'low',
                    status: 'active',
                    createdAt: new Date('2024-01-25').toISOString(),
                    images: ['https://via.placeholder.com/400x300?text=黄金储备'],
                    details: {
                        goldType: '999纯金',
                        storage: '银行金库',
                        insurance: '全额保险',
                        liquidity: '随时赎回',
                        custody: '第三方托管'
                    }
                },
                {
                    id: '4',
                    name: '新能源基础设施基金',
                    category: 'infrastructure',
                    description: '投资于太阳能、风能等新能源基础设施项目，享受政策支持和长期稳定收益。',
                    targetAmount: 15000000,
                    currentAmount: 8000000,
                    expectedReturn: 9.2,
                    minInvestment: 100000,
                    period: 60,
                    riskLevel: 'medium',
                    status: 'active',
                    createdAt: new Date('2024-02-01').toISOString(),
                    images: ['https://via.placeholder.com/400x300?text=新能源'],
                    details: {
                        projectType: '太阳能发电站',
                        capacity: '100MW',
                        location: '内蒙古',
                        powerPurchase: '20年购电协议',
                        government: '政府政策支持'
                    }
                },
                {
                    id: '5',
                    name: '商业地产REIT基金',
                    category: 'real-estate',
                    description: '投资于核心商圈的优质商业地产，包括购物中心、写字楼等，享受稳定租金收益。',
                    targetAmount: 8000000,
                    currentAmount: 6400000,
                    expectedReturn: 7.5,
                    minInvestment: 25000,
                    period: 36,
                    riskLevel: 'medium',
                    status: 'active',
                    createdAt: new Date('2024-02-05').toISOString(),
                    images: ['https://via.placeholder.com/400x300?text=商业地产'],
                    details: {
                        propertyType: '购物中心+写字楼',
                        location: '北京CBD',
                        occupancyRate: '92%',
                        tenants: '知名品牌租户',
                        lease: '长期租约'
                    }
                },
                {
                    id: '6',
                    name: '稀有金属投资组合',
                    category: 'commodity',
                    description: '投资于锂、钴、稀土等战略性稀有金属，把握新能源产业发展机遇。',
                    targetAmount: 3000000,
                    currentAmount: 1800000,
                    expectedReturn: 15.0,
                    minInvestment: 50000,
                    period: 18,
                    riskLevel: 'high',
                    status: 'active',
                    createdAt: new Date('2024-02-10').toISOString(),
                    images: ['https://via.placeholder.com/400x300?text=稀有金属'],
                    details: {
                        metals: '锂、钴、稀土',
                        storage: '专业仓储',
                        market: '全球市场',
                        demand: '新能源需求驱动',
                        supply: '供应稀缺性'
                    }
                }
            ];

            this.filteredProducts = [...this.products];
        } catch (error) {
            console.error('加载产品数据失败:', error);
            this.showNotification('加载产品数据失败', 'error');
        }
    }

    // 按分类筛选
    filterByCategory(category) {
        this.currentCategory = category;
        
        // 更新按钮状态
        document.querySelectorAll('.filter-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // 筛选产品
        if (category === 'all') {
            this.filteredProducts = [...this.products];
        } else {
            this.filteredProducts = this.products.filter(product => product.category === category);
        }

        this.currentPage = 1;
        this.renderProducts();
    }

    // 搜索产品
    searchProducts(query) {
        if (!query.trim()) {
            this.filterByCategory(this.currentCategory);
            return;
        }

        const searchTerm = query.toLowerCase();
        this.filteredProducts = this.products.filter(product => {
            return product.name.toLowerCase().includes(searchTerm) ||
                   product.description.toLowerCase().includes(searchTerm);
        });

        this.currentPage = 1;
        this.renderProducts();
    }

    // 排序产品
    sortProducts(sortBy) {
        switch (sortBy) {
            case 'newest':
                this.filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'return-high':
                this.filteredProducts.sort((a, b) => b.expectedReturn - a.expectedReturn);
                break;
            case 'return-low':
                this.filteredProducts.sort((a, b) => a.expectedReturn - b.expectedReturn);
                break;
            case 'amount-high':
                this.filteredProducts.sort((a, b) => b.targetAmount - a.targetAmount);
                break;
            case 'amount-low':
                this.filteredProducts.sort((a, b) => a.targetAmount - b.targetAmount);
                break;
        }
        this.renderProducts();
    }

    // 渲染产品列表
    renderProducts() {
        const container = document.getElementById('productsList');
        if (!container) return;

        const startIndex = 0;
        const endIndex = this.currentPage * this.pageSize;
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

        if (productsToShow.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-gray-400 text-6xl mb-4">📦</div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">暂无产品</h3>
                    <p class="text-gray-500">当前筛选条件下没有找到相关产品</p>
                </div>
            `;
            return;
        }

        container.innerHTML = productsToShow.map(product => this.createProductCard(product)).join('');

        // 更新加载更多按钮
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            if (endIndex >= this.filteredProducts.length) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
        }
    }

    // 创建产品卡片
    createProductCard(product) {
        const progress = (product.currentAmount / product.targetAmount) * 100;
        const categoryName = this.getCategoryName(product.category);
        const riskLevelName = this.getRiskLevelName(product.riskLevel);
        const riskColor = this.getRiskColor(product.riskLevel);

        return `
            <div class="product-card bg-white rounded-xl p-6 cursor-pointer" onclick="productManager.showProductDetail('${product.id}')">
                <div class="mb-4">
                    <img src="${product.images[0]}" alt="${product.name}" class="w-full h-48 object-cover rounded-lg">
                </div>
                
                <div class="mb-3">
                    <div class="flex items-center justify-between mb-2">
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">${categoryName}</span>
                        <span class="px-2 py-1 ${riskColor} text-xs rounded-full">${riskLevelName}</span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">${product.name}</h3>
                    <p class="text-gray-600 text-sm line-clamp-2">${product.description}</p>
                </div>

                <div class="mb-4">
                    <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>募集进度</span>
                        <span>${progress.toFixed(1)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="progress-bar h-2 rounded-full" style="width: ${progress}%"></div>
                    </div>
                    <div class="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span>¥${this.formatNumber(product.currentAmount)}</span>
                        <span>¥${this.formatNumber(product.targetAmount)}</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                        <div class="text-gray-500">预期收益</div>
                        <div class="font-semibold text-green-600">${product.expectedReturn}%</div>
                    </div>
                    <div>
                        <div class="text-gray-500">投资期限</div>
                        <div class="font-semibold">${product.period}个月</div>
                    </div>
                    <div>
                        <div class="text-gray-500">最低投资</div>
                        <div class="font-semibold">¥${this.formatNumber(product.minInvestment)}</div>
                    </div>
                    <div>
                        <div class="text-gray-500">发布时间</div>
                        <div class="font-semibold">${this.formatDate(product.createdAt)}</div>
                    </div>
                </div>

                <button class="btn-primary w-full py-2 rounded-lg text-white font-medium" onclick="event.stopPropagation(); productManager.showProductDetail('${product.id}')">
                    立即投资
                </button>
            </div>
        `;
    }

    // 显示产品详情
    showProductDetail(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        this.selectedProduct = product;
        const modal = document.getElementById('productModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');

        modalTitle.textContent = product.name;
        modalContent.innerHTML = this.createProductDetailContent(product);

        // 重置投资表单
        document.getElementById('investForm').reset();
        document.getElementById('investAmount').min = product.minInvestment;
        document.getElementById('investAmount').placeholder = `最低投资额: ¥${this.formatNumber(product.minInvestment)}`;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    // 创建产品详情内容
    createProductDetailContent(product) {
        const progress = (product.currentAmount / product.targetAmount) * 100;
        const categoryName = this.getCategoryName(product.category);
        const riskLevelName = this.getRiskLevelName(product.riskLevel);
        const riskColor = this.getRiskColor(product.riskLevel);

        return `
            <div class="space-y-6">
                <!-- 产品图片 -->
                <div>
                    <img src="${product.images[0]}" alt="${product.name}" class="w-full h-64 object-cover rounded-lg">
                </div>

                <!-- 基本信息 -->
                <div>
                    <div class="flex items-center space-x-2 mb-3">
                        <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">${categoryName}</span>
                        <span class="px-3 py-1 ${riskColor} text-sm rounded-full">${riskLevelName}</span>
                    </div>
                    <p class="text-gray-600 leading-relaxed">${product.description}</p>
                </div>

                <!-- 募集进度 -->
                <div>
                    <h4 class="text-lg font-semibold mb-3">募集进度</h4>
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>当前进度</span>
                            <span>${progress.toFixed(1)}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-3 mb-3">
                            <div class="progress-bar h-3 rounded-full" style="width: ${progress}%"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div class="text-gray-500">已募集金额</div>
                                <div class="font-semibold text-lg">¥${this.formatNumber(product.currentAmount)}</div>
                            </div>
                            <div>
                                <div class="text-gray-500">目标金额</div>
                                <div class="font-semibold text-lg">¥${this.formatNumber(product.targetAmount)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 投资信息 -->
                <div>
                    <h4 class="text-lg font-semibold mb-3">投资信息</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="bg-gray-50 rounded-lg p-3 text-center">
                            <div class="text-gray-500 text-sm">预期收益率</div>
                            <div class="font-semibold text-lg text-green-600">${product.expectedReturn}%</div>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-3 text-center">
                            <div class="text-gray-500 text-sm">投资期限</div>
                            <div class="font-semibold text-lg">${product.period}个月</div>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-3 text-center">
                            <div class="text-gray-500 text-sm">最低投资</div>
                            <div class="font-semibold text-lg">¥${this.formatNumber(product.minInvestment)}</div>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-3 text-center">
                            <div class="text-gray-500 text-sm">风险等级</div>
                            <div class="font-semibold text-lg">${riskLevelName}</div>
                        </div>
                    </div>
                </div>

                <!-- 详细信息 -->
                <div>
                    <h4 class="text-lg font-semibold mb-3">详细信息</h4>
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${Object.entries(product.details).map(([key, value]) => `
                                <div class="flex justify-between">
                                    <span class="text-gray-600">${this.getDetailLabel(key)}:</span>
                                    <span class="font-medium">${value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 隐藏产品详情模态框
    hideProductModal() {
        const modal = document.getElementById('productModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        this.selectedProduct = null;
    }

    // 处理投资
    async handleInvestment() {
        if (!this.selectedProduct) return;

        const amount = parseFloat(document.getElementById('investAmount').value);
        const period = document.getElementById('investPeriod').value;
        const agreeRisk = document.getElementById('agreeRisk').checked;

        if (!amount || amount < this.selectedProduct.minInvestment) {
            this.showNotification(`投资金额不能少于¥${this.formatNumber(this.selectedProduct.minInvestment)}`, 'error');
            return;
        }

        if (!period) {
            this.showNotification('请选择投资期限', 'error');
            return;
        }

        if (!agreeRisk) {
            this.showNotification('请确认已了解投资风险', 'error');
            return;
        }

        try {
            this.showLoading(true);

            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 模拟投资成功
            this.showNotification(`成功投资¥${this.formatNumber(amount)}到${this.selectedProduct.name}`, 'success');
            this.hideProductModal();

            // 更新产品数据
            this.selectedProduct.currentAmount += amount;
            this.renderProducts();

        } catch (error) {
            console.error('投资失败:', error);
            this.showNotification('投资失败，请稍后重试', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // 显示创建产品模态框
    showCreateProductModal() {
        const modal = document.getElementById('createProductModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    // 隐藏创建产品模态框
    hideCreateProductModal() {
        const modal = document.getElementById('createProductModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.getElementById('createProductForm').reset();
    }

    // 处理创建产品
    async handleCreateProduct() {
        const formData = new FormData(document.getElementById('createProductForm'));
        const productData = {
            name: formData.get('productName') || document.getElementById('productName').value,
            category: formData.get('productCategory') || document.getElementById('productCategory').value,
            description: formData.get('productDescription') || document.getElementById('productDescription').value,
            targetAmount: parseFloat(document.getElementById('targetAmount').value),
            expectedReturn: parseFloat(document.getElementById('expectedReturn').value),
            minInvestment: parseFloat(document.getElementById('minInvestment').value),
            period: parseInt(document.getElementById('investmentPeriod').value),
            riskLevel: document.getElementById('riskLevel').value
        };

        // 验证表单数据
        if (!this.validateProductData(productData)) {
            return;
        }

        try {
            this.showLoading(true);

            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 创建新产品
            const newProduct = {
                id: Date.now().toString(),
                ...productData,
                currentAmount: 0,
                status: 'active',
                createdAt: new Date().toISOString(),
                images: [`https://via.placeholder.com/400x300?text=${encodeURIComponent(productData.name)}`],
                details: {
                    '创建时间': new Date().toLocaleDateString('zh-CN'),
                    '产品状态': '募集中',
                    '管理费用': '1.5%',
                    '托管银行': '中国银行',
                    '监管机构': '证监会'
                }
            };

            this.products.unshift(newProduct);
            this.filteredProducts = [...this.products];
            this.renderProducts();

            this.showNotification('产品创建成功', 'success');
            this.hideCreateProductModal();

        } catch (error) {
            console.error('创建产品失败:', error);
            this.showNotification('创建产品失败，请稍后重试', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // 验证产品数据
    validateProductData(data) {
        if (!data.name) {
            this.showNotification('请输入产品名称', 'error');
            return false;
        }
        if (!data.category) {
            this.showNotification('请选择产品类型', 'error');
            return false;
        }
        if (!data.description) {
            this.showNotification('请输入产品描述', 'error');
            return false;
        }
        if (!data.targetAmount || data.targetAmount < 10000) {
            this.showNotification('目标金额不能少于¥10,000', 'error');
            return false;
        }
        if (!data.expectedReturn || data.expectedReturn <= 0) {
            this.showNotification('请输入有效的预期收益率', 'error');
            return false;
        }
        if (!data.minInvestment || data.minInvestment < 1000) {
            this.showNotification('最低投资额不能少于¥1,000', 'error');
            return false;
        }
        if (!data.period || data.period < 1) {
            this.showNotification('请输入有效的投资期限', 'error');
            return false;
        }
        if (!data.riskLevel) {
            this.showNotification('请选择风险等级', 'error');
            return false;
        }
        return true;
    }

    // 加载更多产品
    loadMoreProducts() {
        this.currentPage++;
        this.renderProducts();
    }

    // 导出产品数据
    exportProducts() {
        const csvContent = this.generateCSV(this.filteredProducts);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `投资产品_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showNotification('产品数据导出成功', 'success');
    }

    // 生成CSV内容
    generateCSV(products) {
        const headers = ['产品名称', '类型', '目标金额', '已募集金额', '预期收益率', '最低投资额', '投资期限', '风险等级', '状态', '创建时间'];
        const rows = products.map(product => [
            product.name,
            this.getCategoryName(product.category),
            product.targetAmount,
            product.currentAmount,
            `${product.expectedReturn}%`,
            product.minInvestment,
            `${product.period}个月`,
            this.getRiskLevelName(product.riskLevel),
            product.status === 'active' ? '募集中' : '已结束',
            new Date(product.createdAt).toLocaleDateString('zh-CN')
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // 处理退出登录
    handleLogout() {
        if (confirm('确定要退出登录吗？')) {
            this.authManager.logout();
            window.location.href = 'index.html';
        }
    }

    // 工具方法
    getCategoryName(category) {
        const categoryMap = {
            'real-estate': '房地产',
            'art': '艺术品',
            'commodity': '大宗商品',
            'infrastructure': '基础设施'
        };
        return categoryMap[category] || category;
    }

    getRiskLevelName(level) {
        const levelMap = {
            'low': '低风险',
            'medium': '中等风险',
            'high': '高风险'
        };
        return levelMap[level] || level;
    }

    getRiskColor(level) {
        const colorMap = {
            'low': 'bg-green-100 text-green-800',
            'medium': 'bg-yellow-100 text-yellow-800',
            'high': 'bg-red-100 text-red-800'
        };
        return colorMap[level] || 'bg-gray-100 text-gray-800';
    }

    getDetailLabel(key) {
        const labelMap = {
            'location': '位置',
            'propertyType': '物业类型',
            'totalUnits': '总单位数',
            'expectedOccupancy': '预期入住率',
            'managementFee': '管理费',
            'artists': '艺术家',
            'artworks': '作品数量',
            'insurance': '保险',
            'storage': '存储',
            'authentication': '认证',
            'goldType': '黄金类型',
            'liquidity': '流动性',
            'custody': '托管',
            'projectType': '项目类型',
            'capacity': '装机容量',
            'powerPurchase': '购电协议',
            'government': '政府支持',
            'occupancyRate': '入住率',
            'tenants': '租户',
            'lease': '租约',
            'metals': '金属种类',
            'market': '市场',
            'demand': '需求',
            'supply': '供应',
            '创建时间': '创建时间',
            '产品状态': '产品状态',
            '管理费用': '管理费用',
            '托管银行': '托管银行',
            '监管机构': '监管机构'
        };
        return labelMap[key] || key;
    }

    formatNumber(num) {
        return new Intl.NumberFormat('zh-CN').format(num);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('zh-CN');
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        
        const bgColor = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'warning': 'bg-yellow-500',
            'info': 'bg-blue-500'
        }[type] || 'bg-blue-500';

        notification.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg mb-2 max-w-sm transition-all duration-300`;
        notification.textContent = message;

        container.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }
}

// 全局变量
let productManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    productManager = new InvestmentProductsManager();
});

// 全局函数
function showCreateProductModal() {
    productManager.showCreateProductModal();
}

function hideCreateProductModal() {
    productManager.hideCreateProductModal();
}

function hideProductModal() {
    productManager.hideProductModal();
}

function exportProducts() {
    productManager.exportProducts();
}