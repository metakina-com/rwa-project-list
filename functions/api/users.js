import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { sign, verify } from 'hono/jwt';
import { getCookie, setCookie } from 'hono/cookie';

const app = new Hono();

// 启用CORS
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
}));

// JWT密钥（生产环境应使用环境变量）
const JWT_SECRET = 'your-jwt-secret-key';

// 用户注册数据验证
const registerSchema = z.object({
    email: z.string().email('邮箱格式不正确'),
    password: z.string().min(6, '密码至少6位'),
    name: z.string().min(1, '姓名不能为空'),
    phone: z.string().optional(),
    wallet_address: z.string().optional()
});

// 用户登录数据验证
const loginSchema = z.object({
    email: z.string().email('邮箱格式不正确'),
    password: z.string().min(1, '密码不能为空')
});

// 生成用户ID
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 密码哈希（简单实现，生产环境应使用bcrypt）
function hashPassword(password) {
    // 这里使用简单的哈希，生产环境应使用更安全的方法
    return btoa(password + 'salt');
}

// 验证密码
function verifyPassword(password, hashedPassword) {
    return hashPassword(password) === hashedPassword;
}

// 生成JWT令牌
async function generateToken(userId, email) {
    const payload = {
        userId,
        email,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
    };
    return await sign(payload, JWT_SECRET);
}

// 验证JWT令牌
async function verifyToken(token) {
    try {
        return await verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// 中间件：验证用户认证
async function authMiddleware(c, next) {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '') || getCookie(c, 'auth_token');
    
    if (!token) {
        return c.json({ error: '未提供认证令牌' }, 401);
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
        return c.json({ error: '无效的认证令牌' }, 401);
    }
    
    c.set('user', payload);
    await next();
}

// 用户注册
app.post('/register', async (c) => {
    try {
        const body = await c.req.json();
        const validatedData = registerSchema.parse(body);
        
        const { email, password, name, phone, wallet_address } = validatedData;
        
        // 检查邮箱是否已存在
        const existingUser = await c.env.DB.prepare(
            'SELECT id FROM users WHERE email = ?'
        ).bind(email).first();
        
        if (existingUser) {
            return c.json({ error: '邮箱已被注册' }, 400);
        }
        
        // 检查钱包地址是否已存在（如果提供）
        if (wallet_address) {
            const existingWallet = await c.env.DB.prepare(
                'SELECT id FROM users WHERE wallet_address = ?'
            ).bind(wallet_address).first();
            
            if (existingWallet) {
                return c.json({ error: '钱包地址已被注册' }, 400);
            }
        }
        
        // 创建新用户
        const userId = generateUserId();
        const hashedPassword = hashPassword(password);
        
        await c.env.DB.prepare(`
            INSERT INTO users (id, email, password_hash, name, phone, wallet_address, kyc_status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `).bind(userId, email, hashedPassword, name, phone || null, wallet_address || null).run();
        
        // 生成JWT令牌
        const token = await generateToken(userId, email);
        
        // 设置Cookie
        setCookie(c, 'auth_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 24 * 60 * 60 // 24小时
        });
        
        return c.json({
            success: true,
            message: '注册成功',
            user: {
                id: userId,
                email,
                name,
                phone,
                wallet_address,
                kyc_status: 'pending'
            },
            token
        });
        
    } catch (error) {
        console.error('注册错误:', error);
        
        if (error instanceof z.ZodError) {
            return c.json({
                error: '数据验证失败',
                details: error.errors
            }, 400);
        }
        
        return c.json({ error: '注册失败，请稍后重试' }, 500);
    }
});

// 用户登录
app.post('/login', async (c) => {
    try {
        const body = await c.req.json();
        const validatedData = loginSchema.parse(body);
        
        const { email, password } = validatedData;
        
        // 查找用户
        const user = await c.env.DB.prepare(
            'SELECT * FROM users WHERE email = ?'
        ).bind(email).first();
        
        if (!user) {
            return c.json({ error: '邮箱或密码错误' }, 401);
        }
        
        // 验证密码
        if (!verifyPassword(password, user.password_hash)) {
            return c.json({ error: '邮箱或密码错误' }, 401);
        }
        
        // 生成JWT令牌
        const token = await generateToken(user.id, user.email);
        
        // 设置Cookie
        setCookie(c, 'auth_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 24 * 60 * 60 // 24小时
        });
        
        // 更新最后登录时间
        await c.env.DB.prepare(
            'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(user.id).run();
        
        return c.json({
            success: true,
            message: '登录成功',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                wallet_address: user.wallet_address,
                kyc_status: user.kyc_status
            },
            token
        });
        
    } catch (error) {
        console.error('登录错误:', error);
        
        if (error instanceof z.ZodError) {
            return c.json({
                error: '数据验证失败',
                details: error.errors
            }, 400);
        }
        
        return c.json({ error: '登录失败，请稍后重试' }, 500);
    }
});

