// form_handler.js

class FormHandler {
    constructor(uiUpdater, projectDataManager, validator) {
        this.uiUpdater = uiUpdater;
        this.projectDataManager = projectDataManager;
        this.validator = validator;
        this.isSubmitting = false;
        this.initialize();
    }

    initialize() {
        console.log('FormHandler initialized');
        this.bindFormSubmission();
    }

    bindFormSubmission() {
        const form = document.getElementById('rwaSetupForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.processFormSubmission();
            });
        }
    }

    async processFormSubmission() {
        this.validator.clearValidationStates();
        
        const submitButton = document.querySelector('button[type="submit"]');
        let originalText = '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.classList.add('loading');
            originalText = submitButton.textContent;
            submitButton.textContent = '处理中...';
        }
        
        try {
            this.uiUpdater.showProcessingStatus();
            const formData = this.collectFormData();
            
            if (window.validateCurrentStep && !window.validateCurrentStep()) {
                throw new Error('表单数据验证失败');
            }
            
            if (!this.validator.validateFormData(formData)) {
                // Validation errors are thrown by validator.validateFormData
                // and will be caught here.
                return; // Stop processing if validation fails
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
            
            const projectData = await this.projectDataManager.generateProjectData(formData);
            await this.projectDataManager.saveProjectData(projectData);
            
            this.uiUpdater.showSuccessMessage();
            this.markStepAsCompleted();
            
            setTimeout(() => {
                this.redirectToAssetManagement(projectData.projectId);
            }, 2000);
            
        } catch (error) {
            console.error('表单处理失败:', error);
            this.uiUpdater.showErrorMessage(error.message);
            
            const errorElement = document.querySelector('.form-group.error');
            if (errorElement) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.classList.remove('loading');
                submitButton.textContent = originalText || '提交';
            }
        }
    }

    collectFormData() {
        const formData = {
            projectName: document.getElementById('projectName')?.value || '',
            assetType: document.getElementById('assetType')?.value || '',
            projectType: document.getElementById('projectType')?.value || '',
            assetLocation: document.getElementById('projectLocation')?.value || '',
            projectDescription: document.getElementById('projectDescription')?.value || '',
            initiatorType: document.getElementById('sponsorType')?.value || '',
            companyName: document.getElementById('sponsorName')?.value || '',
            contactPerson: document.getElementById('contactPerson')?.value || '',
            contactPhone: document.getElementById('phone')?.value || '',
            contactEmail: document.getElementById('email')?.value || '',
            assetValue: parseFloat(document.getElementById('assetValue')?.value) || 0,
            annualRevenue: parseFloat(document.getElementById('annualRevenue')?.value) || 0,
            annualProfit: parseFloat(document.getElementById('annualProfit')?.value) || 0,
            annualReturn: parseFloat(document.getElementById('annualReturn')?.value) || 0,
            operationPeriod: document.getElementById('operationPeriod')?.value || '',
            tokenRights: this.getCheckedValues('tokenRights'),
            walletAddress: document.getElementById('walletAddress')?.value || '',
            nftTypes: this.getCheckedValues('nftTypes'),
            targetJurisdictions: this.getCheckedValues('targetJurisdictions'),
            kycLevel: document.getElementById('kycLevel')?.value || '',
            amlLevel: document.getElementById('amlLevel')?.value || '',
            additionalRequirements: document.getElementById('additionalRequirements')?.value || '',
            // 添加文件上传数据
            uploadedFiles: window.uploadedFiles || [],
            fileCategories: this.categorizeUploadedFiles(),
            totalFileSize: this.calculateTotalFileSize(),
            submissionTime: new Date().toISOString()
        };
        return formData;
    }
    
    // 分类已上传的文件
    categorizeUploadedFiles() {
        if (!window.uploadedFiles || window.uploadedFiles.length === 0) {
            return {
                asset_docs: [],
                financial_docs: [],
                legal_docs: [],
                other: []
            };
        }
        
        const categories = {
            asset_docs: [],
            financial_docs: [],
            legal_docs: [],
            other: []
        };
        
        window.uploadedFiles.forEach(file => {
            const category = file.category || 'other';
            if (categories[category]) {
                categories[category].push({
                    id: file.id,
                    name: file.originalName,
                    size: file.fileSize,
                    type: file.fileType,
                    url: file.url
                });
            }
        });
        
        return categories;
    }
    
    // 计算总文件大小
    calculateTotalFileSize() {
        if (!window.uploadedFiles || window.uploadedFiles.length === 0) {
            return 0;
        }
        
        return window.uploadedFiles.reduce((total, file) => {
            return total + (file.fileSize || 0);
        }, 0);
    }

    getCheckedValues(name) {
        const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
        return Array.from(checkboxes).map(cb => cb.value);
    }

    markStepAsCompleted() {
        const activeStep = document.querySelector('.step.active');
        if (activeStep) {
            activeStep.classList.add('completed');
        }
    }

    redirectToAssetManagement(projectId) {
        const overlay = document.getElementById('processingOverlay');
        if (overlay) {
            overlay.remove();
        }
        window.location.href = `asset_management.html?projectId=${projectId}`;
    }

    // 显示AI风险评估结果
    showRiskAssessment(assessment) {
        const modal = document.createElement('div');
        modal.className = 'risk-assessment-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        `;

        const riskLevel = assessment.riskLevel || 'unknown';
        const riskColor = {
            low: '#10b981',
            medium: '#f59e0b', 
            high: '#ef4444',
            unknown: '#6b7280'
        }[riskLevel];

        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">AI风险评估报告</h3>
                <div style="display: inline-block; padding: 8px 16px; border-radius: 20px; background: ${riskColor}; color: white; font-weight: 600;">
                    风险等级: ${riskLevel.toUpperCase()}
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #374151; margin-bottom: 10px;">评估摘要</h4>
                <p style="color: #6b7280; line-height: 1.6;">${assessment.summary || '暂无评估摘要'}</p>
            </div>
            
            ${assessment.recommendations ? `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #374151; margin-bottom: 10px;">建议</h4>
                    <ul style="color: #6b7280; line-height: 1.6; padding-left: 20px;">
                        ${assessment.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500;">
                    确定
                </button>
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // 获取项目列表
    async loadProjects() {
        try {
            const result = await apiClient.projects.getAll();
            return result.data || [];
        } catch (error) {
            console.error('加载项目列表失败:', error);
            showNotification('加载项目列表失败', 'error');
            return [];
        }
    }

    // 获取单个项目详情
    async loadProject(projectId) {
        try {
            const result = await apiClient.projects.getById(projectId);
            return result.data;
        } catch (error) {
            console.error('加载项目详情失败:', error);
            showNotification('加载项目详情失败', 'error');
            return null;
        }
    }

    // 执行AI风险评估
    async performRiskAssessment(projectId, projectData) {
        try {
            const result = await apiClient.riskAssessment.assess(projectId, projectData);
            if (result.success) {
                this.showRiskAssessment(result.data);
                return result.data;
            } else {
                throw new Error(result.error || '风险评估失败');
            }
        } catch (error) {
            console.error('AI风险评估失败:', error);
            showNotification('AI风险评估失败: ' + error.message, 'error');
            return null;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormHandler;
}