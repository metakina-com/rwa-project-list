-- 后台管理系统扩展数据库架构
-- 在原有schema.sql基础上添加管理系统所需的表

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
    permissions TEXT, -- JSON格式存储权限列表
    last_login DATETIME,
    is_active BOOLEAN DEFAULT true,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 租户表
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    business_license TEXT, -- 营业执照号
    address TEXT,
    plan_type TEXT DEFAULT 'basic' CHECK (plan_type IN ('basic', 'professional', 'enterprise', 'custom')),
    plan_start_date DATE,
    plan_end_date DATE,
    monthly_fee DECIMAL(10,2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired', 'cancelled')),
    max_users INTEGER DEFAULT 10,
    max_projects INTEGER DEFAULT 5,
    max_storage_gb INTEGER DEFAULT 10,
    features TEXT, -- JSON格式存储可用功能列表
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 租户用户关联表
CREATE TABLE IF NOT EXISTS tenant_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, user_id)
);

-- 手续费配置表
CREATE TABLE IF NOT EXISTS fee_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fee_type TEXT NOT NULL, -- 'transaction', 'withdrawal', 'platform', 'listing'
    fee_rate DECIMAL(5,4) NOT NULL, -- 费率（百分比）
    minimum_fee DECIMAL(10,2) DEFAULT 0,
    maximum_fee DECIMAL(10,2),
    currency TEXT DEFAULT 'CNY',
    is_active BOOLEAN DEFAULT true,
    effective_from DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 手续费收入记录表
CREATE TABLE IF NOT EXISTS fee_income (
    id TEXT PRIMARY KEY,
    transaction_id TEXT,
    user_id TEXT,
    project_id TEXT,
    fee_type TEXT NOT NULL,
    fee_amount DECIMAL(10,2) NOT NULL,
    fee_rate DECIMAL(5,4),
    base_amount DECIMAL(15,2), -- 计费基数
    currency TEXT DEFAULT 'CNY',
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 系统功能模块表
CREATE TABLE IF NOT EXISTS system_functions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    module_path TEXT, -- 功能模块路径
    icon TEXT, -- 图标类名
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    version TEXT,
    dependencies TEXT, -- JSON格式存储依赖关系
    config TEXT, -- JSON格式存储配置信息
    is_core BOOLEAN DEFAULT false, -- 是否为核心功能
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 功能权限表
CREATE TABLE IF NOT EXISTS function_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    function_id TEXT NOT NULL,
    tenant_id TEXT,
    user_role TEXT,
    permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'write', 'execute', 'admin')),
    is_granted BOOLEAN DEFAULT true,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    granted_by TEXT, -- 授权人ID
    FOREIGN KEY (function_id) REFERENCES system_functions(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 课程分类表
CREATE TABLE IF NOT EXISTS course_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_id TEXT, -- 支持多级分类
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES course_categories(id)
);

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category_id TEXT,
    instructor_id TEXT, -- 讲师用户ID
    instructor_name TEXT,
    cover_image TEXT, -- 封面图片URL
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    duration_minutes INTEGER, -- 课程时长（分钟）
    price DECIMAL(10,2) DEFAULT 0, -- 课程价格
    currency TEXT DEFAULT 'CNY',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_free BOOLEAN DEFAULT false,
    enrollment_limit INTEGER, -- 报名人数限制
    prerequisites TEXT, -- JSON格式存储前置课程要求
    learning_objectives TEXT, -- JSON格式存储学习目标
    tags TEXT, -- JSON格式存储标签
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES course_categories(id),
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- 课程章节表
CREATE TABLE IF NOT EXISTS course_chapters (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    duration_minutes INTEGER,
    is_free BOOLEAN DEFAULT false, -- 是否免费试看
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 课程内容表（视频、文档等）
CREATE TABLE IF NOT EXISTS course_contents (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'document', 'quiz', 'assignment')),
    content_url TEXT, -- 内容文件URL
    content_text TEXT, -- 文本内容
    duration_minutes INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES course_chapters(id) ON DELETE CASCADE
);

-- 课程报名表
CREATE TABLE IF NOT EXISTS course_enrollments (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    last_accessed DATETIME,
    certificate_issued BOOLEAN DEFAULT false,
    certificate_url TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(course_id, user_id)
);

-- 学习进度表
CREATE TABLE IF NOT EXISTS learning_progress (
    id TEXT PRIMARY KEY,
    enrollment_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    completion_time DATETIME,
    time_spent_minutes INTEGER DEFAULT 0,
    last_position INTEGER DEFAULT 0, -- 视频播放位置等
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES course_contents(id) ON DELETE CASCADE,
    UNIQUE(enrollment_id, content_id)
);

-- 资源库分类表
CREATE TABLE IF NOT EXISTS resource_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_id TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES resource_categories(id)
);

