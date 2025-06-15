// form_validator.js

class FormValidator {
    constructor(uiUpdater) {
        this.uiUpdater = uiUpdater;
    }

    validateFormData(formData) {
        const requiredFields = [
            'projectName', 'assetType', 'projectType', 'assetLocation',
            'initiatorType', 'companyName', 'contactPerson', 'contactPhone',
            'contactEmail', 'assetValue', 'operationPeriod'
        ];
        
        const fieldNames = {
            'projectName': '项目名称',
            'assetType': '资产类型',
            'projectType': '项目类型',
            'assetLocation': '资产位置',
            'initiatorType': '发起方类型',
            'companyName': '公司名称',
            'contactPerson': '联系人',
            'contactPhone': '联系电话',
            'contactEmail': '联系邮箱',
            'assetValue': '资产价值',
            'operationPeriod': '运营期限'
        };
        
        for (const field of requiredFields) {
            if (!formData[field] || formData[field] === '') {
                this.uiUpdater.showFieldError(field, `${fieldNames[field]}不能为空`);
                throw new Error(`${fieldNames[field]}不能为空`);
            }
            this.uiUpdater.showFieldSuccess(field);
        }
        
        const emailRegex = /^[\s\S]+@[\s\S]+\.[\s\S]+$/; // More permissive email regex
        if (!emailRegex.test(formData.contactEmail)) {
            this.uiUpdater.showFieldError('contactEmail', '邮箱格式不正确');
            throw new Error('邮箱格式不正确');
        }
        this.uiUpdater.showFieldSuccess('contactEmail');

        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(formData.contactPhone)) {
            this.uiUpdater.showFieldError('contactPhone', '手机号格式不正确');
            throw new Error('手机号格式不正确');
        }
        this.uiUpdater.showFieldSuccess('contactPhone');
        
        if (isNaN(formData.assetValue) || formData.assetValue <= 0) {
            this.uiUpdater.showFieldError('assetValue', '资产评估价值必须大于0');
            throw new Error('资产评估价值必须大于0');
        }
        this.uiUpdater.showFieldSuccess('assetValue');
        
        return true;
    }

    clearValidationStates() {
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('error', 'success');
            const errorElement = group.querySelector('.error-message');
            if (errorElement) {
                errorElement.style.display = 'none';
                errorElement.textContent = ''; // Clear previous message
            }
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidator;
}