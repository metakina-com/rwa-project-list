/**
 * Merkle树数据完整性验证模块
 * 用于RWA项目的数据完整性保护和验证
 */

class MerkleTree {
    constructor(data = []) {
        this.data = data;
        this.leaves = [];
        this.tree = [];
        this.root = null;
        
        if (data.length > 0) {
            this.buildTree();
        }
    }
    
    /**
     * 构建Merkle树
     */
    async buildTree() {
        if (this.data.length === 0) {
            throw new Error('数据不能为空');
        }
        
        // 生成叶子节点哈希
        this.leaves = await Promise.all(
            this.data.map(item => this.hash(this.serialize(item)))
        );
        
        // 构建树结构
        this.tree = await this.buildTreeLevels(this.leaves);
        this.root = this.tree[this.tree.length - 1][0];
        
        return this.root;
    }
    
    /**
     * 递归构建树的各个层级
     * @param {Array} level - 当前层级的哈希数组
     * @returns {Array} 完整的树结构
     */
    async buildTreeLevels(level) {
        const tree = [level];
        
        while (level.length > 1) {
            const nextLevel = [];
            
            for (let i = 0; i < level.length; i += 2) {
                const left = level[i];
                const right = level[i + 1] || left; // 如果是奇数个节点，复制最后一个
                const parentHash = await this.hash(left + right);
                nextLevel.push(parentHash);
            }
            
            tree.push(nextLevel);
            level = nextLevel;
        }
        
        return tree;
    }
    
