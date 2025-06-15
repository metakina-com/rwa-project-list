// project_data_generator.js

class ProjectDataGenerator {
    constructor() {}

    async generateProjectData(formData) {
        const projectId = this.generateProjectId();
        return {
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
                contactEmail: formData.contactEmail,
                walletAddress: formData.walletAddress
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
    }

    generateProjectId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `RWA${timestamp}${random}`.toUpperCase();
    }

    generateTokenSymbol(projectName) {
        const words = projectName.split(/[\s\u4e00-\u9fa5]+/);
        let symbol = '';
        if (words.length > 1) {
            symbol = words.map(word => word.charAt(0)).join('').toUpperCase();
        } else {
            symbol = projectName.substr(0, 3).toUpperCase();
        }
        return symbol + 'RWA';
    }

    calculateTokenSupply(assetValue) {
        return Math.floor(assetValue / 10000) * 1000;
    }

    calculateTokenPrice(assetValue) {
        const totalSupply = this.calculateTokenSupply(assetValue);
        if (totalSupply === 0) return 0; // Avoid division by zero
        return Math.round((assetValue / totalSupply) * 100) / 100;
    }

    generateDistributionPlan() {
        return {
            publicSale: 60,
            team: 15,
            advisors: 5,
            ecosystem: 10,
            reserve: 10
        };
    }

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

    generateCollectionId() {
        return 'COL' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    calculateNFTSupply(nftTypes) {
        const collections = this.generateNFTCollections(nftTypes);
        return collections.reduce((total, collection) => total + (collection.supply || 0), 0);
    }

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

    generateRiskAssessment(formData) {
        const risks = [];
        if (formData.assetType === 'real_estate') {
            risks.push({
                type: '市场风险',
                level: '中等',
                description: '房地产市场波动可能影响资产价值',
                mitigation: '定期进行市场评估，建立价值调整机制'
            });
        }
        if (formData.assetType === 'infrastructure') {
            risks.push({
                type: '政策风险',
                level: '中等',
                description: '基础设施项目受政策影响较大',
                mitigation: '密切关注政策变化，建立应对机制'
            });
        }
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
        formData.targetJurisdictions.forEach(jurisdiction => {
            if (jurisdiction === 'hongkong') {
                checklist.push({
                    item: '香港SFC许可申请',
                    status: '待申请',
                    priority: '高',
                    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });
            }
            if (jurisdiction === 'singapore') {
                checklist.push({
                    item: '新加坡MAS合规报告',
                    status: '待提交',
                    priority: '高',
                    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });
            }
        });
        return checklist;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectDataGenerator;
}