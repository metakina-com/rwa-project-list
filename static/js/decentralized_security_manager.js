/**
 * 去中心化安全管理器
 * 集成IPFS存储、Merkle树验证、区块链锚定等功能
 * 为RWA项目提供完整的去中心化数据安全解决方案
 */

class DecentralizedSecurityManager {
    constructor(config = {}) {
        this.config = {
            // IPFS配置
            ipfs: {
                host: config.ipfs?.host || 'ipfs.infura.io',
                port: config.ipfs?.port || 5001,
                protocol: config.ipfs?.protocol || 'https',
                projectId: config.ipfs?.projectId,
                projectSecret: config.ipfs?.projectSecret
            },
            // 区块链配置
            blockchain: {
                network: config.blockchain?.network || 'ethereum',
                contractAddress: config.blockchain?.contractAddress,
                privateKey: config.blockchain?.privateKey,
                rpcUrl: config.blockchain?.rpcUrl
            },
            // 加密配置
            encryption: {
                algorithm: config.encryption?.algorithm || 'AES-GCM',
                keyLength: config.encryption?.keyLength || 256
            },
            // 监控配置
            monitoring: {
                enabled: config.monitoring?.enabled !== false,
                interval: config.monitoring?.interval || 60000,
                alertThreshold: config.monitoring?.alertThreshold || 3
            }
        };
        
        // 初始化组件
        this.ipfsManager = null;
        this.merkleManager = null;
        this.blockchainClient = null;
        this.encryptionManager = null;
        this.integrityMonitor = null;
        
        this.initialized = false;
        this.eventListeners = new Map();
    }
    
    /**
     * 初始化所有组件
     */
    async initialize() {
        try {
            console.log('初始化去中心化安全管理器...');
            
            // 初始化IPFS管理器
            if (typeof RWAAssetIPFSManager !== 'undefined') {
                this.ipfsManager = new RWAAssetIPFSManager(this.config.ipfs);
                await this.ipfsManager.initialize();
                console.log('✓ IPFS管理器初始化完成');
            }
            
            // 初始化Merkle树管理器
            if (typeof RWAAssetMerkleManager !== 'undefined') {
                this.merkleManager = new RWAAssetMerkleManager();
                console.log('✓ Merkle树管理器初始化完成');
            }
            
            // 初始化加密管理器
            this.encryptionManager = new DataEncryptionManager(this.config.encryption);
            console.log('✓ 加密管理器初始化完成');
            
            // 初始化区块链客户端
            if (this.config.blockchain.contractAddress) {
                this.blockchainClient = new BlockchainDataClient(this.config.blockchain);
                await this.blockchainClient.initialize();
                console.log('✓ 区块链客户端初始化完成');
            }
            
            // 初始化完整性监控
            if (this.config.monitoring.enabled && this.merkleManager) {
                this.integrityMonitor = new DataIntegrityMonitor(
                    this.merkleManager,
                    this.config.monitoring
                );
                this.setupMonitoringEvents();
                console.log('✓ 完整性监控初始化完成');
            }
            
            this.initialized = true;
            this.emit('initialized', { timestamp: new Date().toISOString() });
            
            console.log('🎉 去中心化安全管理器初始化成功');
            return true;
            
        } catch (error) {
            console.error('初始化失败:', error);
            this.emit('initializationError', { error: error.message });
            throw error;
        }
    }
    