    /**
     * SHA-256哈希函数
     * @param {string} data - 要哈希的数据
     * @returns {Promise<string>} 哈希值
     */
    async hash(data) {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            // 浏览器环境
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } else {
            // Node.js环境或fallback
            const crypto = require('crypto');
            return crypto.createHash('sha256').update(data).digest('hex');
        }
    }
    
    /**
     * 序列化数据
     * @param {*} data - 要序列化的数据
     * @returns {string} 序列化后的字符串
     */
    serialize(data) {
        if (typeof data === 'string') {
            return data;
        }
        return JSON.stringify(data, Object.keys(data).sort());
    }
    
    /**
     * 获取Merkle根
     * @returns {string} Merkle根哈希
     */
    getRoot() {
        return this.root;
    }
    
    /**
     * 生成指定数据的Merkle证明
     * @param {number} index - 数据在原始数组中的索引
     * @returns {Array} 证明路径
     */
    generateProof(index) {
        if (index < 0 || index >= this.data.length) {
            throw new Error('索引超出范围');
        }
        
        const proof = [];
        let currentIndex = index;
        
        // 从叶子节点开始，向上构建证明路径
        for (let level = 0; level < this.tree.length - 1; level++) {
            const currentLevel = this.tree[level];
            const isRightNode = currentIndex % 2 === 1;
            const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;
            
            if (siblingIndex < currentLevel.length) {
                proof.push({
                    hash: currentLevel[siblingIndex],
                    isRight: !isRightNode // 兄弟节点相对于当前节点的位置
                });
            }
            
            currentIndex = Math.floor(currentIndex / 2);
        }
        
        return proof;
    }
    
    /**
     * 验证Merkle证明
     * @param {*} data - 要验证的数据
     * @param {number} index - 数据索引
     * @param {Array} proof - 证明路径
     * @param {string} root - Merkle根（可选，默认使用当前树的根）
     * @returns {Promise<boolean>} 验证结果
     */
    async verifyProof(data, index, proof, root = null) {
        const targetRoot = root || this.root;
        if (!targetRoot) {
            throw new Error('没有可用的Merkle根进行验证');
        }
        
        // 计算数据的哈希
        let currentHash = await this.hash(this.serialize(data));
        
        // 沿着证明路径重建哈希
        for (const proofElement of proof) {
            if (proofElement.isRight) {
                // 兄弟节点在右侧
                currentHash = await this.hash(currentHash + proofElement.hash);
            } else {
                // 兄弟节点在左侧
                currentHash = await this.hash(proofElement.hash + currentHash);
            }
        }
        
        return currentHash === targetRoot;
    }
    
    /**
     * 添加新数据并重建树
     * @param {*} newData - 新数据
     * @returns {Promise<string>} 新的Merkle根
     */
    async addData(newData) {
        this.data.push(newData);
        return await this.buildTree();
    }
    
    /**
     * 批量添加数据
     * @param {Array} newDataArray - 新数据数组
     * @returns {Promise<string>} 新的Merkle根
     */
    async addMultipleData(newDataArray) {
        this.data.push(...newDataArray);
        return await this.buildTree();
    }
    
    /**
     * 更新指定索引的数据
     * @param {number} index - 要更新的数据索引
     * @param {*} newData - 新数据
     * @returns {Promise<string>} 新的Merkle根
     */
    async updateData(index, newData) {
        if (index < 0 || index >= this.data.length) {
            throw new Error('索引超出范围');
        }
        
        this.data[index] = newData;
        return await this.buildTree();
    }
    
    /**
     * 获取树的统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        return {
            dataCount: this.data.length,
            treeDepth: this.tree.length,
            leafCount: this.leaves.length,
            root: this.root,
            totalNodes: this.tree.reduce((sum, level) => sum + level.length, 0)
        };
    }
    
    /**
     * 导出树结构
     * @returns {Object} 可序列化的树结构
     */
    export() {
        return {
            data: this.data,
            leaves: this.leaves,
            tree: this.tree,
            root: this.root,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * 从导出的数据导入树结构
     * @param {Object} exportedData - 导出的数据
     */
    import(exportedData) {
        this.data = exportedData.data || [];
        this.leaves = exportedData.leaves || [];
        this.tree = exportedData.tree || [];
        this.root = exportedData.root || null;
    }
    
    /**
     * 比较两个Merkle树
     * @param {MerkleTree} otherTree - 另一个Merkle树
     * @returns {Object} 比较结果
     */
    compare(otherTree) {
        return {
            rootsMatch: this.root === otherTree.root,
            dataSizeMatch: this.data.length === otherTree.data.length,
            identical: this.root === otherTree.root && this.data.length === otherTree.data.length
        };
    }
}

/**
 * RWA资产数据Merkle树管理器
 * 专门用于RWA资产数据的完整性验证
 */
class RWAAssetMerkleManager {
    constructor() {
        this.assetTrees = new Map(); // 资产ID -> MerkleTree
        this.globalTree = new MerkleTree(); // 全局资产树
    }
    
    /**
     * 为资产创建Merkle树
     * @param {string} assetId - 资产ID
     * @param {Array} assetData - 资产数据数组
     * @returns {Promise<string>} Merkle根
     */
    async createAssetTree(assetId, assetData) {
        const tree = new MerkleTree(assetData);
        const root = await tree.buildTree();
        
        this.assetTrees.set(assetId, tree);
        
        // 更新全局树
        await this.updateGlobalTree();
        
        return root;
    }
    
    /**
     * 更新资产数据
     * @param {string} assetId - 资产ID
     * @param {Array} newData - 新的资产数据
     * @returns {Promise<string>} 新的Merkle根
     */
    async updateAssetData(assetId, newData) {
        if (!this.assetTrees.has(assetId)) {
            throw new Error(`资产 ${assetId} 不存在`);
        }
        
        const tree = this.assetTrees.get(assetId);
        tree.data = newData;
        const root = await tree.buildTree();
        
        // 更新全局树
        await this.updateGlobalTree();
        
        return root;
    }
    
    /**
     * 验证资产数据完整性
     * @param {string} assetId - 资产ID
     * @param {*} data - 要验证的数据
     * @param {number} index - 数据索引
     * @returns {Promise<boolean>} 验证结果
     */
    async verifyAssetData(assetId, data, index) {
        const tree = this.assetTrees.get(assetId);
        if (!tree) {
            throw new Error(`资产 ${assetId} 不存在`);
        }
        
        const proof = tree.generateProof(index);
        return await tree.verifyProof(data, index, proof);
    }
    
    /**
     * 生成资产数据证明
     * @param {string} assetId - 资产ID
     * @param {number} index - 数据索引
     * @returns {Object} 证明对象
     */
    generateAssetProof(assetId, index) {
        const tree = this.assetTrees.get(assetId);
        if (!tree) {
            throw new Error(`资产 ${assetId} 不存在`);
        }
        
        return {
            assetId,
            index,
            proof: tree.generateProof(index),
            root: tree.getRoot(),
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * 更新全局Merkle树
     * @returns {Promise<string>} 全局Merkle根
     */
    async updateGlobalTree() {
        const allRoots = Array.from(this.assetTrees.values()).map(tree => tree.getRoot());
        this.globalTree = new MerkleTree(allRoots);
        return await this.globalTree.buildTree();
    }
    
    /**
     * 获取全局Merkle根
     * @returns {string} 全局Merkle根
     */
    getGlobalRoot() {
        return this.globalTree.getRoot();
    }
    
    /**
     * 获取资产Merkle根
     * @param {string} assetId - 资产ID
     * @returns {string} 资产Merkle根
     */
    getAssetRoot(assetId) {
        const tree = this.assetTrees.get(assetId);
        return tree ? tree.getRoot() : null;
    }
    
    /**
     * 获取所有资产的统计信息
     * @returns {Object} 统计信息
     */
    getAllStats() {
        const stats = {
            totalAssets: this.assetTrees.size,
            globalRoot: this.globalTree.getRoot(),
            assets: {}
        };
        
        for (const [assetId, tree] of this.assetTrees) {
            stats.assets[assetId] = tree.getStats();
        }
        
        return stats;
    }
    
    /**
     * 导出所有数据
     * @returns {Object} 导出的数据
     */
    exportAll() {
        const exported = {
            globalTree: this.globalTree.export(),
            assetTrees: {},
            timestamp: new Date().toISOString()
        };
        
        for (const [assetId, tree] of this.assetTrees) {
            exported.assetTrees[assetId] = tree.export();
        }
        
        return exported;
    }
    
    /**
     * 导入数据
     * @param {Object} importedData - 导入的数据
     */
    importAll(importedData) {
        // 导入全局树
        this.globalTree.import(importedData.globalTree);
        
        // 导入资产树
        this.assetTrees.clear();
        for (const [assetId, treeData] of Object.entries(importedData.assetTrees)) {
            const tree = new MerkleTree();
            tree.import(treeData);
            this.assetTrees.set(assetId, tree);
        }
    }
}

/**
 * 数据完整性监控器
 * 定期检查数据完整性
 */
class DataIntegrityMonitor {
    constructor(merkleManager, options = {}) {
        this.merkleManager = merkleManager;
        this.options = {
            checkInterval: options.checkInterval || 60000, // 1分钟
            alertThreshold: options.alertThreshold || 3, // 连续失败3次后报警
            ...options
        };
        
        this.isRunning = false;
        this.intervalId = null;
        this.failureCount = 0;
        this.lastCheckTime = null;
        this.listeners = new Map();
    }
    
    /**
     * 开始监控
     */
    start() {
        if (this.isRunning) {
            return;
        }
        
        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.performIntegrityCheck();
        }, this.options.checkInterval);
        
        this.emit('monitorStarted', { timestamp: new Date().toISOString() });
    }
    
    /**
     * 停止监控
     */
    stop() {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.emit('monitorStopped', { timestamp: new Date().toISOString() });
    }
    
    /**
     * 执行完整性检查
     */
    async performIntegrityCheck() {
        try {
            const stats = this.merkleManager.getAllStats();
            const checkResult = {
                timestamp: new Date().toISOString(),
                globalRoot: stats.globalRoot,
                totalAssets: stats.totalAssets,
                success: true,
                details: {}
            };
            
            // 检查每个资产的完整性
            for (const [assetId, assetStats] of Object.entries(stats.assets)) {
                checkResult.details[assetId] = {
                    root: assetStats.root,
                    dataCount: assetStats.dataCount,
                    valid: assetStats.root !== null
                };
            }
            
            this.failureCount = 0;
            this.lastCheckTime = new Date();
            
            this.emit('integrityCheckPassed', checkResult);
            
        } catch (error) {
            this.failureCount++;
            
            const errorResult = {
                timestamp: new Date().toISOString(),
                error: error.message,
                failureCount: this.failureCount
            };
            
            this.emit('integrityCheckFailed', errorResult);
            
            if (this.failureCount >= this.options.alertThreshold) {
                this.emit('integrityAlert', {
                    ...errorResult,
                    message: `连续 ${this.failureCount} 次完整性检查失败`
                });
            }
        }
    }
    
    /**
     * 添加事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件监听器错误 (${event}):`, error);
                }
            });
        }
    }
    
    /**
     * 获取监控状态
     * @returns {Object} 监控状态
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            failureCount: this.failureCount,
            lastCheckTime: this.lastCheckTime,
            checkInterval: this.options.checkInterval,
            alertThreshold: this.options.alertThreshold
        };
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MerkleTree,
        RWAAssetMerkleManager,
        DataIntegrityMonitor
    };
} else if (typeof window !== 'undefined') {
    window.MerkleTree = MerkleTree;
    window.RWAAssetMerkleManager = RWAAssetMerkleManager;
    window.DataIntegrityMonitor = DataIntegrityMonitor;
}

// 使用示例
/*
// 创建RWA资产Merkle管理器
const merkleManager = new RWAAssetMerkleManager();

// 添加资产数据
const assetData = [
    { id: 'doc1', type: 'contract', hash: 'abc123' },
    { id: 'doc2', type: 'certificate', hash: 'def456' },
    { id: 'doc3', type: 'valuation', hash: 'ghi789' }
];

merkleManager.createAssetTree('asset-001', assetData)
    .then(root => {
        console.log('资产Merkle根:', root);
        
        // 生成证明
        const proof = merkleManager.generateAssetProof('asset-001', 0);
        console.log('数据证明:', proof);
        
        // 验证数据
        return merkleManager.verifyAssetData('asset-001', assetData[0], 0);
    })
    .then(isValid => {
        console.log('数据验证结果:', isValid);
    })
    .catch(error => {
        console.error('操作失败:', error);
    });

// 启动完整性监控
const monitor = new DataIntegrityMonitor(merkleManager, {
    checkInterval: 30000, // 30秒检查一次
    alertThreshold: 2
});

monitor.on('integrityCheckPassed', (result) => {
    console.log('完整性检查通过:', result);
});

monitor.on('integrityAlert', (alert) => {
    console.error('完整性警报:', alert);
});

monitor.start();
*/