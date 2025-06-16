-- RWA项目平台种子数据
-- 用于初始化数据库的示例数据

-- 插入示例项目
INSERT OR IGNORE INTO projects (id, name, type, asset_type, location, description, status) VALUES
('RWA001', '上海国际金融中心 Phase II', '房地产', '商业地产', '上海市浦东新区', '位于上海陆家嘴核心区域的甲级写字楼项目，总建筑面积15万平方米', '运营中'),
('RWA002', '深圳湾科技园区', '房地产', '产业园区', '深圳市南山区', '高科技产业园区，专注于人工智能和生物科技企业', '筹备中'),
('RWA003', '新能源汽车充电网络', '基础设施', '充电设施', '全国', '覆盖一二线城市的新能源汽车充电网络建设项目', '建设中'),
('RWA004', '绿色能源风电场', '能源', '风力发电', '内蒙古', '装机容量200MW的风力发电项目，年发电量约4亿千瓦时', '运营中'),
('RWA005', '智慧物流仓储中心', '物流', '仓储设施', '江苏省苏州市', '现代化智能仓储物流中心，服务长三角地区', '筹备中');

-- 插入项目发起方信息
INSERT OR IGNORE INTO project_initiators (project_id, type, company_name, contact_person, contact_phone, contact_email, wallet_address) VALUES
('RWA001', '开发商', '上海陆家嘴集团', '张经理', '13800138001', 'zhang@ljz.com', '0x1234567890123456789012345678901234567890'),
('RWA002', '投资机构', '深圳湾投资', '李总监', '13800138002', 'li@szb.com', '0x2345678901234567890123456789012345678901'),
('RWA003', '运营商', '绿色出行科技', '王总', '13800138003', 'wang@greengo.com', '0x3456789012345678901234567890123456789012'),
('RWA004', '能源公司', '北方新能源', '刘董事长', '13800138004', 'liu@northgreen.com', '0x4567890123456789012345678901234567890123'),
('RWA005', '物流公司', '智慧供应链', '陈总经理', '13800138005', 'chen@smartsc.com', '0x5678901234567890123456789012345678901234');

-- 插入项目财务信息
INSERT OR IGNORE INTO project_financials (project_id, asset_value, annual_revenue, annual_profit, annual_return, operation_period) VALUES
('RWA001', 2500000000.00, 180000000.00, 120000000.00, 7.2, 20),
('RWA002', 1800000000.00, 150000000.00, 90000000.00, 8.5, 15),
('RWA003', 800000000.00, 120000000.00, 60000000.00, 9.2, 10),
('RWA004', 1200000000.00, 160000000.00, 100000000.00, 8.8, 25),
('RWA005', 600000000.00, 80000000.00, 45000000.00, 9.5, 12);

-- 插入代币经济学信息
INSERT OR IGNORE INTO project_tokenomics (project_id, token_symbol, total_supply, token_price, rights, distribution_plan) VALUES
('RWA001', 'SHFC', 25000000, 100.00, '收益分红权,治理投票权', '40%公开发售,30%机构投资,20%团队锁仓,10%生态激励'),
('RWA002', 'SZTP', 18000000, 100.00, '收益分红权,优先认购权', '50%公开发售,25%战略投资,15%团队,10%社区'),
('RWA003', 'NEVC', 8000000, 100.00, '使用权益,收益分红', '60%公开发售,20%运营储备,15%团队,5%顾问'),
('RWA004', 'WIND', 12000000, 100.00, '电力收益权,碳积分权', '45%公开发售,30%机构,20%运营,5%激励'),
('RWA005', 'SMART', 6000000, 100.00, '仓储使用权,收益分红', '55%公开发售,25%合作伙伴,15%团队,5%社区');

-- 插入合规信息
INSERT OR IGNORE INTO project_compliance (project_id, target_jurisdictions, kyc_level, aml_level, regulatory_framework, compliance_status) VALUES
('RWA001', '中国大陆,香港', 'Enhanced', 'Standard', 'CSRC,SFC', 'approved'),
('RWA002', '中国大陆', 'Standard', 'Standard', 'CSRC', 'pending'),
('RWA003', '中国大陆', 'Enhanced', 'Enhanced', 'NDRC,CSRC', 'approved'),
('RWA004', '中国大陆', 'Standard', 'Standard', 'NEA,CSRC', 'approved'),
('RWA005', '中国大陆,新加坡', 'Enhanced', 'Standard', 'CSRC,MAS', 'pending');

