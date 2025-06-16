// project_data_manager.js
// 负责项目数据的保存和加载

class ProjectDataManager {
    constructor(projectDataGenerator) {
        this.projectDataGenerator = projectDataGenerator; // Can be used if generation is tied to saving
        console.log('ProjectDataManager initialized.');
    }

    // 生成并保存项目数据
    async generateAndSaveProjectData(formData) {
        if (!this.projectDataGenerator) {
            console.error('ProjectDataGenerator not provided to ProjectDataManager.');
            throw new Error('无法生成项目数据：缺少生成器。');
        }
        // 生成项目数据
        const projectData = await this.projectDataGenerator.generateProjectData(formData);
        
        // 保存项目数据
        await this.saveProjectData(projectData);
        return projectData; // 返回生成的项目数据，包括 projectId
    }

    // 保存项目数据到本地存储
    async saveProjectData(projectData) {
        try {
            // 保存完整的项目数据
            localStorage.setItem(`rwa_project_${projectData.projectId}`, JSON.stringify(projectData));

            // 更新项目列表（只包含基本信息，用于列表显示）
            const projectList = JSON.parse(localStorage.getItem('rwa_project_list') || '[]');
            const existingProjectIndex = projectList.findIndex(p => p.projectId === projectData.projectId);

            const projectListItem = {
                projectId: projectData.projectId,
                name: projectData.basicInfo.name,
                assetType: projectData.basicInfo.assetType,
                status: projectData.basicInfo.status,
                createdAt: projectData.basicInfo.createdAt
            };

            if (existingProjectIndex > -1) {
                projectList[existingProjectIndex] = projectListItem;
            } else {
                projectList.push(projectListItem);
            }
            localStorage.setItem('rwa_project_list', JSON.stringify(projectList));

            console.log('项目数据已保存:', projectData.projectId);
            return projectData.projectId;
        } catch (error) {
            console.error('保存项目数据失败:', error);
            throw new Error('保存项目数据失败，请检查浏览器本地存储空间。');
        }
    }

    // 从本地存储加载项目数据
    loadProjectData(projectId) {
        try {
            const projectDataString = localStorage.getItem(`rwa_project_${projectId}`);
            if (projectDataString) {
                console.log('项目数据已加载:', projectId);
                return JSON.parse(projectDataString);
            }
            console.warn('未找到项目数据:', projectId);
            return null;
        } catch (error) {
            console.error('加载项目数据失败:', error);
            throw new Error('加载项目数据失败。');
        }
    }

    // 加载所有项目列表（基本信息）
    loadProjectList() {
        try {
            const projectListString = localStorage.getItem('rwa_project_list');
            if (projectListString) {
                return JSON.parse(projectListString);
            }
            return []; // 如果没有列表则返回空数组
        } catch (error) {
            console.error('加载项目列表失败:', error);
            throw new Error('加载项目列表失败。');
        }
    }

    // 删除项目数据
    deleteProjectData(projectId) {
        try {
            localStorage.removeItem(`rwa_project_${projectId}`);
            let projectList = this.loadProjectList();
            projectList = projectList.filter(p => p.projectId !== projectId);
            localStorage.setItem('rwa_project_list', JSON.stringify(projectList));
            console.log('项目数据已删除:', projectId);
            return true;
        } catch (error) {
            console.error('删除项目数据失败:', error);
            throw new Error('删除项目数据失败。');
        }
    }
}

// 如果需要，导出 ProjectDataManager 类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectDataManager;
}