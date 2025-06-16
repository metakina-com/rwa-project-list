-- RWA项目平台数据库架构
-- 使用Cloudflare D1 SQLite数据库

-- 项目基本信息表
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    location TEXT,
    description TEXT,
    status TEXT DEFAULT '筹备中',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 项目发起方信息表
CREATE TABLE IF NOT EXISTS project_initiators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    type TEXT NOT NULL,
    company_name TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    wallet_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 项目财务信息表
CREATE TABLE IF NOT EXISTS project_financials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    asset_value DECIMAL(20,2),
    annual_revenue DECIMAL(20,2),
    annual_profit DECIMAL(20,2),
    annual_return DECIMAL(5,2),
    operation_period INTEGER,
    currency TEXT DEFAULT 'CNY',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 代币经济学表
CREATE TABLE IF NOT EXISTS project_tokenomics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    token_symbol TEXT,
    total_supply BIGINT,
    token_price DECIMAL(20,8),
    rights TEXT,
    distribution_plan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- NFT集合表
CREATE TABLE IF NOT EXISTS nft_collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    collection_name TEXT NOT NULL,
    collection_type TEXT,
    total_supply INTEGER,
    mint_price DECIMAL(20,8),
    minting_schedule TEXT,
    metadata_uri TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 合规信息表
CREATE TABLE IF NOT EXISTS project_compliance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    target_jurisdictions TEXT,
    kyc_level TEXT,
    aml_level TEXT,
    regulatory_framework TEXT,
    compliance_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password_hash TEXT,
    name TEXT,
    phone TEXT,
    wallet_address TEXT UNIQUE,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_auth_method CHECK (
        (email IS NOT NULL AND password_hash IS NOT NULL) OR 
        (wallet_address IS NOT NULL)
    )
);

-- 投资记录表
CREATE TABLE IF NOT EXISTS investments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    amount DECIMAL(20,2) NOT NULL,
    quantity DECIMAL(20,8) NOT NULL,
    unit_price DECIMAL(20,8) NOT NULL,
    token_amount DECIMAL(20,8),
    investment_type TEXT DEFAULT 'token',
    status TEXT DEFAULT 'pending',
    transaction_id TEXT,
    transaction_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    investment_id TEXT,
    type TEXT NOT NULL, -- 'purchase', 'sale', 'transfer'
    amount DECIMAL(20,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    transaction_hash TEXT,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (investment_id) REFERENCES investments(id)
);

-- 上传文件信息表
CREATE TABLE IF NOT EXISTS uploaded_files (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    category TEXT NOT NULL,
    project_id TEXT,
    upload_time TEXT NOT NULL,
    status TEXT DEFAULT 'uploaded',
    url TEXT NOT NULL,
    deleted_time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI风险评估表
CREATE TABLE IF NOT EXISTS risk_assessments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    risk_score DECIMAL(5,2),
    risk_level TEXT,
    market_risk DECIMAL(5,2),
    liquidity_risk DECIMAL(5,2),
    compliance_risk DECIMAL(5,2),
    document_risk DECIMAL(5,2),
    feasibility_score DECIMAL(5,2),
    confidence_level DECIMAL(5,2),
    assessment_data TEXT, -- JSON格式存储详细评估数据
    ai_model_version TEXT,
    recommendations TEXT, -- JSON格式存储AI建议
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_project_id ON investments(project_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_project_id ON uploaded_files(project_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_category ON uploaded_files(category);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_status ON uploaded_files(status);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_project ON risk_assessments(project_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_created_at ON risk_assessments(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- 创建触发器以自动更新时间戳
CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
    AFTER UPDATE ON projects
    BEGIN
        UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;