-- 插入示例用户数据（包含密码哈希）
-- 注意：这些是示例密码的哈希值，实际部署时应使用更安全的密码
-- 密码 'password123' 的简单哈希示例（实际应使用bcrypt等安全哈希）
INSERT OR IGNORE INTO users (id, email, wallet_address, name, phone, kyc_status, password_hash) VALUES
('USER001', 'investor1@example.com', '0xabcdef1234567890123456789012345678901234', '张投资', '13900139001', 'approved', '$2b$10$rOOjq8YQNqVhF8.Zd8K8YuXxJxJxJxJxJxJxJxJxJxJxJxJxJxJx'),
('USER002', 'investor2@example.com', '0xbcdef12345678901234567890123456789012345', '李理财', '13900139002', 'approved', '$2b$10$rOOjq8YQNqVhF8.Zd8K8YuXxJxJxJxJxJxJxJxJxJxJxJxJxJxJx'),
('USER003', 'investor3@example.com', '0xcdef123456789012345678901234567890123456', '王财富', '13900139003', 'pending', '$2b$10$rOOjq8YQNqVhF8.Zd8K8YuXxJxJxJxJxJxJxJxJxJxJxJxJxJxJx'),
('USER004', 'investor4@example.com', '0xdef1234567890123456789012345678901234567', '刘资本', '13900139004', 'approved', '$2b$10$rOOjq8YQNqVhF8.Zd8K8YuXxJxJxJxJxJxJxJxJxJxJxJxJxJxJx'),
('USER005', 'investor5@example.com', '0xef12345678901234567890123456789012345678', '陈基金', '13900139005', 'approved', '$2b$10$rOOjq8YQNqVhF8.Zd8K8YuXxJxJxJxJxJxJxJxJxJxJxJxJxJxJx'),
('USER006', 'demo@example.com', '0x1111222233334444555566667777888899990000', '演示用户', '+13800138000', 'approved', '$2b$10$rOOjq8YQNqVhF8.Zd8K8YuXxJxJxJxJxJxJxJxJxJxJxJxJxJxJx');

-- 插入示例投资记录
INSERT OR IGNORE INTO investments (id, user_id, project_id, amount, token_amount, investment_type, status, transaction_hash) VALUES
('INV001', 'USER001', 'RWA001', 100000.00, 1000.00000000, 'token', 'completed', '0x1111111111111111111111111111111111111111111111111111111111111111'),
('INV002', 'USER002', 'RWA001', 50000.00, 500.00000000, 'token', 'completed', '0x2222222222222222222222222222222222222222222222222222222222222222'),
('INV003', 'USER003', 'RWA002', 200000.00, 2000.00000000, 'token', 'pending', NULL),
('INV004', 'USER004', 'RWA003', 80000.00, 800.00000000, 'token', 'completed', '0x3333333333333333333333333333333333333333333333333333333333333333'),
('INV005', 'USER005', 'RWA004', 150000.00, 1500.00000000, 'token', 'completed', '0x4444444444444444444444444444444444444444444444444444444444444444');

-- 插入AI风险评估记录
INSERT OR IGNORE INTO risk_assessments (id, project_id, risk_score, risk_level, assessment_data, ai_model_version) VALUES
('RISK001', 'RWA001', 4.2, '中低风险', '{"market_risk": 3.5, "credit_risk": 4.0, "liquidity_risk": 4.8, "operational_risk": 4.5}', 'claude-3-sonnet'),
('RISK002', 'RWA002', 5.8, '中等风险', '{"market_risk": 6.2, "credit_risk": 5.5, "liquidity_risk": 5.8, "operational_risk": 5.7}', 'claude-3-sonnet'),
('RISK003', 'RWA003', 6.5, '中等风险', '{"market_risk": 7.0, "credit_risk": 6.2, "liquidity_risk": 6.8, "operational_risk": 6.0}', 'claude-3-sonnet'),
('RISK004', 'RWA004', 3.8, '中低风险', '{"market_risk": 4.2, "credit_risk": 3.5, "liquidity_risk": 3.8, "operational_risk": 3.7}', 'claude-3-sonnet'),
('RISK005', 'RWA005', 7.2, '中高风险', '{"market_risk": 7.5, "credit_risk": 7.0, "liquidity_risk": 7.8, "operational_risk": 6.5}', 'claude-3-sonnet');

-- 更新统计信息
ANALYZE;

SELECT '✅ 种子数据插入完成' as status;
SELECT '📊 项目数量: ' || COUNT(*) as projects_count FROM projects;
SELECT '👥 用户数量: ' || COUNT(*) as users_count FROM users;
SELECT '💰 投资记录: ' || COUNT(*) as investments_count FROM investments;
SELECT '🔍 风险评估: ' || COUNT(*) as assessments_count FROM risk_assessments;