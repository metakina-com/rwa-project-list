// form_ui_updater.js

class FormUIUpdater {
    constructor() {}

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            const formGroup = field.closest('.form-group');
            if (formGroup) {
                formGroup.classList.add('error');
                formGroup.classList.remove('success');
                
                let errorElement = formGroup.querySelector('.error-message');
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.className = 'error-message';
                    // Insert error message after the input field or at the end of the form group
                    const inputField = formGroup.querySelector('input, textarea, select');
                    if (inputField && inputField.nextSibling) {
                        formGroup.insertBefore(errorElement, inputField.nextSibling);
                    } else {
                        formGroup.appendChild(errorElement);
                    }
                }
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
        }
    }

    showFieldSuccess(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            const formGroup = field.closest('.form-group');
            if (formGroup) {
                formGroup.classList.add('success');
                formGroup.classList.remove('error');
                
                const errorElement = formGroup.querySelector('.error-message');
                if (errorElement) {
                    errorElement.style.display = 'none';
                    errorElement.textContent = ''; // Clear message
                }
            }
        }
    }

    showProcessingStatus() {
        let overlay = document.getElementById('processingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'processingOverlay';
            document.body.appendChild(overlay);
        }
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
            transition: opacity 0.3s ease-in-out;
            opacity: 0;
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
        // Trigger reflow to apply initial opacity before transition
        void overlay.offsetWidth;
        overlay.style.opacity = '1';
    }

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

    showErrorMessage(message) {
        const overlay = document.getElementById('processingOverlay');
        if (overlay) {
            overlay.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 3rem; color: #dc3545; margin-bottom: 20px;">❌</div>
                    <div style="font-size: 1.5rem; margin-bottom: 10px;">处理失败</div>
                    <div style="font-size: 1rem; opacity: 0.8;">${message}</div>
                    <button id="errorOverlayButton" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">确定</button>
                </div>
            `;
            document.getElementById('errorOverlayButton').addEventListener('click', () => {
                this.hideProcessingOverlay();
            });
        }
    }

    hideProcessingOverlay() {
        const overlay = document.getElementById('processingOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300); // Match transition duration
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormUIUpdater;
}