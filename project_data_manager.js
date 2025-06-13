// RWA项目数据管理器
// 负责加载、显示和管理项目数据

class ProjectDataManager {
    constructor() {
        this.currentProject = null;
        this.projectId = null;
        this.initializeManager();
    }

    // 初始化管理器
    initializeManager() {
        console.log('项目数据管理器已初始化');
        this.extractProjectId();
        this.loadProjectData();
        this.bindEventListeners();
    }

    // 从URL参数中提取项目ID
    extractProjectId() {
        const urlParams = new URLSearchParams(window.location.search);
        this.projectId = urlParams.get('projectId');
        
        if (!this.projectId) {
            // 如果没有项目ID，尝试从本地存储获取最新项目
            const projectList = JSON.parse(localStorage.getItem('rwa_project_list') || '[]');
            if (projectList.length > 0) {
                this.projectId = projectList[projectList.length - 1].projectId;
            } else {
                this.projectId = 'demo-project-' + Date.now();
                this.createDemoProject();
            }
        }
    }

    // 加载项目数据
    async loadProjectData() {
        try {
            if (!this.projectId) {
                throw new Error('未找到项目ID');
            }

            // 从本地存储加载项目数据
            const projectDataStr = localStorage.getItem(`rwa_project_${this.projectId}`);
            if (!projectDataStr) {
                throw new Error('未找到项目数据');
            }

            this.currentProject = JSON.parse(projectDataStr);
            console.log('项目数据已加载:', this.currentProject);

            // 更新界面显示
            this.updateProjectDisplay();
            this.updateStatistics();
            this.updateTables();

        } catch (error) {
            console.error('加载项目数据失败:', error);
            this.showErrorMessage('加载项目数据失败: ' + error.message);
        }
    }

    // 更新项目基本信息显示
    updateProjectDisplay() {
        if (!this.currentProject) return;

        const project = this.currentProject;
        
        // 更新页面标题
        const titleElement = document.querySelector('.header h1');
        if (titleElement) {
            titleElement.textContent = `🏢 ${project.basicInfo.name}`;
        }

        // 更新项目信息卡片
        this.updateInfoCard('项目状态', this.getStatusDisplay(project.basicInfo.status));
        this.updateInfoCard('资产估值', `¥${this.formatNumber(project.financial.assetValue)}万元`);
        this.updateInfoCard('年化收益率', `${project.financial.annualReturn}%`);
        this.updateInfoCard('代币发行量', `${this.formatNumber(project.tokenomics.totalSupply)} ${project.tokenomics.tokenSymbol}`);
        this.updateInfoCard('NFT发行量', `${project.nft.totalSupply} NFT`);
        this.updateInfoCard('持有人数量', this.generateHolderCount() + '人');
    }

    // 更新信息卡片
    updateInfoCard(title, value) {
        const infoCards = document.querySelectorAll('.info-card');
        infoCards.forEach(card => {
            const titleElement = card.querySelector('h3');
            if (titleElement && titleElement.textContent === title) {
                const valueElement = card.querySelector('p');
                if (valueElement) {
                    valueElement.textContent = value;
                }
            }
        });
    }

    // 更新统计数据
    updateStatistics() {
        if (!this.currentProject) return;

        const project = this.currentProject;
        
        // 更新代币统计
        this.updateStatCard('代币管理', 0, project.tokenomics.totalSupply.toString());
        this.updateStatCard('代币管理', 1, Math.floor(project.tokenomics.totalSupply * 0.85).toString());
        this.updateStatCard('代币管理', 2, `¥${project.tokenomics.tokenPrice.toFixed(2)}`);

        // 更新NFT统计
        this.updateStatCard('NFT管理', 0, project.nft.totalSupply.toString());
        this.updateStatCard('NFT管理', 1, Math.floor(project.nft.totalSupply * 0.77).toString());
        this.updateStatCard('NFT管理', 2, '¥5,000');
    }

    // 更新统计卡片
    updateStatCard(section, index, value) {
        try {
            const panels = document.querySelectorAll('.panel');
            panels.forEach(panel => {
                const title = panel.querySelector('h2');
                if (title && title.textContent.includes(section.split('管理')[0])) {
                    const statCards = panel.querySelectorAll('.stat-card h3');
                    if (statCards[index]) {
                        // 添加数字动画效果
                        this.animateNumber(statCards[index], value);
                    }
                }
            });
        } catch (error) {
            console.error('更新统计卡片失败:', error);
        }
    }
    