    /**
     * 安全存储RWA资产数据
     * @param {Object} assetData - 资产数据
     * @param {Object} options - 存储选项
     * @returns {Promise<Object>} 存储结果
     */
    async secureStoreAsset(assetData, options = {}) {
        if (!this.initialized) {
            throw new Error('管理器未初始化');
        }
        
        try {
            console.log(`开始安全存储资产: ${assetData.id}`);
            
            // 1. 数据验证
            this.validateAssetData(assetData);
            
            // 2. 数据分类和加密
            const { publicData, encryptedPrivateData } = await this.processAssetData(assetData);
            
            // 3. 生成Merkle树
            const merkleRoot = await this.generateMerkleProof(assetData);
            
            // 4. 存储到IPFS
            const ipfsResults = await this.storeToIPFS({
                publicData,
                encryptedPrivateData,
                merkleRoot
            });
            
            // 5. 可选：存储到Arweave（永久存储）
            let arweaveId = null;
            if (options.permanentStorage) {
                arweaveId = await this.storeToArweave(publicData);
            }
            
            // 6. 区块链锚定
            let blockchainRecord = null;
            if (this.blockchainClient) {
                blockchainRecord = await this.anchorToBlockchain({
                    assetId: assetData.id,
                    ipfsHash: ipfsResults.publicDataHash,
                    arweaveId,
                    merkleRoot
                });
            }
            
            // 7. 构建存储结果
            const result = {
                assetId: assetData.id,
                timestamp: new Date().toISOString(),
                storage: {
                    ipfs: {
                        publicDataHash: ipfsResults.publicDataHash,
                        privateDataHash: ipfsResults.privateDataHash,
                        gateways: ipfsResults.gateways
                    },
                    arweave: arweaveId ? { id: arweaveId } : null,
                    blockchain: blockchainRecord
                },
                security: {
                    merkleRoot,
                    encrypted: true,
                    algorithm: this.config.encryption.algorithm
                },
                verification: {
                    proofs: await this.generateVerificationProofs(assetData.id),
                    checksums: await this.generateChecksums(assetData)
                }
            };
            
            // 8. 触发事件
            this.emit('assetStored', result);
            
            console.log(`✓ 资产 ${assetData.id} 安全存储完成`);
            return result;
            
        } catch (error) {
            console.error(`资产存储失败: ${error.message}`);
            this.emit('storageError', { assetId: assetData.id, error: error.message });
            throw error;
        }
    }
    
    /**
     * 安全检索RWA资产数据
     * @param {string} assetId - 资产ID
     * @param {Object} options - 检索选项
     * @returns {Promise<Object>} 资产数据
     */
    async secureRetrieveAsset(assetId, options = {}) {
        if (!this.initialized) {
            throw new Error('管理器未初始化');
        }
        
        try {
            console.log(`开始检索资产: ${assetId}`);
            
            // 1. 从区块链获取存储信息
            let storageInfo = null;
            if (this.blockchainClient) {
                storageInfo = await this.blockchainClient.getAssetRecord(assetId);
            }
            
            // 2. 从IPFS检索数据
            const retrievedData = await this.retrieveFromIPFS(assetId, storageInfo);
            
            // 3. 验证数据完整性
            const integrityCheck = await this.verifyDataIntegrity(assetId, retrievedData);
            if (!integrityCheck.valid) {
                throw new Error(`数据完整性验证失败: ${integrityCheck.reason}`);
            }
            
            // 4. 解密私有数据（如果需要）
            let decryptedData = retrievedData.publicData;
            if (options.includePrivate && retrievedData.encryptedPrivateData) {
                const privateData = await this.encryptionManager.decrypt(
                    retrievedData.encryptedPrivateData
                );
                decryptedData = { ...decryptedData, ...privateData };
            }
            
            // 5. 构建检索结果
            const result = {
                assetId,
                data: decryptedData,
                metadata: {
                    retrievedAt: new Date().toISOString(),
                    integrityVerified: integrityCheck.valid,
                    source: storageInfo ? 'blockchain+ipfs' : 'ipfs',
                    version: retrievedData.version || 1
                }
            };
            
            this.emit('assetRetrieved', result);
            
            console.log(`✓ 资产 ${assetId} 检索完成`);
            return result;
            
        } catch (error) {
            console.error(`资产检索失败: ${error.message}`);
            this.emit('retrievalError', { assetId, error: error.message });
            throw error;
        }
    }
    
    /**
     * 验证资产数据完整性
     * @param {string} assetId - 资产ID
     * @param {Object} data - 要验证的数据
     * @returns {Promise<Object>} 验证结果
     */
    async verifyDataIntegrity(assetId, data) {
        try {
            const results = {
                valid: true,
                checks: {},
                reason: null
            };
            
            // 1. Merkle树验证
            if (this.merkleManager && data.merkleRoot) {
                const merkleValid = await this.merkleManager.verifyAssetData(
                    assetId,
                    data.publicData,
                    0
                );
                results.checks.merkle = merkleValid;
                if (!merkleValid) {
                    results.valid = false;
                    results.reason = 'Merkle树验证失败';
                }
            }
            
            // 2. 哈希校验
            if (data.checksums) {
                const currentChecksums = await this.generateChecksums(data.publicData);
                const hashValid = currentChecksums.sha256 === data.checksums.sha256;
                results.checks.hash = hashValid;
                if (!hashValid) {
                    results.valid = false;
                    results.reason = '哈希校验失败';
                }
            }
            
            // 3. 区块链验证
            if (this.blockchainClient && data.blockchainRecord) {
                const blockchainValid = await this.blockchainClient.verifyRecord(
                    data.blockchainRecord.recordId
                );
                results.checks.blockchain = blockchainValid;
                if (!blockchainValid) {
                    results.valid = false;
                    results.reason = '区块链验证失败';
                }
            }
            
            return results;
            
        } catch (error) {
            return {
                valid: false,
                checks: {},
                reason: `验证过程出错: ${error.message}`
            };
        }
    }
    
