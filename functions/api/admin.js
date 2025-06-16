// 后台管理系统API接口

// 管理员认证中间件
function requireAdmin(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: '未授权访问' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // 这里应该验证JWT token并检查管理员权限
    // 简化实现，实际应用中需要完整的认证逻辑
    const token = authHeader.substring(7);
    if (token !== 'admin-token-123') {
        return new Response(JSON.stringify({ error: '无效的管理员令牌' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    return null; // 认证通过
}

// 主要的请求处理函数
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/admin', '');
    const method = request.method;
    
    // CORS处理
    if (method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
        });
    }
    
    // 管理员认证检查
    const authError = requireAdmin(request);
    if (authError) return authError;
    
    try {
        // 路由处理
        switch (path) {
            case '/dashboard':
                return handleDashboard(request, env);
            case '/users':
                return handleUsers(request, env, method);
            case '/projects':
                return handleProjects(request, env, method);
            case '/tenants':
                return handleTenants(request, env, method);
            case '/fees':
                return handleFees(request, env, method);
            case '/functions':
                return handleFunctions(request, env, method);
            case '/courses':
                return handleCourses(request, env, method);
            case '/resources':
                return handleResources(request, env, method);
            case '/files':
                return handleFiles(request, env, method);
            case '/settings':
                return handleSettings(request, env, method);
            default:
                return new Response(JSON.stringify({ error: '接口不存在' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
        }
    } catch (error) {
        console.error('Admin API Error:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 仪表盘数据处理
async function handleDashboard(request, env) {
    try {
        // 获取统计数据
        const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
        const projectCount = await env.DB.prepare('SELECT COUNT(*) as count FROM projects').first();
        const activeProjects = await env.DB.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').bind('募资中').first();
        const totalInvestments = await env.DB.prepare('SELECT SUM(amount) as total FROM investments WHERE status = ?').bind('completed').first();
        
        // 获取最近活动
        const recentUsers = await env.DB.prepare(
            'SELECT name, created_at FROM users ORDER BY created_at DESC LIMIT 5'
        ).all();
        
        const recentProjects = await env.DB.prepare(
            'SELECT name, status, created_at FROM projects ORDER BY created_at DESC LIMIT 5'
        ).all();
        
        const dashboardData = {
            stats: {
                totalUsers: userCount?.count || 0,
                totalProjects: projectCount?.count || 0,
                activeProjects: activeProjects?.count || 0,
                totalInvestments: totalInvestments?.total || 0,
                pendingReviews: 23 // 模拟数据
            },
            recentActivity: {
                users: recentUsers.results || [],
                projects: recentProjects.results || []
            }
        };
        
        return new Response(JSON.stringify(dashboardData), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return new Response(JSON.stringify({ error: '获取仪表盘数据失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 用户管理处理
async function handleUsers(request, env, method) {
    const url = new URL(request.url);
    
    switch (method) {
        case 'GET':
            return getUsersList(request, env, url);
        case 'POST':
            return createUser(request, env);
        case 'PUT':
            return updateUser(request, env);
        case 'DELETE':
            return deleteUser(request, env, url);
        default:
            return new Response(JSON.stringify({ error: '不支持的请求方法' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            });
    }
}

// 获取用户列表
async function getUsersList(request, env, url) {
    try {
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 10;
        const search = url.searchParams.get('search') || '';
        const kycStatus = url.searchParams.get('kyc_status') || '';
        
        const offset = (page - 1) * limit;
        
        let query = 'SELECT id, name, email, wallet_address, kyc_status, created_at FROM users';
        let countQuery = 'SELECT COUNT(*) as total FROM users';
        let params = [];
        let conditions = [];
        
        if (search) {
            conditions.push('(name LIKE ? OR email LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (kycStatus) {
            conditions.push('kyc_status = ?');
            params.push(kycStatus);
        }
        
        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const [users, total] = await Promise.all([
            env.DB.prepare(query).bind(...params).all(),
            env.DB.prepare(countQuery).bind(...params.slice(0, -2)).first()
        ]);
        
        return new Response(JSON.stringify({
            users: users.results || [],
            pagination: {
                page,
                limit,
                total: total?.total || 0,
                pages: Math.ceil((total?.total || 0) / limit)
            }
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        return new Response(JSON.stringify({ error: '获取用户列表失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 创建用户
async function createUser(request, env) {
    try {
        const userData = await request.json();
        const { name, email, password, wallet_address } = userData;
        
        // 验证必填字段
        if (!name || (!email && !wallet_address)) {
            return new Response(JSON.stringify({ error: '缺少必填字段' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const userId = 'user_' + Date.now();
        const passwordHash = password ? await hashPassword(password) : null;
        
        await env.DB.prepare(
            'INSERT INTO users (id, name, email, password_hash, wallet_address, kyc_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
            userId,
            name,
            email || null,
            passwordHash,
            wallet_address || null,
            'pending',
            new Date().toISOString()
        ).run();
        
        return new Response(JSON.stringify({ 
            success: true, 
            message: '用户创建成功',
            userId 
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        return new Response(JSON.stringify({ error: '创建用户失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 项目管理处理
async function handleProjects(request, env, method) {
    const url = new URL(request.url);
    
    switch (method) {
        case 'GET':
            return getProjectsList(request, env, url);
        case 'POST':
            return createProject(request, env);
        case 'PUT':
            return updateProject(request, env);
        case 'DELETE':
            return deleteProject(request, env, url);
        default:
            return new Response(JSON.stringify({ error: '不支持的请求方法' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            });
    }
}

// 获取项目列表
async function getProjectsList(request, env, url) {
    try {
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 10;
        const search = url.searchParams.get('search') || '';
        const type = url.searchParams.get('type') || '';
        const status = url.searchParams.get('status') || '';
        
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT p.id, p.name, p.type, p.asset_type, p.status, p.created_at,
                   pf.asset_value
            FROM projects p
            LEFT JOIN project_financials pf ON p.id = pf.project_id
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM projects p';
        let params = [];
        let conditions = [];
        
        if (search) {
            conditions.push('p.name LIKE ?');
            params.push(`%${search}%`);
        }
        
        if (type) {
            conditions.push('p.type = ?');
            params.push(type);
        }
        
        if (status) {
            conditions.push('p.status = ?');
            params.push(status);
        }
        
        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }
        
        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const [projects, total] = await Promise.all([
            env.DB.prepare(query).bind(...params).all(),
            env.DB.prepare(countQuery).bind(...params.slice(0, -2)).first()
        ]);
        
        return new Response(JSON.stringify({
            projects: projects.results || [],
            pagination: {
                page,
                limit,
                total: total?.total || 0,
                pages: Math.ceil((total?.total || 0) / limit)
            }
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Get projects error:', error);
        return new Response(JSON.stringify({ error: '获取项目列表失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 租户管理处理
async function handleTenants(request, env, method) {
    // 租户管理逻辑 - 这里需要创建新的租户表
    return new Response(JSON.stringify({ 
        message: '租户管理功能开发中',
        tenants: [
            {
                id: 'tenant_001',
                company: '金融科技有限公司',
                contact: '王经理',
                plan: '企业版',
                expiry: '2024-12-31',
                status: 'active'
            }
        ]
    }), {
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

// 手续费管理处理
async function handleFees(request, env, method) {
    if (method === 'GET') {
        return new Response(JSON.stringify({
            settings: {
                transactionFee: 0.5,
                withdrawalFee: 1.0,
                platformFee: 2.0,
                minimumFee: 10.0
            },
            stats: {
                todayIncome: 1234.56,
                monthlyIncome: 45678.90,
                totalIncome: 234567.89,
                averageRate: 1.2
            }
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
    
    if (method === 'POST') {
        const feeData = await request.json();
        // 这里应该保存手续费设置到数据库
        return new Response(JSON.stringify({ 
            success: true, 
            message: '手续费设置已保存' 
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 功能管理处理
async function handleFunctions(request, env, method) {
    return new Response(JSON.stringify({
        functions: [
            { id: 'func_001', name: '用户认证', status: 'active', description: 'KYC/AML用户身份验证' },
            { id: 'func_002', name: '智能合约', status: 'active', description: '自动化合约执行' },
            { id: 'func_003', name: '风险评估', status: 'active', description: 'AI驱动的风险分析' },
            { id: 'func_004', name: '支付网关', status: 'maintenance', description: '多种支付方式集成' }
        ]
    }), {
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

// 课程管理处理
async function handleCourses(request, env, method) {
    return new Response(JSON.stringify({
        courses: [
            {
                id: 'course_001',
                name: 'RWA基础知识',
                category: '基础课程',
                instructor: '李教授',
                students: 156,
                status: 'published'
            },
            {
                id: 'course_002',
                name: '区块链投资策略',
                category: '进阶课程',
                instructor: '张专家',
                students: 89,
                status: 'draft'
            }
        ],
        stats: {
            total: 2,
            published: 1,
            draft: 1,
            totalStudents: 245
        }
    }), {
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

// 资源库管理处理
async function handleResources(request, env, method) {
    return new Response(JSON.stringify({
        resources: [
            { id: 'res_001', name: '项目模板.docx', type: 'document', size: '2.5MB', category: 'templates' },
            { id: 'res_002', name: '公司logo.png', type: 'image', size: '156KB', category: 'images' },
            { id: 'res_003', name: '介绍视频.mp4', type: 'video', size: '45MB', category: 'videos' },
            { id: 'res_004', name: '用户手册.pdf', type: 'document', size: '3.2MB', category: 'documents' }
        ]
    }), {
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

// 文件管理处理
async function handleFiles(request, env, method) {
    if (method === 'GET') {
        const files = await env.DB.prepare(
            'SELECT * FROM uploaded_files WHERE status != ? ORDER BY created_at DESC'
        ).bind('deleted').all();
        
        return new Response(JSON.stringify({
            files: files.results || [],
            stats: {
                total: files.results?.length || 0,
                storageUsed: '3.7MB',
                monthlyUploads: files.results?.length || 0,
                totalDownloads: 45
            }
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 系统设置处理
async function handleSettings(request, env, method) {
    if (method === 'GET') {
        return new Response(JSON.stringify({
            system: {
                name: '元话RWA数字投行',
                version: 'v1.0.0',
                contactEmail: 'admin@yuanhua-rwa.com',
                supportPhone: '+86-400-123-4567'
            },
            security: {
                twoFactorAuth: false,
                loginLogging: true
            }
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
    
    if (method === 'POST') {
        const settings = await request.json();
        // 这里应该保存设置到数据库
        return new Response(JSON.stringify({ 
            success: true, 
            message: '系统设置已保存' 
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 辅助函数
async function hashPassword(password) {
    // 简化的密码哈希，实际应用中应使用更安全的方法
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// 更新用户
async function updateUser(request, env) {
    try {
        const userData = await request.json();
        const { id, name, email, kyc_status } = userData;
        
        await env.DB.prepare(
            'UPDATE users SET name = ?, email = ?, kyc_status = ?, updated_at = ? WHERE id = ?'
        ).bind(name, email, kyc_status, new Date().toISOString(), id).run();
        
        return new Response(JSON.stringify({ 
            success: true, 
            message: '用户更新成功' 
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        return new Response(JSON.stringify({ error: '更新用户失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 删除用户
async function deleteUser(request, env, url) {
    try {
        const userId = url.searchParams.get('id');
        if (!userId) {
            return new Response(JSON.stringify({ error: '缺少用户ID' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
        
        return new Response(JSON.stringify({ 
            success: true, 
            message: '用户删除成功' 
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Delete user error:', error);
        return new Response(JSON.stringify({ error: '删除用户失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 创建项目
async function createProject(request, env) {
    try {
        const projectData = await request.json();
        const { name, type, asset_type, description, location } = projectData;
        
        const projectId = 'proj_' + Date.now();
        
        await env.DB.prepare(
            'INSERT INTO projects (id, name, type, asset_type, description, location, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
            projectId,
            name,
            type,
            asset_type,
            description || '',
            location || '',
            '筹备中',
            new Date().toISOString()
        ).run();
        
        return new Response(JSON.stringify({ 
            success: true, 
            message: '项目创建成功',
            projectId 
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Create project error:', error);
        return new Response(JSON.stringify({ error: '创建项目失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 更新项目
async function updateProject(request, env) {
    try {
        const projectData = await request.json();
        const { id, name, type, asset_type, description, location, status } = projectData;
        
        await env.DB.prepare(
            'UPDATE projects SET name = ?, type = ?, asset_type = ?, description = ?, location = ?, status = ?, updated_at = ? WHERE id = ?'
        ).bind(name, type, asset_type, description, location, status, new Date().toISOString(), id).run();
        
        return new Response(JSON.stringify({ 
            success: true, 
            message: '项目更新成功' 
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Update project error:', error);
        return new Response(JSON.stringify({ error: '更新项目失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 删除项目
async function deleteProject(request, env, url) {
    try {
        const projectId = url.searchParams.get('id');
        if (!projectId) {
            return new Response(JSON.stringify({ error: '缺少项目ID' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 删除项目及相关数据（由于外键约束，相关数据会自动删除）
        await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(projectId).run();
        
        return new Response(JSON.stringify({ 
            success: true, 
            message: '项目删除成功' 
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Delete project error:', error);
        return new Response(JSON.stringify({ error: '删除项目失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}