// 用户登出
app.post('/logout', async (c) => {
    // 清除Cookie
    setCookie(c, 'auth_token', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 0
    });
    
    return c.json({
        success: true,
        message: '登出成功'
    });
});

// 获取当前用户信息
app.get('/profile', authMiddleware, async (c) => {
    try {
        const userPayload = c.get('user');
        
        const user = await c.env.DB.prepare(
            'SELECT id, email, name, phone, wallet_address, kyc_status, created_at FROM users WHERE id = ?'
        ).bind(userPayload.userId).first();
        
        if (!user) {
            return c.json({ error: '用户不存在' }, 404);
        }
        
        return c.json({
            success: true,
            user
        });
        
    } catch (error) {
        console.error('获取用户信息错误:', error);
        return c.json({ error: '获取用户信息失败' }, 500);
    }
});

// 更新用户信息
app.put('/profile', authMiddleware, async (c) => {
    try {
        const userPayload = c.get('user');
        const body = await c.req.json();
        
        const updateSchema = z.object({
            name: z.string().min(1).optional(),
            phone: z.string().optional(),
            wallet_address: z.string().optional()
        });
        
        const validatedData = updateSchema.parse(body);
        
        // 检查钱包地址是否已被其他用户使用
        if (validatedData.wallet_address) {
            const existingWallet = await c.env.DB.prepare(
                'SELECT id FROM users WHERE wallet_address = ? AND id != ?'
            ).bind(validatedData.wallet_address, userPayload.userId).first();
            
            if (existingWallet) {
                return c.json({ error: '钱包地址已被其他用户使用' }, 400);
            }
        }
        
        // 构建更新语句
        const updateFields = [];
        const updateValues = [];
        
        Object.entries(validatedData).forEach(([key, value]) => {
            if (value !== undefined) {
                updateFields.push(`${key} = ?`);
                updateValues.push(value);
            }
        });
        
        if (updateFields.length === 0) {
            return c.json({ error: '没有提供要更新的字段' }, 400);
        }
        
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(userPayload.userId);
        
        await c.env.DB.prepare(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`
        ).bind(...updateValues).run();
        
        // 获取更新后的用户信息
        const updatedUser = await c.env.DB.prepare(
            'SELECT id, email, name, phone, wallet_address, kyc_status, created_at FROM users WHERE id = ?'
        ).bind(userPayload.userId).first();
        
        return c.json({
            success: true,
            message: '用户信息更新成功',
            user: updatedUser
        });
        
    } catch (error) {
        console.error('更新用户信息错误:', error);
        
        if (error instanceof z.ZodError) {
            return c.json({
                error: '数据验证失败',
                details: error.errors
            }, 400);
        }
        
        return c.json({ error: '更新用户信息失败' }, 500);
    }
});

// 更新KYC状态
app.put('/:userId/kyc', authMiddleware, async (c) => {
    try {
        const userId = c.req.param('userId');
        const userPayload = c.get('user');
        
        // 检查权限（用户只能更新自己的KYC状态）
        if (userPayload.userId !== userId) {
            return c.json({ error: '权限不足' }, 403);
        }
        
        const body = await c.req.json();
        const kycSchema = z.object({
            kyc_status: z.enum(['pending', 'approved', 'rejected']),
            kyc_data: z.object({}).optional()
        });
        
        const validatedData = kycSchema.parse(body);
        
        await c.env.DB.prepare(
            'UPDATE users SET kyc_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(validatedData.kyc_status, userId).run();
        
        return c.json({
            success: true,
            message: 'KYC状态更新成功'
        });
        
    } catch (error) {
        console.error('更新KYC状态错误:', error);
        
        if (error instanceof z.ZodError) {
            return c.json({
                error: '数据验证失败',
                details: error.errors
            }, 400);
        }
        
        return c.json({ error: '更新KYC状态失败' }, 500);
    }
});

// 验证令牌有效性
app.get('/verify', async (c) => {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '') || getCookie(c, 'auth_token');
    
    if (!token) {
        return c.json({ valid: false, error: '未提供认证令牌' }, 401);
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
        return c.json({ valid: false, error: '无效的认证令牌' }, 401);
    }
    
    return c.json({
        valid: true,
        user: {
            userId: payload.userId,
            email: payload.email
        }
    });
});

export default app;