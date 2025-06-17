/**
 * IPFS去中心化存储集成模块
 * 为RWA项目提供去中心化文件存储功能
 */

class IPFSStorageManager {
    constructor(config = {}) {
        this.config = {
            // 默认使用Infura IPFS服务
            host: config.host || 'ipfs.infura.io',
            port: config.port || 5001,
            protocol: config.protocol || 'https',
            projectId: config.projectId || process.env.INFURA_PROJECT_ID,
            projectSecret: config.projectSecret || process.env.INFURA_PROJECT_SECRET,
            // 备用网关
            gateways: config.gateways || [
                'https://ipfs.io/ipfs/',
                'https://gateway.pinata.cloud/ipfs/',
                'https://cloudflare-ipfs.com/ipfs/'
            ]
        };
        
        this.ipfs = null;
        this.initialized = false;
    }
    
    /**
     * 初始化IPFS客户端
     */
    async initialize() {
        try {
            // 动态导入IPFS客户端
            const { create } = await import('ipfs-http-client');
            
            const auth = this.config.projectId && this.config.projectSecret 
                ? 'Basic ' + btoa(this.config.projectId + ':' + this.config.projectSecret)
                : undefined;
            
            this.ipfs = create({
                host: this.config.host,
                port: this.config.port,
                protocol: this.config.protocol,
                headers: auth ? { authorization: auth } : {}
            });
            
            // 测试连接
            await this.ipfs.id();
            this.initialized = true;
            
            console.log('IPFS客户端初始化成功');
            return true;
        } catch (error) {
            console.error('IPFS初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 上传文件到IPFS
     * @param {File|Blob|string} file - 要上传的文件
     * @param {Object} options - 上传选项
     * @returns {Promise<Object>} 上传结果
     */
    async uploadFile(file, options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        try {
            let fileData;
            let fileName = options.fileName || 'file';
            
            // 处理不同类型的输入
            if (file instanceof File) {
                fileData = new Uint8Array(await file.arrayBuffer());
                fileName = file.name;
            } else if (file instanceof Blob) {
                fileData = new Uint8Array(await file.arrayBuffer());
            } else if (typeof file === 'string') {
                fileData = new TextEncoder().encode(file);
            } else {
                fileData = new Uint8Array(file);
            }
            
            // 添加文件到IPFS
            const result = await this.ipfs.add({
                path: fileName,
                content: fileData
            }, {
                pin: options.pin !== false, // 默认固定文件
                wrapWithDirectory: options.wrapWithDirectory || false,
                progress: options.onProgress
            });
            
            const uploadResult = {
                hash: result.cid.toString(),
                path: result.path,
                size: result.size,
                fileName: fileName,
                timestamp: new Date().toISOString(),
                gateways: this.generateGatewayUrls(result.cid.toString())
            };
            
            // 触发上传完成事件
            this.dispatchEvent('fileUploaded', uploadResult);
            
            return uploadResult;
        } catch (error) {
            console.error('文件上传失败:', error);
            throw new Error(`IPFS上传失败: ${error.message}`);
        }
    }
    
    /**
     * 上传JSON数据到IPFS
     * @param {Object} data - 要上传的JSON数据
     * @param {string} fileName - 文件名
     * @returns {Promise<Object>} 上传结果
     */
    async uploadJSON(data, fileName = 'data.json') {
        const jsonString = JSON.stringify(data, null, 2);
        return await this.uploadFile(jsonString, { fileName });
    }
    
    /**
     * 批量上传文件
     * @param {Array} files - 文件数组
     * @param {Object} options - 上传选项
     * @returns {Promise<Array>} 上传结果数组
     */
    async uploadMultipleFiles(files, options = {}) {
        const results = [];
        
        for (let i = 0; i < files.length; i++) {
            try {
                const result = await this.uploadFile(files[i], {
                    ...options,
                    onProgress: (progress) => {
                        if (options.onProgress) {
                            options.onProgress({
                                fileIndex: i,
                                totalFiles: files.length,
                                fileProgress: progress,
                                overallProgress: (i / files.length) * 100
                            });
                        }
                    }
                });
                results.push(result);
            } catch (error) {
                console.error(`文件 ${i} 上传失败:`, error);
                results.push({ error: error.message, index: i });
            }
        }
        
        return results;
    }
    
    /**
     * 从IPFS获取文件
     * @param {string} hash - IPFS哈希
     * @param {Object} options - 获取选项
     * @returns {Promise<Uint8Array>} 文件数据
     */
    async getFile(hash, options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        try {
            const chunks = [];
            
            for await (const chunk of this.ipfs.cat(hash, options)) {
                chunks.push(chunk);
            }
            
            // 合并所有块
            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            
            for (const chunk of chunks) {
                result.set(chunk, offset);
                offset += chunk.length;
            }
            
            return result;
        } catch (error) {
            console.error('获取文件失败:', error);
            // 尝试从网关获取
            return await this.getFileFromGateway(hash);
        }
    }
    
    /**
     * 从网关获取文件（备用方案）
     * @param {string} hash - IPFS哈希
     * @returns {Promise<Uint8Array>} 文件数据
     */
    async getFileFromGateway(hash) {
        for (const gateway of this.config.gateways) {
            try {
                const response = await fetch(`${gateway}${hash}`);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    return new Uint8Array(arrayBuffer);
                }
            } catch (error) {
                console.warn(`网关 ${gateway} 获取失败:`, error);
            }
        }
        
        throw new Error('所有网关都无法获取文件');
    }
    
    /**
     * 获取JSON数据
     * @param {string} hash - IPFS哈希
     * @returns {Promise<Object>} JSON对象
     */
    async getJSON(hash) {
        const data = await this.getFile(hash);
        const jsonString = new TextDecoder().decode(data);
        return JSON.parse(jsonString);
    }
    
    /**
     * 固定文件到IPFS节点
     * @param {string} hash - IPFS哈希
     * @returns {Promise<boolean>} 是否成功
     */
    async pinFile(hash) {
        try {
            await this.ipfs.pin.add(hash);
            return true;
        } catch (error) {
            console.error('固定文件失败:', error);
            return false;
        }
    }
    
    /**
     * 取消固定文件
     * @param {string} hash - IPFS哈希
     * @returns {Promise<boolean>} 是否成功
     */
    async unpinFile(hash) {
        try {
            await this.ipfs.pin.rm(hash);
            return true;
        } catch (error) {
            console.error('取消固定失败:', error);
            return false;
        }
    }
    
    /**
     * 获取文件信息
     * @param {string} hash - IPFS哈希
     * @returns {Promise<Object>} 文件信息
     */
    async getFileInfo(hash) {
        try {
            const stat = await this.ipfs.files.stat(`/ipfs/${hash}`);
            return {
                hash: hash,
                size: stat.size,
                type: stat.type,
                blocks: stat.blocks,
                cumulativeSize: stat.cumulativeSize
            };
        } catch (error) {
            console.error('获取文件信息失败:', error);
            return null;
        }
    }
    
    /**
     * 生成网关URL
     * @param {string} hash - IPFS哈希
     * @returns {Array<string>} 网关URL数组
     */
    generateGatewayUrls(hash) {
        return this.config.gateways.map(gateway => `${gateway}${hash}`);
    }
    
    /**
     * 验证IPFS哈希格式
     * @param {string} hash - 要验证的哈希
     * @returns {boolean} 是否有效
     */
    isValidHash(hash) {
        // 简单的IPFS哈希验证
        const ipfsHashRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^baf[a-z0-9]{56}$/;
        return ipfsHashRegex.test(hash);
    }
    
    /**
     * 事件分发器
     * @param {string} eventType - 事件类型
     * @param {Object} data - 事件数据
     */
    dispatchEvent(eventType, data) {
        const event = new CustomEvent(`ipfs:${eventType}`, {
            detail: data
        });
        
        if (typeof window !== 'undefined') {
            window.dispatchEvent(event);
        }
    }
    
    /**
     * 清理资源
     */
    async cleanup() {
        if (this.ipfs) {
            try {
                await this.ipfs.stop();
            } catch (error) {
                console.warn('IPFS客户端停止时出错:', error);
            }
        }
        this.initialized = false;
    }
}

/**
 * RWA资产数据IPFS存储管理器
 * 专门用于处理RWA资产相关的数据存储
 */
class RWAAssetIPFSManager extends IPFSStorageManager {
    constructor(config) {
        super(config);
        this.assetRegistry = new Map();
    }
    
    /**
     * 存储RWA资产数据
     * @param {Object} assetData - 资产数据
     * @returns {Promise<Object>} 存储结果
     */
    async storeAssetData(assetData) {
        // 验证资产数据
        this.validateAssetData(assetData);
        
        // 分离敏感和非敏感数据
        const { publicData, privateData } = this.separateAssetData(assetData);
        
        // 加密私有数据
        const encryptedPrivateData = await this.encryptData(privateData);
        
        // 上传公开数据
        const publicResult = await this.uploadJSON(publicData, `asset_${assetData.id}_public.json`);
        
        // 上传加密的私有数据
        const privateResult = await this.uploadJSON(encryptedPrivateData, `asset_${assetData.id}_private.json`);
        
        // 创建资产索引
        const assetIndex = {
            assetId: assetData.id,
            publicDataHash: publicResult.hash,
            privateDataHash: privateResult.hash,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        // 上传资产索引
        const indexResult = await this.uploadJSON(assetIndex, `asset_${assetData.id}_index.json`);
        
        // 注册到本地缓存
        this.assetRegistry.set(assetData.id, {
            ...assetIndex,
            indexHash: indexResult.hash
        });
        
        return {
            assetId: assetData.id,
            indexHash: indexResult.hash,
            publicDataHash: publicResult.hash,
            privateDataHash: privateResult.hash,
            gateways: indexResult.gateways
        };
    }
    
    /**
     * 获取RWA资产数据
     * @param {string} assetId - 资产ID
     * @param {boolean} includePrivate - 是否包含私有数据
     * @returns {Promise<Object>} 资产数据
     */
    async getAssetData(assetId, includePrivate = false) {
        const registry = this.assetRegistry.get(assetId);
        if (!registry) {
            throw new Error(`资产 ${assetId} 未找到`);
        }
        
        // 获取公开数据
        const publicData = await this.getJSON(registry.publicDataHash);
        
        if (!includePrivate) {
            return publicData;
        }
        
        // 获取并解密私有数据
        const encryptedPrivateData = await this.getJSON(registry.privateDataHash);
        const privateData = await this.decryptData(encryptedPrivateData);
        
        return {
            ...publicData,
            ...privateData
        };
    }
    
    /**
     * 验证资产数据格式
     * @param {Object} assetData - 资产数据
     */
    validateAssetData(assetData) {
        const requiredFields = ['id', 'name', 'type', 'value'];
        
        for (const field of requiredFields) {
            if (!assetData[field]) {
                throw new Error(`缺少必需字段: ${field}`);
            }
        }
    }
    
    /**
     * 分离公开和私有数据
     * @param {Object} assetData - 资产数据
     * @returns {Object} 分离后的数据
     */
    separateAssetData(assetData) {
        const sensitiveFields = ['ownerInfo', 'financialDetails', 'legalDocuments', 'privateKeys'];
        
        const publicData = {};
        const privateData = {};
        
        for (const [key, value] of Object.entries(assetData)) {
            if (sensitiveFields.includes(key)) {
                privateData[key] = value;
            } else {
                publicData[key] = value;
            }
        }
        
        return { publicData, privateData };
    }
    
    /**
     * 加密数据
     * @param {Object} data - 要加密的数据
     * @returns {Promise<Object>} 加密后的数据
     */
    async encryptData(data) {
        // 这里应该使用真实的加密实现
        // 为了演示，使用简单的Base64编码
        const jsonString = JSON.stringify(data);
        const encoded = btoa(jsonString);
        
        return {
            encrypted: true,
            data: encoded,
            algorithm: 'base64', // 实际应用中应使用AES等
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * 解密数据
     * @param {Object} encryptedData - 加密的数据
     * @returns {Promise<Object>} 解密后的数据
     */
    async decryptData(encryptedData) {
        if (!encryptedData.encrypted) {
            return encryptedData;
        }
        
        // 简单的Base64解码
        const decoded = atob(encryptedData.data);
        return JSON.parse(decoded);
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IPFSStorageManager, RWAAssetIPFSManager };
} else if (typeof window !== 'undefined') {
    window.IPFSStorageManager = IPFSStorageManager;
    window.RWAAssetIPFSManager = RWAAssetIPFSManager;
}

// 使用示例
/*
// 初始化IPFS管理器
const ipfsManager = new RWAAssetIPFSManager({
    projectId: 'your-infura-project-id',
    projectSecret: 'your-infura-project-secret'
});

// 存储资产数据
const assetData = {
    id: 'asset-001',
    name: '上海写字楼A座',
    type: 'real_estate',
    value: 50000000,
    location: '上海市浦东新区',
    ownerInfo: {
        name: '张三',
        id: '310101199001011234'
    },
    financialDetails: {
        revenue: 5000000,
        expenses: 1000000
    }
};

ipfsManager.storeAssetData(assetData)
    .then(result => {
        console.log('资产数据存储成功:', result);
    })
    .catch(error => {
        console.error('存储失败:', error);
    });

// 获取资产数据
ipfsManager.getAssetData('asset-001', true)
    .then(data => {
        console.log('获取资产数据:', data);
    })
    .catch(error => {
        console.error('获取失败:', error);
    });
*/