    /**
     * 处理资产数据（分类和加密）
     * @param {Object} assetData - 原始资产数据
     * @returns {Promise<Object>} 处理后的数据
     */
    async processAssetData(assetData) {
        // 分离公开和私有数据
        const { publicData, privateData } = this.separateAssetData(assetData);
        
        // 加密私有数据
        const encryptedPrivateData = await this.encryptionManager.encrypt(privateData);
        
        return {
            publicData,
            encryptedPrivateData
        };
    }
    
    /**
     * 分离公开和私有数据
     * @param {Object} assetData - 资产数据
     * @returns {Object} 分离后的数据
     */
    separateAssetData(assetData) {
        const sensitiveFields = [
            'ownerInfo',
            'financialDetails',
            'legalDocuments',
            'privateKeys',
            'personalData',
            'bankDetails',
            'taxInfo'
        ];
        
        const publicData = {};
        const privateData = {};
        
        for (const [key, value] of Object.entries(assetData)) {
            if (sensitiveFields.includes(key) || key.startsWith('private_')) {
                privateData[key] = value;
            } else {
                publicData[key] = value;
            }
        }
        
        return { publicData, privateData };
    }
    
    /**
     * 生成Merkle证明
     * @param {Object} assetData - 资产数据
     * @returns {Promise<string>} Merkle根
     */
    async generateMerkleProof(assetData) {
        if (!this.merkleManager) {
            return null;
        }
        
        // 将资产数据转换为数组格式
        const dataArray = Object.entries(assetData).map(([key, value]) => ({
            key,
            value,
            timestamp: new Date().toISOString()
        }));
        
        return await this.merkleManager.createAssetTree(assetData.id, dataArray);
    }
    
    /**
     * 存储到IPFS
     * @param {Object} data - 要存储的数据
     * @returns {Promise<Object>} 存储结果
     */
    async storeToIPFS(data) {
        if (!this.ipfsManager) {
            throw new Error('IPFS管理器未初始化');
        }
        
        const publicResult = await this.ipfsManager.uploadJSON(
            data.publicData,
            `public_${Date.now()}.json`
        );
        
        const privateResult = await this.ipfsManager.uploadJSON(
            data.encryptedPrivateData,
            `private_${Date.now()}.json`
        );
        
        return {
            publicDataHash: publicResult.hash,
            privateDataHash: privateResult.hash,
            gateways: publicResult.gateways
        };
    }
    
    /**
     * 从IPFS检索数据
     * @param {string} assetId - 资产ID
     * @param {Object} storageInfo - 存储信息
     * @returns {Promise<Object>} 检索到的数据
     */
    async retrieveFromIPFS(assetId, storageInfo) {
        if (!this.ipfsManager) {
            throw new Error('IPFS管理器未初始化');
        }
        
        // 这里需要根据实际的存储信息结构来调整
        const publicDataHash = storageInfo?.ipfsHash || storageInfo?.storage?.ipfs?.publicDataHash;
        const privateDataHash = storageInfo?.storage?.ipfs?.privateDataHash;
        
        if (!publicDataHash) {
            throw new Error('未找到IPFS存储信息');
        }
        
        const publicData = await this.ipfsManager.getJSON(publicDataHash);
        let encryptedPrivateData = null;
        
        if (privateDataHash) {
            try {
                encryptedPrivateData = await this.ipfsManager.getJSON(privateDataHash);
            } catch (error) {
                console.warn('获取私有数据失败:', error.message);
            }
        }
        
        return {
            publicData,
            encryptedPrivateData,
            merkleRoot: storageInfo?.merkleRoot
        };
    }
    
    /**
     * 锚定到区块链
     * @param {Object} data - 要锚定的数据
     * @returns {Promise<Object>} 区块链记录
     */
    async anchorToBlockchain(data) {
        if (!this.blockchainClient) {
            return null;
        }
        
        return await this.blockchainClient.registerData(
            data.assetId,
            data.ipfsHash,
            data.arweaveId || '',
            data.merkleRoot
        );
    }
    