-- 资源库表
CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category_id TEXT,
    file_type TEXT, -- 'document', 'image', 'video', 'template', 'dataset'
    file_url TEXT NOT NULL,
    file_size INTEGER, -- 文件大小（字节）
    mime_type TEXT,
    thumbnail_url TEXT, -- 缩略图URL
    download_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false, -- 是否公开
    tags TEXT, -- JSON格式存储标签
    metadata TEXT, -- JSON格式存储元数据
    uploaded_by TEXT, -- 上传者用户ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES resource_categories(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 资源访问权限表
CREATE TABLE IF NOT EXISTS resource_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id TEXT NOT NULL,
    user_id TEXT,
    tenant_id TEXT,
    permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'download', 'edit', 'delete')),
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- 是否为公开设置
    updated_by TEXT, -- 更新者ID
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 操作类型
    target_type TEXT, -- 操作对象类型（user, project, tenant等）
    target_id TEXT, -- 操作对象ID
    details TEXT, -- JSON格式存储操作详情
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- 系统通知表
CREATE TABLE IF NOT EXISTS system_notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    target_type TEXT DEFAULT 'all' CHECK (target_type IN ('all', 'admins', 'users', 'tenants')),
    target_ids TEXT, -- JSON格式存储目标ID列表
    is_read BOOLEAN DEFAULT false,
    expires_at DATETIME,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admins(id)
);

-- 数据备份记录表
CREATE TABLE IF NOT EXISTS backup_records (
    id TEXT PRIMARY KEY,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'manual')),
    file_path TEXT NOT NULL,
    file_size INTEGER,
    status TEXT DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    created_by TEXT,
    notes TEXT,
    FOREIGN KEY (created_by) REFERENCES admins(id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan_type ON tenants(plan_type);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_fee_settings_type ON fee_settings(fee_type);
CREATE INDEX IF NOT EXISTS idx_fee_income_date ON fee_income(collected_at);
CREATE INDEX IF NOT EXISTS idx_fee_income_type ON fee_income(fee_type);
CREATE INDEX IF NOT EXISTS idx_system_functions_status ON system_functions(status);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(file_type);
CREATE INDEX IF NOT EXISTS idx_resources_public ON resources(is_public);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_date ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_notifications_type ON system_notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_system_notifications_read ON system_notifications(is_read);

-- 创建触发器以自动更新时间戳
CREATE TRIGGER IF NOT EXISTS update_admins_timestamp 
    AFTER UPDATE ON admins
    BEGIN
        UPDATE admins SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_tenants_timestamp 
    AFTER UPDATE ON tenants
    BEGIN
        UPDATE tenants SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_fee_settings_timestamp 
    AFTER UPDATE ON fee_settings
    BEGIN
        UPDATE fee_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_system_functions_timestamp 
    AFTER UPDATE ON system_functions
    BEGIN
        UPDATE system_functions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_courses_timestamp 
    AFTER UPDATE ON courses
    BEGIN
        UPDATE courses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_resources_timestamp 
    AFTER UPDATE ON resources
    BEGIN
        UPDATE resources SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- 插入默认数据

-- 默认管理员账户
INSERT OR IGNORE INTO admins (id, username, email, password_hash, name, role, permissions) VALUES 
('admin_001', 'admin', 'admin@yuanhua-rwa.com', 'hashed_password_here', '系统管理员', 'super_admin', '["all"]');

-- 默认手续费设置
INSERT OR IGNORE INTO fee_settings (fee_type, fee_rate, minimum_fee, currency) VALUES 
('transaction', 0.005, 10.00, 'CNY'),
('withdrawal', 0.01, 20.00, 'CNY'),
('platform', 0.02, 50.00, 'CNY'),
('listing', 0.001, 100.00, 'CNY');

-- 默认系统功能
INSERT OR IGNORE INTO system_functions (id, name, description, status, is_core) VALUES 
('func_user_auth', '用户认证', 'KYC/AML用户身份验证系统', 'active', true),
('func_smart_contract', '智能合约', '自动化合约执行引擎', 'active', true),
('func_risk_assessment', '风险评估', 'AI驱动的项目风险分析', 'active', true),
('func_payment_gateway', '支付网关', '多种支付方式集成', 'active', true),
('func_document_management', '文档管理', '项目文档上传和管理', 'active', false),
('func_notification_system', '通知系统', '系统消息和邮件通知', 'active', false);

-- 默认课程分类
INSERT OR IGNORE INTO course_categories (id, name, description) VALUES 
('cat_basic', '基础课程', 'RWA和区块链基础知识'),
('cat_advanced', '进阶课程', '高级投资策略和风险管理'),
('cat_technical', '技术课程', '智能合约和技术实现'),
('cat_legal', '法律法规', '合规和法律相关课程');

-- 默认资源分类
INSERT OR IGNORE INTO resource_categories (id, name, description, icon) VALUES 
('res_documents', '文档资料', '各类文档和资料', 'fa-file-alt'),
('res_templates', '模板文件', '项目模板和表格', 'fa-file-contract'),
('res_images', '图片素材', '图片和设计素材', 'fa-image'),
('res_videos', '视频资源', '教学和宣传视频', 'fa-video'),
('res_datasets', '数据集', '分析用数据集', 'fa-database');

-- 默认系统设置
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES 
('system_name', '元话RWA数字投行', 'string', '系统名称', true),
('system_version', 'v1.0.0', 'string', '系统版本', true),
('contact_email', 'admin@yuanhua-rwa.com', 'string', '联系邮箱', true),
('support_phone', '+86-400-123-4567', 'string', '客服电话', true),
('max_file_size_mb', '100', 'number', '最大文件上传大小(MB)', false),
('session_timeout_minutes', '30', 'number', '会话超时时间(分钟)', false),
('enable_two_factor', 'false', 'boolean', '启用双因素认证', false),
('backup_retention_days', '30', 'number', '备份保留天数', false);