    // 数字动画效果
    animateNumber(element, targetValue) {
        const currentValue = element.textContent.replace(/[^\d.-]/g, '') || '0';
        const current = parseFloat(currentValue);
        const target = parseFloat(targetValue.toString().replace(/[^\d.-]/g, ''));
        
        if (isNaN(current) || isNaN(target)) {
            element.textContent = targetValue;
            return;
        }
        
        const duration = 1000; // 1秒动画
        const startTime = performance.now();
        const difference = target - current;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用缓动函数
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentNumber = current + (difference * easeOutQuart);
            
            // 保持原有格式
            if (targetValue.toString().includes('¥')) {
                element.textContent = `¥${currentNumber.toFixed(2)}`;
            } else if (targetValue.toString().includes('%')) {
                element.textContent = `${currentNumber.toFixed(1)}%`;
            } else {
                element.textContent = Math.round(currentNumber).toLocaleString();
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = targetValue;
            }
        };
        
        requestAnimationFrame(animate);
    }

    // 更新表格数据
    updateTables() {
        if (!this.currentProject) {
            console.warn('没有项目数据，跳过表格更新');
            return;
        }

        // 使用 requestAnimationFrame 优化性能
        requestAnimationFrame(() => {
            try {
                this.updateTokenIssuanceTable();
                this.updateTokenHoldersTable();
            } catch (error) {
                console.error('更新代币相关表格失败:', error);
            }
        });
        
        requestAnimationFrame(() => {
            try {
                this.updateNFTCollectionsDisplay();
                this.updateNFTTransactionTable();
            } catch (error) {
                console.error('更新NFT相关表格失败:', error);
            }
        });
        
        requestAnimationFrame(() => {
            try {
                this.updateDocumentsTable();
                this.updateValuationTable();
                this.updateComplianceTable();
            } catch (error) {
                console.error('更新其他表格失败:', error);
            }
        });
    }

    // 更新代币发行记录表
    updateTokenIssuanceTable() {
        const table = document.querySelector('#token-issue .data-table tbody');
        if (!table) return;

        // 生成模拟发行记录
        const issuanceRecords = this.generateTokenIssuanceRecords();
        
        table.innerHTML = '';
        issuanceRecords.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.date}</td>
                <td>${this.formatNumber(record.amount)}</td>
                <td>¥${record.price.toFixed(2)}</td>
                <td><span class="status-badge ${record.statusClass}">${record.status}</span></td>
            `;
            table.appendChild(row);
        });
    }

    // 更新代币持有人表
    updateTokenHoldersTable() {
        const table = document.querySelector('#token-holders .data-table tbody');
        if (!table) return;

        // 生成模拟持有人数据
        const holders = this.generateTokenHolders();
        
        table.innerHTML = '';
        holders.forEach(holder => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${holder.address}</td>
                <td>${this.formatNumber(holder.amount)}</td>
                <td>${holder.percentage}%</td>
                <td><span class="status-badge ${holder.kycStatusClass}">${holder.kycStatus}</span></td>
            `;
            table.appendChild(row);
        });
    }

    // 更新NFT系列显示
    updateNFTCollectionsDisplay() {
        const container = document.querySelector('#nft-collections > div[style*="grid"]');
        if (!container || !this.currentProject.nft.collections) return;

        container.innerHTML = '';
        this.currentProject.nft.collections.forEach(collection => {
            const collectionDiv = document.createElement('div');
            collectionDiv.style.cssText = 'border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; text-align: center;';
            
            const emoji = this.getCollectionEmoji(collection.type);
            const gradient = this.getCollectionGradient(collection.type);
            const issued = Math.floor(collection.supply * 0.8);
            
            collectionDiv.innerHTML = `
                <div style="width: 100%; height: 120px; background: ${gradient}; border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">${emoji}</div>
                <h4>${collection.name}</h4>
                <p>已发行: ${issued}/${collection.supply}</p>
                <span class="status-badge ${collection.status === '待发行' ? 'status-pending' : 'status-active'}">${collection.status === '待发行' ? '销售中' : '已售罄'}</span>
            `;
            
            container.appendChild(collectionDiv);
        });
    }

    // 更新NFT交易记录表
    updateNFTTransactionTable() {
        const table = document.querySelector('#nft-marketplace .data-table tbody');
        if (!table) return;

        // 生成模拟交易记录
        const transactions = this.generateNFTTransactions();
        
        table.innerHTML = '';
        transactions.forEach(tx => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tx.nftId}</td>
                <td>${tx.type}</td>
                <td>¥${this.formatNumber(tx.price)}</td>
                <td>${tx.date}</td>
                <td><span class="status-badge ${tx.statusClass}">${tx.status}</span></td>
            `;
            table.appendChild(row);
        });
    }

    // 更新文档表
    updateDocumentsTable() {
        const table = document.querySelector('#project-documents .data-table tbody');
        if (!table) return;

        // 生成文档记录
        const documents = this.generateDocuments();
        
        table.innerHTML = '';
        documents.forEach(doc => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.name}</td>
                <td>${doc.type}</td>
                <td>${doc.uploadDate}</td>
                <td><span class="status-badge ${doc.statusClass}">${doc.status}</span></td>
                <td><button class="btn btn-info" style="padding: 4px 8px; font-size: 0.8rem;">${doc.action}</button></td>
            `;
            table.appendChild(row);
        });
    }

    // 更新估值表
    updateValuationTable() {
        const table = document.querySelector('#project-valuation .data-table tbody');
        if (!table) return;

        // 生成估值记录
        const valuations = this.generateValuations();
        
        table.innerHTML = '';
        valuations.forEach(val => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${val.date}</td>
                <td>¥${this.formatNumber(val.value)}万</td>
                <td>${val.method}</td>
                <td>${val.agency}</td>
                <td><span class="status-badge ${val.statusClass}">${val.status}</span></td>
            `;
            table.appendChild(row);
        });
    }

    // 更新合规表
    updateComplianceTable() {
        const table = document.querySelector('#compliance-kyc .data-table tbody');
        if (!table) return;

        // 生成合规记录
        const compliance = this.generateComplianceRecords();
        
        table.innerHTML = '';
        compliance.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.userId}</td>
                <td>${record.kycLevel}</td>
                <td><span class="status-badge ${record.amlStatusClass}">${record.amlStatus}</span></td>
                <td>${record.riskLevel}</td>
                <td><button class="btn btn-info" style="padding: 4px 8px; font-size: 0.8rem;">${record.action}</button></td>
            `;
            table.appendChild(row);
        });
    }

    // 生成代币发行记录
    generateTokenIssuanceRecords() {
        const records = [
            {
                date: '2024-01-15',
                amount: this.currentProject.tokenomics.totalSupply * 0.5,
                price: this.currentProject.tokenomics.tokenPrice,
                status: '已完成',
                statusClass: 'status-active'
            },
            {
                date: '2024-03-20',
                amount: this.currentProject.tokenomics.totalSupply * 0.3,
                price: this.currentProject.tokenomics.tokenPrice * 1.04,
                status: '已完成',
                statusClass: 'status-active'
            },
            {
                date: '2024-06-10',
                amount: this.currentProject.tokenomics.totalSupply * 0.2,
                price: this.currentProject.tokenomics.tokenPrice * 0.96,
                status: '进行中',
                statusClass: 'status-pending'
            }
        ];
        return records;
    }

    // 生成代币持有人数据
    generateTokenHolders() {
        const holders = [
            {
                address: '0x1234...5678',
                amount: this.currentProject.tokenomics.totalSupply * 0.05,
                percentage: '5.0',
                kycStatus: '已认证',
                kycStatusClass: 'status-active'
            },
            {
                address: '0x9876...4321',
                amount: this.currentProject.tokenomics.totalSupply * 0.03,
                percentage: '3.0',
                kycStatus: '已认证',
                kycStatusClass: 'status-active'
            },
            {
                address: '0xabcd...efgh',
                amount: this.currentProject.tokenomics.totalSupply * 0.025,
                percentage: '2.5',
                kycStatus: '待认证',
                kycStatusClass: 'status-pending'
            }
        ];
        return holders;
    }

    // 生成NFT交易记录
    generateNFTTransactions() {
        const transactions = [
            {
                nftId: '#001',
                type: '所有权凭证',
                price: 8000,
                date: '2024-06-15',
                status: '已成交',
                statusClass: 'status-active'
            },
            {
                nftId: '#125',
                type: '收益权NFT',
                price: 5500,
                date: '2024-06-14',
                status: '已成交',
                statusClass: 'status-active'
            },
            {
                nftId: '#089',
                type: '纪念版NFT',
                price: 3200,
                date: '2024-06-13',
                status: '待确认',
                statusClass: 'status-pending'
            }
        ];
        return transactions;
    }

    // 生成文档记录
    generateDocuments() {
        const documents = [
            {
                name: '资产评估报告.pdf',
                type: '评估文档',
                uploadDate: '2024-01-10',
                status: '已审核',
                statusClass: 'status-active',
                action: '下载'
            },
            {
                name: '法律意见书.pdf',
                type: '法律文档',
                uploadDate: '2024-01-15',
                status: '已审核',
                statusClass: 'status-active',
                action: '下载'
            },
            {
                name: '财务审计报告.pdf',
                type: '财务文档',
                uploadDate: '2024-03-01',
                status: '待审核',
                statusClass: 'status-pending',
                action: '审核'
            }
        ];
        return documents;
    }

    // 生成估值记录
    generateValuations() {
        const valuations = [
            {
                date: '2024-01-15',
                value: this.currentProject.financial.assetValue,
                method: '收益法',
                agency: '中诚评估',
                status: '有效',
                statusClass: 'status-active'
            },
            {
                date: '2023-07-20',
                value: this.currentProject.financial.assetValue * 0.89,
                method: '市场法',
                agency: '华信评估',
                status: '已过期',
                statusClass: 'status-inactive'
            }
        ];
        return valuations;
    }

    // 生成合规记录
    generateComplianceRecords() {
        const records = [
            {
                userId: 'USER001',
                kycLevel: '增强级',
                amlStatus: '通过',
                amlStatusClass: 'status-active',
                riskLevel: '低风险',
                action: '查看'
            },
            {
                userId: 'USER002',
                kycLevel: '标准级',
                amlStatus: '审核中',
                amlStatusClass: 'status-pending',
                riskLevel: '中风险',
                action: '审核'
            }
        ];
        return records;
    }

    // 获取系列表情符号
    getCollectionEmoji(type) {
        const emojis = {
            'ownership': '🏠',
            'revenue': '💎',
            'access': '🔑',
            'commemorative': '🎖️'
        };
        return emojis[type] || '🎨';
    }

    // 获取系列渐变色
    getCollectionGradient(type) {
        const gradients = {
            'ownership': 'linear-gradient(45deg, #667eea, #764ba2)',
            'revenue': 'linear-gradient(45deg, #28a745, #20c997)',
            'access': 'linear-gradient(45deg, #17a2b8, #138496)',
            'commemorative': 'linear-gradient(45deg, #ffc107, #fd7e14)'
        };
        return gradients[type] || 'linear-gradient(45deg, #6c757d, #495057)';
    }

    // 获取状态显示
    getStatusDisplay(status) {
        const statusMap = {
            '筹备中': '🟡 筹备中',
            '运营中': '🟢 运营中',
            '已完成': '🔵 已完成',
            '暂停': '🟠 暂停'
        };
        return statusMap[status] || status;
    }

    // 生成持有人数量
    generateHolderCount() {
        return Math.floor(Math.random() * 1000) + 500;
    }

    // 格式化数字
    formatNumber(num) {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + '万';
        }
        return num.toLocaleString();
    }

    // 绑定事件监听器
    bindEventListeners() {
        // 绑定模态框表单提交事件
        this.bindModalForms();
        
        // 绑定数据刷新事件
        this.bindRefreshEvents();
    }

    // 绑定模态框表单
    bindModalForms() {
        // 这里可以添加各种模态框表单的提交处理逻辑
        console.log('模态框表单事件已绑定');
    }

    // 绑定刷新事件
    bindRefreshEvents() {
        // 定期刷新数据
        setInterval(() => {
            this.refreshData();
        }, 60000); // 每分钟刷新一次
    }

    // 刷新数据
    refreshData() {
        console.log('刷新项目数据');
        // 这里可以添加数据刷新逻辑
    }

    // 显示错误消息
    createDemoProject() {
        const demoProjects = [
            {
                projectId: this.projectId,
                basicInfo: {
                    name: "智慧城市基础设施RWA项目",
                    status: "active",
                    description: "基于区块链技术的智慧城市基础设施资产数字化项目",
                    createdAt: new Date().toISOString(),
                    location: "上海市浦东新区",
                    category: "基础设施",
                    totalArea: "50,000平方米"
                },
                financial: {
                    assetValue: 500000000,
                    annualReturn: 8.5,
                    totalInvestment: 450000000,
                    currentValue: 520000000,
                    monthlyRevenue: 3500000,
                    operatingCosts: 1200000,
                    netIncome: 2300000,
                    roi: 12.5,
                    irr: 15.2
                },
                tokenomics: {
                    tokenSymbol: "SCIT",
                    tokenName: "Smart City Infrastructure Token",
                    totalSupply: 10000000,
                    circulatingSupply: 8500000,
                    tokenPrice: 52.0,
                    marketCap: 442000000,
                    holders: 1247,
                    tradingVolume24h: 2500000
                },
                nft: {
                    totalSupply: 500,
                    minted: 485,
                    collections: [
                        { 
                            name: "基础设施权益NFT", 
                            count: 200, 
                            floor: 5000, 
                            volume: 1200000,
                            owners: 156
                        },
                        { 
                            name: "收益分配NFT", 
                            count: 300, 
                            floor: 3000,
                            volume: 850000,
                            owners: 234
                        }
                    ]
                },
                performance: {
                    occupancyRate: 95.5,
                    averageRent: 180,
                    tenantSatisfaction: 4.7,
                    maintenanceScore: 92,
                    energyEfficiency: 88,
                    sustainabilityRating: "A+"
                },
                transactions: this.generateTransactionHistory(),
                compliance: {
                    status: "合规",
                    lastAudit: "2024-05-15",
                    nextAudit: "2024-11-15",
                    certifications: ["ISO 14001", "LEED Gold", "SOC 2"],
                    riskLevel: "低风险"
                },
                ai: {
                    predictedReturn: 9.2,
                    riskScore: 2.1,
                    marketSentiment: "积极",
                    recommendations: [
                        "建议增加可再生能源投资",
                        "优化租户组合以提高收益",
                        "考虑扩展智能化设施"
                    ]
                }
            }
        ];
        
        const selectedProject = demoProjects[0];
        localStorage.setItem(`rwa_project_${this.projectId}`, JSON.stringify(selectedProject));
        
        const projectList = JSON.parse(localStorage.getItem('rwa_project_list') || '[]');
        const existingProject = projectList.find(p => p.projectId === this.projectId);
        if (!existingProject) {
            projectList.push({ 
                projectId: this.projectId, 
                name: selectedProject.basicInfo.name,
                status: selectedProject.basicInfo.status,
                createdAt: selectedProject.basicInfo.createdAt
            });
            localStorage.setItem('rwa_project_list', JSON.stringify(projectList));
        }
        
        console.log('演示项目数据已创建:', selectedProject);
    }
    
    generateTransactionHistory() {
        const transactions = [];
        const now = new Date();
        
        for (let i = 0; i < 50; i++) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const types = ['租金收入', '维护费用', '代币交易', 'NFT销售', '管理费用'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            let amount = 0;
            let direction = '';
            
            switch(type) {
                case '租金收入':
                    amount = Math.random() * 50000 + 10000;
                    direction = 'in';
                    break;
                case '维护费用':
                case '管理费用':
                    amount = Math.random() * 20000 + 5000;
                    direction = 'out';
                    break;
                case '代币交易':
                case 'NFT销售':
                    amount = Math.random() * 100000 + 20000;
                    direction = Math.random() > 0.5 ? 'in' : 'out';
                    break;
            }
            
            transactions.push({
                id: `tx_${Date.now()}_${i}`,
                date: date.toISOString(),
                type: type,
                amount: Math.round(amount),
                direction: direction,
                description: `${type} - ${date.toLocaleDateString('zh-CN')}`,
                status: 'completed'
            });
        }
        
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    showErrorMessage(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: #dc3545;
            color: white;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    }
}

// 页面加载完成后初始化管理器
document.addEventListener('DOMContentLoaded', function() {
    new ProjectDataManager();
});

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectDataManager;
}
