// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title RWADataRegistry
 * @dev 用于RWA项目的去中心化数据注册和验证智能合约
 * @author RWA Team
 */
contract RWADataRegistry is AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // 角色定义
    bytes32 public constant DATA_MANAGER_ROLE = keccak256("DATA_MANAGER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    
    // 计数器
    Counters.Counter private _recordIdCounter;
    
    // 数据记录结构
    struct DataRecord {
        uint256 recordId;           // 记录ID
        string assetId;             // 资产ID
        string ipfsHash;            // IPFS哈希
        string arweaveId;           // Arweave ID
        bytes32 merkleRoot;         // Merkle树根
        bytes32 dataHash;           // 数据哈希
        uint256 timestamp;          // 时间戳
        address uploader;           // 上传者
        address verifier;           // 验证者
        DataStatus status;          // 状态
        uint256 version;            // 版本号
        string metadata;            // 元数据
    }
    
    // 数据状态枚举
    enum DataStatus {
        Pending,        // 待验证
        Verified,       // 已验证
        Rejected,       // 已拒绝
        Archived        // 已归档
    }
    
    // 访问控制结构
    struct AccessControl {
        mapping(address => bool) readers;     // 读取权限
        mapping(address => bool) writers;     // 写入权限
        bool isPublic;                        // 是否公开
        uint256 timelock;                     // 时间锁
    }
    
    // 审计日志结构
    struct AuditLog {
        uint256 recordId;
        address operator;
        string action;
        uint256 timestamp;
        bytes32 dataHash;
    }
    
    // 存储映射
    mapping(uint256 => DataRecord) public dataRecords;
    mapping(string => uint256[]) public assetRecords;  // 资产ID -> 记录ID数组
    mapping(bytes32 => uint256) public hashToRecordId; // 数据哈希 -> 记录ID
    mapping(uint256 => AccessControl) private accessControls;
    mapping(address => uint256[]) public uploaderRecords; // 上传者 -> 记录ID数组
    
    // 审计日志
    AuditLog[] public auditLogs;
    
    // 事件定义
    event DataRegistered(
        uint256 indexed recordId,
        string indexed assetId,
        string ipfsHash,
        string arweaveId,
        bytes32 merkleRoot,
        address indexed uploader
    );
    
    event DataVerified(
        uint256 indexed recordId,
        address indexed verifier,
        DataStatus status
    );
    
    event DataUpdated(
        uint256 indexed recordId,
        uint256 newVersion,
        bytes32 newDataHash
    );
    
    event AccessGranted(
        uint256 indexed recordId,
        address indexed user,
        string accessType
    );
    
    event AccessRevoked(
        uint256 indexed recordId,
        address indexed user,
        string accessType
    );
    
    event AuditLogAdded(
        uint256 indexed recordId,
        address indexed operator,
        string action
    );
    
    // 修饰符
    modifier onlyDataManager() {
        require(hasRole(DATA_MANAGER_ROLE, msg.sender), "Caller is not a data manager");
        _;
    }
    
    modifier onlyVerifier() {
        require(hasRole(VERIFIER_ROLE, msg.sender), "Caller is not a verifier");
        _;
    }
    
    modifier onlyAuditor() {
        require(hasRole(AUDITOR_ROLE, msg.sender), "Caller is not an auditor");
        _;
    }
    
    modifier recordExists(uint256 _recordId) {
        require(dataRecords[_recordId].timestamp > 0, "Record does not exist");
        _;
    }
    
    modifier hasReadAccess(uint256 _recordId) {
        require(
            accessControls[_recordId].isPublic ||
            accessControls[_recordId].readers[msg.sender] ||
            dataRecords[_recordId].uploader == msg.sender ||
            hasRole(AUDITOR_ROLE, msg.sender),
            "No read access"
        );
        _;
    }
    
    modifier hasWriteAccess(uint256 _recordId) {
        require(
            accessControls[_recordId].writers[msg.sender] ||
            dataRecords[_recordId].uploader == msg.sender ||
            hasRole(DATA_MANAGER_ROLE, msg.sender),
            "No write access"
        );
        _;
    }
    
    modifier notTimeLocked(uint256 _recordId) {
        require(
            accessControls[_recordId].timelock == 0 ||
            block.timestamp >= accessControls[_recordId].timelock,
            "Record is time locked"
        );
        _;
    }
    
    /**
     * @dev 构造函数
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DATA_MANAGER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
    }
    
    /**
     * @dev 注册数据记录
     * @param _assetId 资产ID
     * @param _ipfsHash IPFS哈希
     * @param _arweaveId Arweave ID
     * @param _merkleRoot Merkle树根
     * @param _metadata 元数据
     * @return recordId 记录ID
     */
    function registerData(
        string memory _assetId,
        string memory _ipfsHash,
        string memory _arweaveId,
        bytes32 _merkleRoot,
        string memory _metadata
    ) external onlyDataManager whenNotPaused nonReentrant returns (uint256) {
        require(bytes(_assetId).length > 0, "Asset ID cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(_merkleRoot != bytes32(0), "Merkle root cannot be empty");
        
        _recordIdCounter.increment();
        uint256 recordId = _recordIdCounter.current();
        
        // 计算数据哈希
        bytes32 dataHash = keccak256(
            abi.encodePacked(_assetId, _ipfsHash, _arweaveId, _merkleRoot)
        );
        
        // 检查数据是否已存在
        require(hashToRecordId[dataHash] == 0, "Data already exists");
        
        // 创建数据记录
        dataRecords[recordId] = DataRecord({
            recordId: recordId,
            assetId: _assetId,
            ipfsHash: _ipfsHash,
            arweaveId: _arweaveId,
            merkleRoot: _merkleRoot,
            dataHash: dataHash,
            timestamp: block.timestamp,
            uploader: msg.sender,
            verifier: address(0),
            status: DataStatus.Pending,
            version: 1,
            metadata: _metadata
        });
        
        // 更新映射
        assetRecords[_assetId].push(recordId);
        hashToRecordId[dataHash] = recordId;
        uploaderRecords[msg.sender].push(recordId);
        
        // 设置默认访问控制
        accessControls[recordId].writers[msg.sender] = true;
        
        // 添加审计日志
        _addAuditLog(recordId, "DATA_REGISTERED", dataHash);
        
        emit DataRegistered(recordId, _assetId, _ipfsHash, _arweaveId, _merkleRoot, msg.sender);
        
        return recordId;
    }
    
    /**
     * @dev 验证数据记录
     * @param _recordId 记录ID
     * @param _status 验证状态
     */
    function verifyData(
        uint256 _recordId,
        DataStatus _status
    ) external onlyVerifier recordExists(_recordId) {
        require(
            _status == DataStatus.Verified || _status == DataStatus.Rejected,
            "Invalid status"
        );
        require(
            dataRecords[_recordId].status == DataStatus.Pending,
            "Record already processed"
        );
        
        dataRecords[_recordId].status = _status;
        dataRecords[_recordId].verifier = msg.sender;
        
        // 添加审计日志
        _addAuditLog(_recordId, "DATA_VERIFIED", dataRecords[_recordId].dataHash);
        
        emit DataVerified(_recordId, msg.sender, _status);
    }
    
    /**
     * @dev 更新数据记录
     * @param _recordId 记录ID
     * @param _newIpfsHash 新的IPFS哈希
     * @param _newArweaveId 新的Arweave ID
     * @param _newMerkleRoot 新的Merkle树根
     * @param _newMetadata 新的元数据
     */
    function updateData(
        uint256 _recordId,
        string memory _newIpfsHash,
        string memory _newArweaveId,
        bytes32 _newMerkleRoot,
        string memory _newMetadata
    ) external recordExists(_recordId) hasWriteAccess(_recordId) notTimeLocked(_recordId) {
        DataRecord storage record = dataRecords[_recordId];
        
        // 计算新的数据哈希
        bytes32 newDataHash = keccak256(
            abi.encodePacked(record.assetId, _newIpfsHash, _newArweaveId, _newMerkleRoot)
        );
        
        // 更新记录
        record.ipfsHash = _newIpfsHash;
        record.arweaveId = _newArweaveId;
        record.merkleRoot = _newMerkleRoot;
        record.dataHash = newDataHash;
        record.metadata = _newMetadata;
        record.version += 1;
        record.status = DataStatus.Pending; // 重置为待验证状态
        record.verifier = address(0);
        
        // 更新哈希映射
        hashToRecordId[newDataHash] = _recordId;
        
        // 添加审计日志
        _addAuditLog(_recordId, "DATA_UPDATED", newDataHash);
        
        emit DataUpdated(_recordId, record.version, newDataHash);
    }
    
    /**
     * @dev 授予读取权限
     * @param _recordId 记录ID
     * @param _user 用户地址
     */
    function grantReadAccess(
        uint256 _recordId,
        address _user
    ) external recordExists(_recordId) hasWriteAccess(_recordId) {
        accessControls[_recordId].readers[_user] = true;
        
        emit AccessGranted(_recordId, _user, "READ");
    }
    
    /**
     * @dev 授予写入权限
     * @param _recordId 记录ID
     * @param _user 用户地址
     */
    function grantWriteAccess(
        uint256 _recordId,
        address _user
    ) external recordExists(_recordId) hasWriteAccess(_recordId) {
        accessControls[_recordId].writers[_user] = true;
        
        emit AccessGranted(_recordId, _user, "WRITE");
    }
    
    /**
     * @dev 撤销读取权限
     * @param _recordId 记录ID
     * @param _user 用户地址
     */
    function revokeReadAccess(
        uint256 _recordId,
        address _user
    ) external recordExists(_recordId) hasWriteAccess(_recordId) {
        accessControls[_recordId].readers[_user] = false;
        
        emit AccessRevoked(_recordId, _user, "READ");
    }
    
    /**
     * @dev 撤销写入权限
     * @param _recordId 记录ID
     * @param _user 用户地址
     */
    function revokeWriteAccess(
        uint256 _recordId,
        address _user
    ) external recordExists(_recordId) hasWriteAccess(_recordId) {
        accessControls[_recordId].writers[_user] = false;
        
        emit AccessRevoked(_recordId, _user, "WRITE");
    }
    
    /**
     * @dev 设置时间锁
     * @param _recordId 记录ID
     * @param _unlockTime 解锁时间
     */
    function setTimeLock(
        uint256 _recordId,
        uint256 _unlockTime
    ) external recordExists(_recordId) hasWriteAccess(_recordId) {
        require(_unlockTime > block.timestamp, "Unlock time must be in the future");
        
        accessControls[_recordId].timelock = _unlockTime;
        
        _addAuditLog(_recordId, "TIMELOCK_SET", bytes32(_unlockTime));
    }
    
    /**
     * @dev 设置公开访问
     * @param _recordId 记录ID
     * @param _isPublic 是否公开
     */
    function setPublicAccess(
        uint256 _recordId,
        bool _isPublic
    ) external recordExists(_recordId) hasWriteAccess(_recordId) {
        accessControls[_recordId].isPublic = _isPublic;
        
        _addAuditLog(_recordId, _isPublic ? "SET_PUBLIC" : "SET_PRIVATE", bytes32(0));
    }
    
    /**
     * @dev 获取数据记录
     * @param _recordId 记录ID
     * @return 数据记录
     */
    function getDataRecord(
        uint256 _recordId
    ) external view recordExists(_recordId) hasReadAccess(_recordId) returns (DataRecord memory) {
        return dataRecords[_recordId];
    }
    
    /**
     * @dev 获取资产的所有记录
     * @param _assetId 资产ID
     * @return 记录ID数组
     */
    function getAssetRecords(
        string memory _assetId
    ) external view returns (uint256[] memory) {
        return assetRecords[_assetId];
    }
    
    /**
     * @dev 获取上传者的所有记录
     * @param _uploader 上传者地址
     * @return 记录ID数组
     */
    function getUploaderRecords(
        address _uploader
    ) external view returns (uint256[] memory) {
        return uploaderRecords[_uploader];
    }
    
    /**
     * @dev 验证数据完整性
     * @param _recordId 记录ID
     * @param _data 要验证的数据
     * @return 是否验证通过
     */
    function verifyDataIntegrity(
        uint256 _recordId,
        bytes memory _data
    ) external view recordExists(_recordId) returns (bool) {
        bytes32 computedHash = keccak256(_data);
        return computedHash == dataRecords[_recordId].dataHash;
    }
    
    /**
     * @dev 获取审计日志数量
     * @return 审计日志数量
     */
    function getAuditLogCount() external view returns (uint256) {
        return auditLogs.length;
    }
    
    /**
     * @dev 获取审计日志
     * @param _index 索引
     * @return 审计日志
     */
    function getAuditLog(uint256 _index) external view onlyAuditor returns (AuditLog memory) {
        require(_index < auditLogs.length, "Index out of bounds");
        return auditLogs[_index];
    }
    
    /**
     * @dev 批量获取审计日志
     * @param _start 起始索引
     * @param _count 数量
     * @return 审计日志数组
     */
    function getAuditLogs(
        uint256 _start,
        uint256 _count
    ) external view onlyAuditor returns (AuditLog[] memory) {
        require(_start < auditLogs.length, "Start index out of bounds");
        
        uint256 end = _start + _count;
        if (end > auditLogs.length) {
            end = auditLogs.length;
        }
        
        AuditLog[] memory logs = new AuditLog[](end - _start);
        for (uint256 i = _start; i < end; i++) {
            logs[i - _start] = auditLogs[i];
        }
        
        return logs;
    }
    
    /**
     * @dev 暂停合约
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev 恢复合约
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev 添加审计日志
     * @param _recordId 记录ID
     * @param _action 操作
     * @param _dataHash 数据哈希
     */
    function _addAuditLog(
        uint256 _recordId,
        string memory _action,
        bytes32 _dataHash
    ) internal {
        auditLogs.push(AuditLog({
            recordId: _recordId,
            operator: msg.sender,
            action: _action,
            timestamp: block.timestamp,
            dataHash: _dataHash
        }));
        
        emit AuditLogAdded(_recordId, msg.sender, _action);
    }
    
    /**
     * @dev 获取当前记录数量
     * @return 记录数量
     */
    function getTotalRecords() external view returns (uint256) {
        return _recordIdCounter.current();
    }
    
    /**
     * @dev 检查用户是否有读取权限
     * @param _recordId 记录ID
     * @param _user 用户地址
     * @return 是否有权限
     */
    function hasReadPermission(
        uint256 _recordId,
        address _user
    ) external view recordExists(_recordId) returns (bool) {
        return accessControls[_recordId].isPublic ||
               accessControls[_recordId].readers[_user] ||
               dataRecords[_recordId].uploader == _user ||
               hasRole(AUDITOR_ROLE, _user);
    }
    
    /**
     * @dev 检查用户是否有写入权限
     * @param _recordId 记录ID
     * @param _user 用户地址
     * @return 是否有权限
     */
    function hasWritePermission(
        uint256 _recordId,
        address _user
    ) external view recordExists(_recordId) returns (bool) {
        return accessControls[_recordId].writers[_user] ||
               dataRecords[_recordId].uploader == _user ||
               hasRole(DATA_MANAGER_ROLE, _user);
    }
}