    /**
     * 生成验证证明
     * @param {string} assetId - 资产ID
     * @returns {Promise<Object>} 验证证明
     */
    async generateVerificationProofs(assetId) {
        const proofs = {};
        
        if (this.merkleManager) {
            try {
                proofs.merkle = this.merkleManager.generateAssetProof(assetId, 0);
            } catch (error) {
                console.warn('生成Merkle证明失败:', error.message);
            }
        }
        
        return proofs;
    }
    
    /**
     * 生成数据校验和
     * @param {Object} data - 数据
     * @returns {Promise<Object>} 校验和
     */
    async generateChecksums(data) {
        const dataString = JSON.stringify(data, Object.keys(data).sort());
        
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(dataString);
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            const sha256 = Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            
            return { sha256 };
        }
        
        // Fallback for environments without crypto.subtle
        return { sha256: btoa(dataString) };
    }
    
    /**
     * 验证资产数据格式
     * @param {Object} assetData - 资产数据
     */
    validateAssetData(assetData) {
        const requiredFields = ['id', 'name', 'type'];
        
        for (const field of requiredFields) {
            if (!assetData[field]) {
                throw new Error(`缺少必需字段: ${field}`);
            }
        }
        
        if (typeof assetData.id !== 'string' || assetData.id.length === 0) {
            throw new Error('资产ID必须是非空字符串');
        }
    }
    
    /**
     * 设置监控事件
     */
    setupMonitoringEvents() {
        if (!this.integrityMonitor) return;
        
        this.integrityMonitor.on('integrityCheckPassed', (result) => {
            this.emit('integrityCheckPassed', result);
        });
        
        this.integrityMonitor.on('integrityCheckFailed', (result) => {
            this.emit('integrityCheckFailed', result);
        });
        
        this.integrityMonitor.on('integrityAlert', (alert) => {
            this.emit('integrityAlert', alert);
        });
    }
    
    /**
     * 启动监控
     */
    startMonitoring() {
        if (this.integrityMonitor) {
            this.integrityMonitor.start();
            console.log('✓ 数据完整性监控已启动');
        }
    }
    
    /**
     * 停止监控
     */
    stopMonitoring() {
        if (this.integrityMonitor) {
            this.integrityMonitor.stop();
            console.log('✓ 数据完整性监控已停止');
        }
    }
    
    /**
     * 获取系统状态
     * @returns {Object} 系统状态
     */
    getSystemStatus() {
        return {
            initialized: this.initialized,
            components: {
                ipfs: !!this.ipfsManager,
                merkle: !!this.merkleManager,
                blockchain: !!this.blockchainClient,
                encryption: !!this.encryptionManager,
                monitoring: !!this.integrityMonitor
            },
            monitoring: this.integrityMonitor ? this.integrityMonitor.getStatus() : null,
            config: {
                network: this.config.blockchain.network,
                encryptionAlgorithm: this.config.encryption.algorithm,
                monitoringEnabled: this.config.monitoring.enabled
            }
        };
    }
    
    /**
     * 添加事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const callbacks = this.eventListeners.get(event);
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
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件监听器错误 (${event}):`, error);
                }
            });
        }
    }
    
    /**
     * 清理资源
     */
    async cleanup() {
        console.log('清理去中心化安全管理器资源...');
        
        if (this.integrityMonitor) {
            this.integrityMonitor.stop();
        }
        
        if (this.ipfsManager) {
            await this.ipfsManager.cleanup();
        }
        
        if (this.blockchainClient) {
            await this.blockchainClient.cleanup();
        }
        
        this.eventListeners.clear();
        this.initialized = false;
        
        console.log('✓ 资源清理完成');
    }
}

/**
 * 数据加密管理器
 */
class DataEncryptionManager {
    constructor(config = {}) {
        this.algorithm = config.algorithm || 'AES-GCM';
        this.keyLength = config.keyLength || 256;
        this.keys = new Map();
    }
    
    /**
     * 生成加密密钥
     * @returns {Promise<CryptoKey>} 加密密钥
     */
    async generateKey() {
        return await crypto.subtle.generateKey(
            {
                name: this.algorithm,
                length: this.keyLength
            },
            true,
            ['encrypt', 'decrypt']
        );
    }
    
