/**
 * RWA AI Risk Assessment Engine
 * 智能风险评估引擎
 * 
 * 功能：
 * - 实时风险评估
 * - 市场分析
 * - 合规检查
 * - 流动性分析
 * - 预测建模
 */

class RWAICRiskEngine {
    constructor(config = {}) {
        this.config = {
            apiEndpoint: config.apiEndpoint || '/api/ai-risk',
            enableRealTime: config.enableRealTime || true,
            riskThresholds: {
                low: 30,
                medium: 60,
                high: 80
            },
            ...config
        };
        
        this.riskFactors = {
            market: 0,
            liquidity: 0,
            compliance: 0,
            operational: 0,
            credit: 0
        };
        
        this.analysisCache = new Map();
        this.isAnalyzing = false;
        
        this.initializeEngine();
    }
    
    /**
     * 初始化风险评估引擎
     */
    initializeEngine() {
        console.log('🤖 AI Risk Engine initialized');
        this.loadMarketData();
        this.startRealTimeMonitoring();
    }
    
    /**
     * 综合风险评估
     * @param {Object} assetData - 资产数据
     * @param {Object} projectData - 项目数据
     * @returns {Promise<Object>} 风险评估结果
     */
    async assessRisk(assetData, projectData = {}) {
        this.isAnalyzing = true;
        
        try {
            // 生成缓存键
            const cacheKey = this.generateCacheKey(assetData, projectData);
            
            // 检查缓存
            if (this.analysisCache.has(cacheKey)) {
                const cached = this.analysisCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 300000) { // 5分钟缓存
                    return cached.result;
                }
            }
            
            // 并行执行各项风险评估
            const [
                marketRisk,
                liquidityRisk,
                complianceRisk,
                operationalRisk,
                creditRisk
            ] = await Promise.all([
                this.assessMarketRisk(assetData, projectData),
                this.assessLiquidityRisk(assetData, projectData),
                this.assessComplianceRisk(assetData, projectData),
                this.assessOperationalRisk(assetData, projectData),
                this.assessCreditRisk(assetData, projectData)
            ]);
            
            // 计算综合风险评分
            const overallRisk = this.calculateOverallRisk({
                market: marketRisk,
                liquidity: liquidityRisk,
                compliance: complianceRisk,
                operational: operationalRisk,
                credit: creditRisk
            });
            
            // 生成风险报告
            const riskReport = this.generateRiskReport({
                overall: overallRisk,
                factors: {
                    market: marketRisk,
                    liquidity: liquidityRisk,
                    compliance: complianceRisk,
                    operational: operationalRisk,
                    credit: creditRisk
                },
                assetData,
                projectData
            });
            
            // 缓存结果
            this.analysisCache.set(cacheKey, {
                timestamp: Date.now(),
                result: riskReport
            });
            
            this.isAnalyzing = false;
            return riskReport;
            
        } catch (error) {
            this.isAnalyzing = false;
            console.error('Risk assessment failed:', error);
            return this.getDefaultRiskAssessment();
        }
    }
    
    /**
     * 市场风险评估
     */
    async assessMarketRisk(assetData, projectData) {
        const factors = {
            assetType: this.getAssetTypeRisk(assetData.type),
            marketVolatility: await this.getMarketVolatility(assetData.type),
            economicIndicators: await this.getEconomicIndicators(assetData.region),
            industryTrends: await this.getIndustryTrends(assetData.type),
            geopoliticalRisk: this.getGeopoliticalRisk(assetData.region)
        };
        
        // 权重计算
        const weights = {
            assetType: 0.25,
            marketVolatility: 0.30,
            economicIndicators: 0.20,
            industryTrends: 0.15,
            geopoliticalRisk: 0.10
        };
        
        const score = Object.keys(factors).reduce((total, key) => {
            return total + (factors[key] * weights[key]);
        }, 0);
        
        return {
            score: Math.round(score),
            level: this.getRiskLevel(score),
            factors,
            recommendations: this.getMarketRiskRecommendations(score, factors)
        };
    }
    
    /**
     * 流动性风险评估
     */
    async assessLiquidityRisk(assetData, projectData) {
        const factors = {
            assetLiquidity: this.getAssetLiquidityScore(assetData.type),
            marketDepth: await this.getMarketDepth(assetData.type),
            tradingVolume: await this.getHistoricalTradingVolume(assetData.type),
            tokenizationLevel: this.getTokenizationBenefit(assetData.value),
            exitMechanism: this.evaluateExitMechanism(projectData.exitStrategy)
        };
        
        const weights = {
            assetLiquidity: 0.30,
            marketDepth: 0.25,
            tradingVolume: 0.20,
            tokenizationLevel: 0.15,
            exitMechanism: 0.10
        };
        
        const score = Object.keys(factors).reduce((total, key) => {
            return total + (factors[key] * weights[key]);
        }, 0);
        
        return {
            score: Math.round(score),
            level: this.getRiskLevel(score),
            factors,
            expectedLiquidityTime: this.estimateLiquidityTime(score),
            recommendations: this.getLiquidityRiskRecommendations(score, factors)
        };
    }
    
    /**
     * 合规风险评估
     */
    async assessComplianceRisk(assetData, projectData) {
        const factors = {
            jurisdictionRisk: await this.getJurisdictionRisk(assetData.region),
            regulatoryClarity: this.getRegulatoryClarity(assetData.region, assetData.type),
            kycAmlCompliance: await this.assessKycAmlCompliance(projectData.applicant),
            taxCompliance: this.assessTaxCompliance(assetData.region),
            securityTokenCompliance: this.assessSecurityTokenCompliance(projectData.tokenStandard)
        };
        
        const weights = {
            jurisdictionRisk: 0.30,
            regulatoryClarity: 0.25,
            kycAmlCompliance: 0.20,
            taxCompliance: 0.15,
            securityTokenCompliance: 0.10
        };
        
        const score = Object.keys(factors).reduce((total, key) => {
            return total + (factors[key] * weights[key]);
        }, 0);
        
        return {
            score: Math.round(score),
            level: this.getRiskLevel(score),
            factors,
            requiredDocuments: this.getRequiredComplianceDocuments(assetData.region),
            recommendations: this.getComplianceRiskRecommendations(score, factors)
        };
    }
    
    /**
     * 运营风险评估
     */
    async assessOperationalRisk(assetData, projectData) {
        const factors = {
            teamExperience: this.assessTeamExperience(projectData.team),
            technologyRisk: this.assessTechnologyRisk(projectData.blockchain, projectData.tokenStandard),
            custodyRisk: this.assessCustodyRisk(projectData.custodyProvider),
            smartContractRisk: await this.assessSmartContractRisk(projectData.contractAudit),
            thirdPartyRisk: this.assessThirdPartyRisk(projectData.serviceProviders)
        };
        
        const weights = {
            teamExperience: 0.25,
            technologyRisk: 0.25,
            custodyRisk: 0.20,
            smartContractRisk: 0.20,
            thirdPartyRisk: 0.10
        };
        
        const score = Object.keys(factors).reduce((total, key) => {
            return total + (factors[key] * weights[key]);
        }, 0);
        
        return {
            score: Math.round(score),
            level: this.getRiskLevel(score),
            factors,
            recommendations: this.getOperationalRiskRecommendations(score, factors)
        };
    }
    
    /**
     * 信用风险评估
     */
    async assessCreditRisk(assetData, projectData) {
        const factors = {
            assetQuality: this.assessAssetQuality(assetData),
            counterpartyRisk: await this.assessCounterpartyRisk(projectData.applicant),
            concentrationRisk: this.assessConcentrationRisk(assetData),
            collateralValue: this.assessCollateralValue(assetData),
            cashFlowStability: this.assessCashFlowStability(assetData.historicalReturns)
        };
        
        const weights = {
            assetQuality: 0.30,
            counterpartyRisk: 0.25,
            concentrationRisk: 0.20,
            collateralValue: 0.15,
            cashFlowStability: 0.10
        };
        
        const score = Object.keys(factors).reduce((total, key) => {
            return total + (factors[key] * weights[key]);
        }, 0);
        
        return {
            score: Math.round(score),
            level: this.getRiskLevel(score),
            factors,
            recommendations: this.getCreditRiskRecommendations(score, factors)
        };
    }
    
    /**
     * 计算综合风险评分
     */
    calculateOverallRisk(riskFactors) {
        const weights = {
            market: 0.25,
            liquidity: 0.20,
            compliance: 0.25,
            operational: 0.20,
            credit: 0.10
        };
        
        const weightedScore = Object.keys(riskFactors).reduce((total, key) => {
            return total + (riskFactors[key].score * weights[key]);
        }, 0);
        
        return {
            score: Math.round(weightedScore),
            level: this.getRiskLevel(weightedScore),
            confidence: this.calculateConfidence(riskFactors)
        };
    }
    
    /**
     * 生成风险报告
     */
    generateRiskReport(assessmentData) {
        const { overall, factors, assetData, projectData } = assessmentData;
        
        return {
            timestamp: new Date().toISOString(),
            overall,
            factors,
            summary: {
                riskLevel: overall.level,
                riskScore: overall.score,
                confidence: overall.confidence,
                keyRisks: this.identifyKeyRisks(factors),
                recommendations: this.generateOverallRecommendations(factors)
            },
            projections: {
                expectedReturn: this.calculateExpectedReturn(assessmentData),
                worstCaseScenario: this.calculateWorstCase(assessmentData),
                bestCaseScenario: this.calculateBestCase(assessmentData)
            },
            monitoring: {
                alertThresholds: this.setAlertThresholds(overall.score),
                reviewFrequency: this.determineReviewFrequency(overall.level),
                keyMetrics: this.identifyKeyMonitoringMetrics(factors)
            }
        };
    }
    
    /**
     * 实时风险监控
     */
    startRealTimeMonitoring() {
        if (!this.config.enableRealTime) return;
        
        setInterval(async () => {
            try {
                await this.updateMarketData();
                this.checkRiskAlerts();
            } catch (error) {
                console.error('Real-time monitoring error:', error);
            }
        }, 60000); // 每分钟更新
    }
    
    /**
     * 辅助方法 - 获取资产类型风险
     */
    getAssetTypeRisk(assetType) {
        const riskMapping = {
            'real-estate': 35,      // 房地产 - 中低风险
            'art': 65,              // 艺术品 - 中高风险
            'equity': 55,           // 股权 - 中等风险
            'bonds': 25,            // 债券 - 低风险
            'commodities': 45,      // 大宗商品 - 中等风险
            'intellectual': 60,     // 知识产权 - 中高风险
            'infrastructure': 30    // 基础设施 - 中低风险
        };
        
        return riskMapping[assetType] || 50;
    }
    
    /**
     * 模拟市场波动率获取
     */
    async getMarketVolatility(assetType) {
        // 模拟API调用
        await this.delay(100);
        
        const volatilityMapping = {
            'real-estate': 20,
            'art': 70,
            'equity': 60,
            'bonds': 15,
            'commodities': 55,
            'intellectual': 65,
            'infrastructure': 25
        };
        
        return volatilityMapping[assetType] || 40;
    }
    
    /**
     * 获取经济指标
     */
    async getEconomicIndicators(region) {
        await this.delay(150);
        
        const indicatorMapping = {
            'china': 25,
            'hongkong': 30,
            'singapore': 20,
            'us': 35,
            'eu': 40,
            'other': 50
        };
        
        return indicatorMapping[region] || 45;
    }
    
    /**
     * 获取行业趋势
     */
    async getIndustryTrends(assetType) {
        await this.delay(120);
        
        // 模拟行业趋势分析
        const trendMapping = {
            'real-estate': 30,  // 房地产市场趋稳
            'art': 40,          // 艺术品市场波动
            'equity': 45,       // 股权市场不确定
            'bonds': 20,        // 债券市场稳定
            'commodities': 50,  // 大宗商品波动
            'intellectual': 35, // IP市场增长
            'infrastructure': 25 // 基建市场稳定
        };
        
        return trendMapping[assetType] || 40;
    }
    
    /**
     * 获取地缘政治风险
     */
    getGeopoliticalRisk(region) {
        const riskMapping = {
            'china': 40,
            'hongkong': 35,
            'singapore': 15,
            'us': 30,
            'eu': 25,
            'other': 60
        };
        
        return riskMapping[region] || 50;
    }
    
    /**
     * 获取风险等级
     */
    getRiskLevel(score) {
        if (score <= this.config.riskThresholds.low) return 'low';
        if (score <= this.config.riskThresholds.medium) return 'medium';
        if (score <= this.config.riskThresholds.high) return 'high';
        return 'critical';
    }
    
    /**
     * 计算置信度
     */
    calculateConfidence(riskFactors) {
        const scores = Object.values(riskFactors).map(factor => factor.score);
        const variance = this.calculateVariance(scores);
        
        // 方差越小，置信度越高
        const confidence = Math.max(60, 100 - variance * 2);
        return Math.round(confidence);
    }
    
    /**
     * 计算方差
     */
    calculateVariance(scores) {
        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length;
    }
    
    /**
     * 识别关键风险
     */
    identifyKeyRisks(factors) {
        const risks = [];
        
        Object.entries(factors).forEach(([key, data]) => {
            if (data.score > this.config.riskThresholds.medium) {
                risks.push({
                    type: key,
                    score: data.score,
                    level: data.level,
                    priority: data.score > this.config.riskThresholds.high ? 'high' : 'medium'
                });
            }
        });
        
        return risks.sort((a, b) => b.score - a.score);
    }
    
    /**
     * 生成综合建议
     */
    generateOverallRecommendations(factors) {
        const recommendations = [];
        
        Object.entries(factors).forEach(([key, data]) => {
            if (data.recommendations) {
                recommendations.push(...data.recommendations);
            }
        });
        
        // 去重并按优先级排序
        const uniqueRecommendations = [...new Set(recommendations)];
        
        return uniqueRecommendations.slice(0, 5); // 返回前5个建议
    }
    
    /**
     * 模拟延迟
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 生成缓存键
     */
    generateCacheKey(assetData, projectData) {
        const key = JSON.stringify({
            assetType: assetData.type,
            region: assetData.region,
            value: assetData.value,
            blockchain: projectData.blockchain
        });
        
        return btoa(key).substring(0, 16);
    }
    
    /**
     * 获取默认风险评估
     */
    getDefaultRiskAssessment() {
        return {
            timestamp: new Date().toISOString(),
            overall: {
                score: 50,
                level: 'medium',
                confidence: 70
            },
            factors: {
                market: { score: 50, level: 'medium' },
                liquidity: { score: 50, level: 'medium' },
                compliance: { score: 50, level: 'medium' },
                operational: { score: 50, level: 'medium' },
                credit: { score: 50, level: 'medium' }
            },
            summary: {
                riskLevel: 'medium',
                riskScore: 50,
                confidence: 70,
                keyRisks: [],
                recommendations: ['建议进行详细的尽职调查', '加强风险监控措施']
            }
        };
    }
    
    // 其他辅助方法的简化实现
    getAssetLiquidityScore(assetType) {
        const liquidityMapping = {
            'real-estate': 70,     // 房地产流动性差
            'art': 80,             // 艺术品流动性很差
            'equity': 40,          // 股权流动性中等
            'bonds': 30,           // 债券流动性较好
            'commodities': 35,     // 大宗商品流动性较好
            'intellectual': 75,    // 知识产权流动性差
            'infrastructure': 85   // 基础设施流动性很差
        };
        
        return liquidityMapping[assetType] || 50;
    }
    
    async getMarketDepth(assetType) {
        await this.delay(100);
        return Math.floor(Math.random() * 40) + 30; // 30-70之间
    }
    
    async getHistoricalTradingVolume(assetType) {
        await this.delay(100);
        return Math.floor(Math.random() * 50) + 25; // 25-75之间
    }
    
    getTokenizationBenefit(assetValue) {
        // 资产价值越高，代币化带来的流动性改善越明显
        if (assetValue > 100000000) return 20; // 1亿以上
        if (assetValue > 50000000) return 25;  // 5000万以上
        if (assetValue > 10000000) return 30;  // 1000万以上
        return 35; // 1000万以下
    }
    
    evaluateExitMechanism(exitStrategy) {
        const strategyMapping = {
            'anytime': 20,         // 随时退出风险低
            'lockup': 40,          // 锁定期退出风险中等
            'milestone': 60,       // 里程碑退出风险较高
            'vote': 50            // 投票退出风险中等
        };
        
        return strategyMapping[exitStrategy] || 50;
    }
    
    estimateLiquidityTime(liquidityScore) {
        if (liquidityScore <= 30) return '1-7天';
        if (liquidityScore <= 50) return '1-4周';
        if (liquidityScore <= 70) return '1-6个月';
        return '6个月以上';
    }
    
    // 生成各类风险建议
    getMarketRiskRecommendations(score, factors) {
        const recommendations = [];
        
        if (score > 60) {
            recommendations.push('建议增加市场对冲策略');
            recommendations.push('考虑分散投资以降低市场风险');
        }
        
        if (factors.marketVolatility > 50) {
            recommendations.push('密切关注市场波动，设置止损机制');
        }
        
        return recommendations;
    }
    
    getLiquidityRiskRecommendations(score, factors) {
        const recommendations = [];
        
        if (score > 50) {
            recommendations.push('建议引入做市商机制');
            recommendations.push('考虑与流动性提供商合作');
        }
        
        return recommendations;
    }
    
    getComplianceRiskRecommendations(score, factors) {
        const recommendations = [];
        
        if (score > 40) {
            recommendations.push('建议聘请专业合规顾问');
            recommendations.push('加强KYC/AML流程');
        }
        
        return recommendations;
    }
    
    getOperationalRiskRecommendations(score, factors) {
        const recommendations = [];
        
        if (score > 50) {
            recommendations.push('建议增强运营团队');
            recommendations.push('实施更严格的内控制度');
        }
        
        return recommendations;
    }
    
    getCreditRiskRecommendations(score, factors) {
        const recommendations = [];
        
        if (score > 45) {
            recommendations.push('建议增加信用增强措施');
            recommendations.push('考虑引入担保机制');
        }
        
        return recommendations;
    }
    
    // 其他必要的模拟方法
    async getJurisdictionRisk(region) {
        await this.delay(100);
        const riskMapping = {
            'china': 45,
            'hongkong': 25,
            'singapore': 15,
            'us': 30,
            'eu': 20,
            'other': 70
        };
        return riskMapping[region] || 50;
    }
    
    getRegulatoryClarity(region, assetType) {
        // 简化实现
        return Math.floor(Math.random() * 40) + 20; // 20-60之间
    }
    
    async assessKycAmlCompliance(applicant) {
        await this.delay(150);
        return Math.floor(Math.random() * 30) + 10; // 10-40之间，表示低风险
    }
    
    assessTaxCompliance(region) {
        const complianceMapping = {
            'china': 30,
            'hongkong': 20,
            'singapore': 15,
            'us': 35,
            'eu': 25,
            'other': 60
        };
        return complianceMapping[region] || 40;
    }
    
    assessSecurityTokenCompliance(tokenStandard) {
        const standardMapping = {
            'erc20': 60,     // 普通代币合规风险较高
            'erc1400': 25,   // 证券型代币合规风险低
            'erc3643': 15,   // 合规代币风险最低
            'erc721': 45,    // NFT中等风险
            'erc1155': 40    // 多代币中等风险
        };
        return standardMapping[tokenStandard] || 50;
    }
    
    // 计算预期收益等方法的简化实现
    calculateExpectedReturn(assessmentData) {
        const baseReturn = 8; // 基础收益率8%
        const riskAdjustment = (100 - assessmentData.overall.score) / 100 * 4; // 风险调整
        return (baseReturn + riskAdjustment).toFixed(2) + '%';
    }
    
    calculateWorstCase(assessmentData) {
        const expectedReturn = parseFloat(this.calculateExpectedReturn(assessmentData));
        return (expectedReturn - 5).toFixed(2) + '%';
    }
    
    calculateBestCase(assessmentData) {
        const expectedReturn = parseFloat(this.calculateExpectedReturn(assessmentData));
        return (expectedReturn + 8).toFixed(2) + '%';
    }
    
    setAlertThresholds(overallScore) {
        return {
            critical: overallScore + 10,
            warning: overallScore + 5,
            info: overallScore - 5
        };
    }
    
    determineReviewFrequency(riskLevel) {
        const frequencies = {
            'low': '季度',
            'medium': '月度',
            'high': '周度',
            'critical': '日度'
        };
        return frequencies[riskLevel] || '月度';
    }
    
    identifyKeyMonitoringMetrics(factors) {
        const metrics = [];
        
        Object.entries(factors).forEach(([key, data]) => {
            if (data.score > 40) {
                switch(key) {
                    case 'market':
                        metrics.push('市场波动率', '资产价格');
                        break;
                    case 'liquidity':
                        metrics.push('交易量', '买卖价差');
                        break;
                    case 'compliance':
                        metrics.push('监管变化', '合规检查');
                        break;
                    case 'operational':
                        metrics.push('运营效率', '技术稳定性');
                        break;
                    case 'credit':
                        metrics.push('信用评级', '现金流');
                        break;
                }
            }
        });
        
        return [...new Set(metrics)];
    }
    
    async loadMarketData() {
        // 模拟加载市场数据
        console.log('📊 Loading market data...');
    }
    
    async updateMarketData() {
        // 模拟更新市场数据
        console.log('🔄 Updating market data...');
    }
    
    checkRiskAlerts() {
        // 模拟检查风险警报
        console.log('🚨 Checking risk alerts...');
    }
    
    // 简化的团队经验评估等方法
    assessTeamExperience(team) {
        return Math.floor(Math.random() * 40) + 20; // 20-60之间
    }
    
    assessTechnologyRisk(blockchain, tokenStandard) {
        const blockchainRisk = {
            'ethereum': 20,
            'polygon': 25,
            'bsc': 30,
            'arbitrum': 25,
            'avalanche': 30,
            'solana': 35
        };
        
        const standardRisk = {
            'erc20': 30,
            'erc1400': 20,
            'erc3643': 15,
            'erc721': 25,
            'erc1155': 20
        };
        
        return (blockchainRisk[blockchain] + standardRisk[tokenStandard]) / 2 || 35;
    }
    
    assessCustodyRisk(custodyProvider) {
        const providerRisk = {
            'coinbase': 15,
            'fireblocks': 20,
            'ledger': 25,
            'multisig': 30,
            'self': 60
        };
        
        return providerRisk[custodyProvider] || 40;
    }
    
    async assessSmartContractRisk(auditFirm) {
        await this.delay(100);
        
        const auditRisk = {
            'certik': 10,
            'quantstamp': 15,
            'openzeppelin': 10,
            'consensys': 15,
            'other': 40,
            '': 80  // 未审计
        };
        
        return auditRisk[auditFirm] || 60;
    }
    
    assessThirdPartyRisk(serviceProviders) {
        // 简化实现，基于服务商数量和类型
        if (!serviceProviders || serviceProviders.length === 0) return 70;
        
        const baseRisk = 30;
        const providerRisk = serviceProviders.length * 5; // 每个服务商增加5分风险
        
        return Math.min(baseRisk + providerRisk, 80);
    }
    
    assessAssetQuality(assetData) {
        let qualityScore = 0;
        
        // 基于资产类型
        const typeQuality = {
            'real-estate': 20,
            'art': 40,
            'equity': 35,
            'bonds': 15,
            'commodities': 30,
            'intellectual': 45,
            'infrastructure': 25
        };
        
        qualityScore += typeQuality[assetData.type] || 40;
        
        // 基于资产年龄
        if (assetData.year) {
            const age = new Date().getFullYear() - assetData.year;
            if (age > 20) qualityScore += 10;
            else if (age > 10) qualityScore += 5;
        }
        
        return Math.min(qualityScore, 80);
    }
    
    async assessCounterpartyRisk(applicant) {
        await this.delay(100);
        // 模拟信用评估
        return Math.floor(Math.random() * 40) + 20;
    }
    
    assessConcentrationRisk(assetData) {
        // 简化实现，基于资产价值和类型
        const value = assetData.value || 0;
        
        if (value > 100000000) return 60; // 超过1亿，集中度风险高
        if (value > 50000000) return 45;  // 超过5000万，中等风险
        if (value > 10000000) return 30;  // 超过1000万，较低风险
        
        return 20; // 1000万以下，风险较低
    }
    
    assessCollateralValue(assetData) {
        // 基于资产类型和估值方法
        const collateralMapping = {
            'real-estate': 25,     // 房地产抵押价值高
            'art': 60,             // 艺术品估值困难
            'equity': 45,          // 股权估值波动
            'bonds': 20,           // 债券估值稳定
            'commodities': 35,     // 大宗商品价格波动
            'intellectual': 70,    // 知识产权估值困难
            'infrastructure': 30   // 基础设施价值稳定
        };
        
        return collateralMapping[assetData.type] || 45;
    }
    
    assessCashFlowStability(historicalReturns) {
        if (!historicalReturns || historicalReturns.length === 0) return 60;
        
        // 计算收益率的标准差
        const mean = historicalReturns.reduce((sum, val) => sum + val, 0) / historicalReturns.length;
        const variance = historicalReturns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalReturns.length;
        const stdDev = Math.sqrt(variance);
        
        // 标准差越大，现金流稳定性越差
        return Math.min(stdDev * 10, 80);
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RWAICRiskEngine;
} else if (typeof window !== 'undefined') {
    window.RWAICRiskEngine = RWAICRiskEngine;
}