// form_handler.js

class FormHandler {
    constructor(uiUpdater, projectDataManager, validator) {
        this.uiUpdater = uiUpdater;
        this.projectDataManager = projectDataManager;
        this.validator = validator;
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
            submissionTime: new Date().toISOString()
        };
        return formData;
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
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormHandler;
}