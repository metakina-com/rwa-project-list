// RWA项目表单处理器
// 处理客户表单提交，生成项目数据，并跳转到资产管理界面

class RWAFormProcessor {
    constructor() {
        this.projectData = {};
        this.initializeProcessor();
    }

    // 初始化处理器
    initializeProcessor() {
        console.log('RWA表单处理器已初始化');
        this.bindFormSubmission();
    }

    // 绑定表单提交事件
    bindFormSubmission() {
        const form = document.getElementById('rwaSetupForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processFormSubmission();
            });
        }
    }

    // 处理表单提交
    async processFormSubmission() {
        try {
            // 显示处理中状态
            this.showProcessingStatus();
            
            // 收集表单数据
            const formData = this.collectFormData();
            
            // 验证表单数据
            if (window.validateCurrentStep && !window.validateCurrentStep()) {
                throw new Error('表单数据验证失败');
            }
            
            if (!this.validateFormData(formData)) {
                throw new Error('表单数据验证失败');
            }
            
            // 生成项目数据
            const projectData = await this.generateProjectData(formData);
            
            // 保存项目数据
            await this.saveProjectData(projectData);
            
            // 显示成功消息
            this.showSuccessMessage();
            
            // 延迟跳转到资产管理界面
            setTimeout(() => {
                this.redirectToAssetManagement(projectData.projectId);
            }, 2000);
            
        } catch (error) {
            console.error('表单处理失败:', error);
            this.showErrorMessage(error.message);
        }
    }

    // 收集表单数据
    collectFormData() {
        const formData = {
            // 基本信息
            projectName: document.getElementById('projectName')?.value || '',
            assetType: document.getElementById('assetType')?.value || '',
            projectType: document.getElementById('projectType')?.value || '',
            assetLocation: document.getElementById('projectLocation')?.value || '',
            projectDescription: document.getElementById('projectDescription')?.value || '',
            
            // 发起方信息
            initiatorType: document.getElementById('sponsorType')?.value || '',
            companyName: document.getElementById('sponsorName')?.value || '',
            contactPerson: document.getElementById('contactPerson')?.value || '',
            contactPhone: document.getElementById('phone')?.value || '',
            contactEmail: document.getElementById('email')?.value || '',
            
            // 财务规划
            assetValue: parseFloat(document.getElementById('assetValue')?.value) || 0,
            annualRevenue: parseFloat(document.getElementById('annualRevenue')?.value) || 0,
            annualProfit: parseFloat(document.getElementById('annualProfit')?.value) || 0,
            annualReturn: parseFloat(document.getElementById('annualReturn')?.value) || 0,
            operationPeriod: document.getElementById('operationPeriod')?.value || '',
            
            // 代币权利设计
            tokenRights: this.getCheckedValues('tokenRights'),
            nftTypes: this.getCheckedValues('nftTypes'),
            
            // 合规要求
            targetJurisdictions: this.getCheckedValues('targetJurisdictions'),
            kycLevel: document.getElementById('kycLevel')?.value || '',
            amlLevel: document.getElementById('amlLevel')?.value || '',
            
            // 其他需求
            additionalRequirements: document.getElementById('additionalRequirements')?.value || '',
            
            // 提交时间
            submissionTime: new Date().toISOString()
        };
        
        return formData;
    }

    // 获取复选框选中的值
    getCheckedValues(name) {
        const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
        return Array.from(checkboxes).map(cb => cb.value);
    }

    // 验证表单数据
    validateFormData(formData) {
        const requiredFields = [
            'projectName', 'assetType', 'projectType', 'assetLocation',
            'initiatorType', 'companyName', 'contactPerson', 'contactPhone',
            'contactEmail', 'assetValue', 'operationPeriod'
        ];
        
        for (const field of requiredFields) {
            if (!formData[field] || formData[field] === '') {
                throw new Error(`必填字段 ${field} 不能为空`);
            }
        }
        
        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.contactEmail)) {
            throw new Error('邮箱格式不正确');
        }
        
        // 验证手机号格式
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(formData.contactPhone)) {
            throw new Error('手机号格式不正确');
        }
        
        // 验证资产价值
        if (formData.assetValue <= 0) {
            throw new Error('资产评估价值必须大于0');
        }
        
        return true;
    }

    // 生成项目数据
    async generateProjectData(formData) {
        // 生成唯一项目ID
        const projectId = this.generateProjectId();
        
        // AI自动生成项目数据
        const projectData = {
            projectId: projectId,
            basicInfo: {
                name: formData.projectName,
                type: formData.projectType,
                assetType: formData.assetType,
                location: formData.assetLocation,
                description: formData.projectDescription,
                status: '筹备中',
                createdAt: new Date().toISOString()
            },
            
            initiator: {
                type: formData.initiatorType,
                companyName: formData.companyName,
                contactPerson: formData.contactPerson,
                contactPhone: formData.contactPhone,
                contactEmail: formData.contactEmail
            },
            
            financial: {
                assetValue: formData.assetValue,
                annualRevenue: formData.annualRevenue,
                annualProfit: formData.annualProfit,
                annualReturn: formData.annualReturn,
                operationPeriod: formData.operationPeriod,
                currency: 'CNY'
            },
            
            tokenomics: {
                tokenSymbol: this.generateTokenSymbol(formData.projectName),
                totalSupply: this.calculateTokenSupply(formData.assetValue),
                tokenPrice: this.calculateTokenPrice(formData.assetValue),
                rights: formData.tokenRights,
                distributionPlan: this.generateDistributionPlan()
            },
            
            nft: {
                collections: this.generateNFTCollections(formData.nftTypes),
                totalSupply: this.calculateNFTSupply(formData.nftTypes),
                mintingSchedule: this.generateMintingSchedule()
            },
            
            compliance: {
                targetJurisdictions: formData.targetJurisdictions,
                kycLevel: formData.kycLevel,
                amlLevel: formData.amlLevel,
                regulatoryStatus: '待申请'
            },
            
            management: {
                phase: '项目初始化',
                milestones: this.generateMilestones(),
                riskAssessment: this.generateRiskAssessment(formData),
                complianceChecklist: this.generateComplianceChecklist(formData)
            },
            
            additionalRequirements: formData.additionalRequirements
        };
        
        return projectData;
    }

    // 生成项目ID
    generateProjectId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `RWA${timestamp}${random}`.toUpperCase();
    }

    // 生成代币符号
    generateTokenSymbol(projectName) {
        // 提取项目名称的首字母或关键词
        const words = projectName.split(/[\s\u4e00-\u9fa5]+/);
        let symbol = '';
        
        if (words.length > 1) {
            symbol = words.map(word => word.charAt(0)).join('').toUpperCase();
        } else {
            symbol = projectName.substr(0, 3).toUpperCase();
        }
        
        return symbol + 'RWA';
    }

    // 计算代币发行量
    calculateTokenSupply(assetValue) {
        // 基于资产价值计算代币发行量
        // 假设每万元资产对应1000个代币
        return Math.floor(assetValue / 10000) * 1000;
    }

    // 计算代币价格
    calculateTokenPrice(assetValue) {
        const totalSupply = this.calculateTokenSupply(assetValue);
        return Math.round((assetValue / totalSupply) * 100) / 100;
    }

    // 生成代币分配方案
    generateDistributionPlan() {
        return {
            publicSale: 60,      // 公开销售 60%
            team: 15,            // 团队 15%
            advisors: 5,         // 顾问 5%
            ecosystem: 10,       // 生态建设 10%
            reserve: 10          // 储备金 10%
        };
    }

    // 生成NFT系列
    generateNFTCollections(nftTypes) {
        const collections = [];
        
        nftTypes.forEach(type => {
            let collection = {
                id: this.generateCollectionId(),
                type: type,
                status: '待发行'
            };
            
            switch(type) {
                case 'ownership':
                    collection.name = '所有权凭证NFT';
                    collection.supply = 100;
                    collection.price = 8000;
                    collection.description = '代表资产所有权的数字凭证';
                    break;
                case 'revenue':
                    collection.name = '收益权NFT';
                    collection.supply = 300;
                    collection.price = 5000;
                    collection.description = '享受资产收益分配权的数字凭证';
                    break;
                case 'access':
                    collection.name = '使用权NFT';
                    collection.supply = 200;
                    collection.price = 3000;
                    collection.description = '享受资产使用权的数字凭证';
                    break;
                case 'commemorative':
                    collection.name = '纪念版NFT';
                    collection.supply = 100;
                    collection.price = 2000;
                    collection.description = '项目纪念版数字收藏品';
                    break;
            }
            
            collections.push(collection);
        });
        
        return collections;
    }

    // 生成系列ID
    generateCollectionId() {
        return 'COL' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    // 计算NFT总发行量
    calculateNFTSupply(nftTypes) {
        const collections = this.generateNFTCollections(nftTypes);
        return collections.reduce((total, collection) => total + collection.supply, 0);
    }

    // 生成铸造计划
    generateMintingSchedule() {
        const now = new Date();
        return {
            phase1: {
                startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                description: '第一阶段铸造'
            },
            phase2: {
                startDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString(),
                description: '第二阶段铸造'
            }
        };
    }

    // 生成项目里程碑
    generateMilestones() {
        const now = new Date();
        return [
            {
                id: 1,
                name: '项目立项',
                description: '完成项目基本信息设置和初始化',
                targetDate: now.toISOString(),
                status: '已完成'
            },
            {
                id: 2,
                name: '法律合规审查',
                description: '完成法律文件准备和合规性审查',
                targetDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                status: '进行中'
            },
            {
                id: 3,
                name: '资产评估',
                description: '完成专业机构资产评估',
                targetDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: '待开始'
            },
            {
                id: 4,
                name: '代币发行',
                description: '完成代币智能合约部署和发行',
                targetDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
                status: '待开始'
            },
            {
                id: 5,
                name: 'NFT铸造',
                description: '完成NFT系列创建和铸造',
                targetDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                status: '待开始'
            },
            {
                id: 6,
                name: '正式运营',
                description: '项目正式上线运营',
                targetDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                status: '待开始'
            }
        ];
    }

    // 生成风险评估
    generateRiskAssessment(formData) {
        const risks = [];
        
        // 基于资产类型评估风险
        switch(formData.assetType) {
            case 'real_estate':
                risks.push({
                    type: '市场风险',
                    level: '中等',
                    description: '房地产市场波动可能影响资产价值',
                    mitigation: '定期进行市场评估，建立价值调整机制'
                });
                break;
            case 'infrastructure':
                risks.push({
                    type: '政策风险',
                    level: '中等',
                    description: '基础设施项目受政策影响较大',
                    mitigation: '密切关注政策变化，建立应对机制'
                });
                break;
        }
        
        // 基于收益率评估风险
        if (formData.annualReturn > 10) {
            risks.push({
                type: '收益风险',
                level: '高',
                description: '高收益率可能伴随高风险',
                mitigation: '建立风险准备金，完善风险控制机制'
            });
        }
        
        return risks;
    }

    // 生成合规检查清单
    generateComplianceChecklist(formData) {
        const checklist = [
            {
                item: '资产所有权证明',
                status: '待提交',
                priority: '高',
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                item: '法律意见书',
                status: '待提交',
                priority: '高',
                deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                item: '财务审计报告',
                status: '待提交',
                priority: '中',
                deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        // 基于目标司法管辖区添加特定要求
        formData.targetJurisdictions.forEach(jurisdiction => {
            switch(jurisdiction) {
                case 'hongkong':
                    checklist.push({
                        item: '香港SFC许可申请',
                        status: '待申请',
                        priority: '高',
                        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    });
                    break;
                case 'singapore':
                    checklist.push({
                        item: '新加坡MAS合规报告',
                        status: '待提交',
                        priority: '高',
                        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    });
                    break;
            }
        });
        
        return checklist;
    }

    // 保存项目数据
    async saveProjectData(projectData) {
        try {
            // 保存到本地存储
            localStorage.setItem(`rwa_project_${projectData.projectId}`, JSON.stringify(projectData));
            
            // 更新项目列表
            const projectList = JSON.parse(localStorage.getItem('rwa_project_list') || '[]');
            projectList.push({
                projectId: projectData.projectId,
                name: projectData.basicInfo.name,
                status: projectData.basicInfo.status,
                createdAt: projectData.basicInfo.createdAt
            });
            localStorage.setItem('rwa_project_list', JSON.stringify(projectList));
            
            console.log('项目数据已保存:', projectData.projectId);
            
        } catch (error) {
            console.error('保存项目数据失败:', error);
            throw new Error('保存项目数据失败');
        }
    }

    // 显示处理中状态
    showProcessingStatus() {
        const overlay = document.createElement('div');
        overlay.id = 'processingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
            font-size: 1.2rem;
        `;
        
        overlay.innerHTML = `
            <div style="text-align: center;">
                <div style="width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <div>正在处理您的RWA项目申请...</div>
                <div style="font-size: 0.9rem; margin-top: 10px; opacity: 0.8;">AI正在自动生成项目数据</div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(overlay);
    }

    // 显示成功消息
    showSuccessMessage() {
        const overlay = document.getElementById('processingOverlay');
        if (overlay) {
            overlay.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 3rem; color: #28a745; margin-bottom: 20px;">✅</div>
                    <div style="font-size: 1.5rem; margin-bottom: 10px;">项目创建成功！</div>
                    <div style="font-size: 1rem; opacity: 0.8;">即将跳转到资产管理界面...</div>
                </div>
            `;
        }
    }

    // 显示错误消息
    showErrorMessage(message) {
        const overlay = document.getElementById('processingOverlay');
        if (overlay) {
            overlay.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 3rem; color: #dc3545; margin-bottom: 20px;">❌</div>
                    <div style="font-size: 1.5rem; margin-bottom: 10px;">处理失败</div>
                    <div style="font-size: 1rem; opacity: 0.8;">${message}</div>
                    <button onclick="document.getElementById('processingOverlay').remove()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">确定</button>
                </div>
            `;
        }
    }

    // 跳转到资产管理界面
    redirectToAssetManagement(projectId) {
        // 移除处理覆盖层
        const overlay = document.getElementById('processingOverlay');
        if (overlay) {
            overlay.remove();
        }
        
        // 跳转到资产管理界面，并传递项目ID
        window.location.href = `asset_management.html?projectId=${projectId}`;
    }
}

// 页面加载完成后初始化处理器
document.addEventListener('DOMContentLoaded', function() {
    new RWAFormProcessor();
});

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RWAFormProcessor;
}