    /**
     * 加密数据
     * @param {Object} data - 要加密的数据
     * @param {CryptoKey} key - 加密密钥（可选）
     * @returns {Promise<Object>} 加密结果
     */
    async encrypt(data, key = null) {
        if (!key) {
            key = await this.generateKey();
        }
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(JSON.stringify(data));
        
        const encrypted = await crypto.subtle.encrypt(
            {
                name: this.algorithm,
                iv: iv
            },
            key,
            encodedData
        );
        
        // 导出密钥用于存储
        const exportedKey = await crypto.subtle.exportKey('raw', key);
        
        return {
            encrypted: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv),
            key: Array.from(new Uint8Array(exportedKey)),
            algorithm: this.algorithm,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * 解密数据
     * @param {Object} encryptedData - 加密的数据
     * @returns {Promise<Object>} 解密后的数据
     */
    async decrypt(encryptedData) {
        // 导入密钥
        const key = await crypto.subtle.importKey(
            'raw',
            new Uint8Array(encryptedData.key),
            { name: this.algorithm },
            false,
            ['decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
            {
                name: this.algorithm,
                iv: new Uint8Array(encryptedData.iv)
            },
            key,
            new Uint8Array(encryptedData.encrypted)
        );
        
        const jsonString = new TextDecoder().decode(decrypted);
        return JSON.parse(jsonString);
    }
}

/**
 * 区块链数据客户端
 */
class BlockchainDataClient {
    constructor(config) {
        this.config = config;
        this.web3 = null;
        this.contract = null;
        this.initialized = false;
    }
    
    /**
     * 初始化区块链客户端
     */
    async initialize() {
        // 这里需要根据实际的Web3库来实现
        // 示例实现
        console.log('初始化区块链客户端...');
        this.initialized = true;
    }
    
    /**
     * 注册数据到区块链
     * @param {string} assetId - 资产ID
     * @param {string} ipfsHash - IPFS哈希
     * @param {string} arweaveId - Arweave ID
     * @param {string} merkleRoot - Merkle根
     * @returns {Promise<Object>} 区块链记录
     */
    async registerData(assetId, ipfsHash, arweaveId, merkleRoot) {
        // 模拟区块链交易
        return {
            recordId: `record_${Date.now()}`,
            transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            blockNumber: Math.floor(Math.random() * 1000000),
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * 获取资产记录
     * @param {string} assetId - 资产ID
     * @returns {Promise<Object>} 资产记录
     */
    async getAssetRecord(assetId) {
        // 模拟从区块链获取记录
        return null;
    }
    
    /**
     * 验证记录
     * @param {string} recordId - 记录ID
     * @returns {Promise<boolean>} 验证结果
     */
    async verifyRecord(recordId) {
        // 模拟验证
        return true;
    }
    
    /**
     * 清理资源
     */
    async cleanup() {
        this.initialized = false;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DecentralizedSecurityManager,
        DataEncryptionManager,
        BlockchainDataClient
    };
} else if (typeof window !== 'undefined') {
    window.DecentralizedSecurityManager = DecentralizedSecurityManager;
    window.DataEncryptionManager = DataEncryptionManager;
    window.BlockchainDataClient = BlockchainDataClient;
}

// 使用示例
/*
// 初始化去中心化安全管理器
const securityManager = new DecentralizedSecurityManager({
    ipfs: {
        projectId: 'your-infura-project-id',
        projectSecret: 'your-infura-project-secret'
    },
    blockchain: {
        network: 'ethereum',
        contractAddress: '0x...',
        rpcUrl: 'https://mainnet.infura.io/v3/...'
    },
    monitoring: {
        enabled: true,
        interval: 30000
    }
});

// 初始化
securityManager.initialize()
    .then(() => {
        console.log('安全管理器初始化成功');
        
        // 启动监控
        securityManager.startMonitoring();
        
        // 存储资产
        const assetData = {
            id: 'asset-001',
            name: '上海写字楼A座',
            type: 'real_estate',
            value: 50000000,
            ownerInfo: {
                name: '张三',
                id: '310101199001011234'
            }
        };
        
        return securityManager.secureStoreAsset(assetData);
    })
    .then(result => {
        console.log('资产存储成功:', result);
        
        // 检索资产
        return securityManager.secureRetrieveAsset('asset-001', {
            includePrivate: true
        });
    })
    .then(asset => {
        console.log('资产检索成功:', asset);
    })
    .catch(error => {
        console.error('操作失败:', error);
    });

// 监听事件
securityManager.on('assetStored', (result) => {
    console.log('资产存储事件:', result);
});

securityManager.on('integrityAlert', (alert) => {
    console.error('完整性警报:', alert);
});
*/