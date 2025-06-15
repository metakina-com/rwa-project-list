// form_processor.js
// 主协调器，负责实例化和连接各个模块

// 假设这些模块已经通过 <script> 标签在HTML中加载
// 或者如果使用模块系统 (ES Modules, CommonJS), 则使用 import/require

// const FormHandler = require('./form_handler'); // CommonJS example
// const FormValidator = require('./form_validator');
// const FormUIUpdater = require('./form_ui_updater');
// const ProjectDataManager = require('./project_data_manager'); // 假设已存在或将创建
// const ProjectDataGenerator = require('./project_data_generator');

class RWAFormProcessor {
    constructor() {
        // 实例化各个模块
        this.uiUpdater = new FormUIUpdater();
        this.validator = new FormValidator(this.uiUpdater); // Validator uses UIUpdater
        this.projectDataGenerator = new ProjectDataGenerator();
        // projectDataManager 现在包含数据生成和保存逻辑
        this.projectDataManager = new ProjectDataManager(this.projectDataGenerator); 
        this.formHandler = new FormHandler(this.uiUpdater, this.projectDataManager, this.validator);

        this.initialize();
    }

    initialize() {
        console.log('RWAFormProcessor initialized with all modules.');
        // FormHandler 将在其自己的构造函数中绑定表单提交
    }
}

// 页面加载完成后初始化主处理器
document.addEventListener('DOMContentLoaded', function() {
    // 确保所有依赖的类都已定义
    if (typeof FormUIUpdater !== 'undefined' && 
        typeof FormValidator !== 'undefined' && 
        typeof ProjectDataGenerator !== 'undefined' &&
        typeof ProjectDataManager !== 'undefined' && // 确保 ProjectDataManager 也已定义
        typeof FormHandler !== 'undefined') {
        new RWAFormProcessor();
    } else {
        console.error('One or more required modules are not loaded. Ensure form_ui_updater.js, form_validator.js, project_data_generator.js, project_data_manager.js, and form_handler.js are included before form_processor.js');
    }
});

// 如果需要，导出 RWAFormProcessor 类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RWAFormProcessor;
}