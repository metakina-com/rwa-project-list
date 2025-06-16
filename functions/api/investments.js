// 路径: /api/investments

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { getCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';

const app = new Hono();
const JWT_SECRET = 'your-secret-key';

// 启用CORS
app.use('*', cors({
  origin: ['https://rwa-project-platform.pages.dev', 'http://localhost:8788', 'http://localhost:8000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// JWT验证中间件
const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '') || getCookie(c, 'auth_token');
  
  if (!token) {
    return c.json({ error: '未提供认证令牌' }, 401);
  }
  
  try {
    const payload = await verify(token, JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: '无效的认证令牌' }, 401);
  }
};

// 投资数据验证模式
const InvestmentSchema = z.object({
  project_id: z.string().min(1, '项目ID不能为空'),
  amount: z.number().positive('投资金额必须大于0'),
  quantity: z.number().positive('购买数量必须大于0'),
  unit_price: z.number().positive('单价必须大于0')
});

// 生成唯一投资ID
function generateInvestmentId() {
  return 'INV' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 生成唯一交易ID
function generateTransactionId() {
  return 'TXN' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 创建投资记录
app.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = InvestmentSchema.parse(body);
    const userPayload = c.get('user');
    const { DB } = c.env;
    
    // 检查用户KYC状态
    const user = await DB.prepare(
      'SELECT kyc_status FROM users WHERE id = ?'
    ).bind(userPayload.userId).first();
    
    if (!user || user.kyc_status !== 'approved') {
      return c.json({ 
        success: false, 
        error: '用户KYC未通过，无法进行投资' 
      }, 403);
    }
    
    // 检查项目是否存在且可投资
    const project = await DB.prepare(
      'SELECT * FROM projects WHERE id = ? AND status IN ("募资中", "运营中")'
    ).bind(validatedData.project_id).first();
    
    if (!project) {
      return c.json({ 
        success: false, 
        error: '项目不存在或当前不可投资' 
      }, 404);
    }
    
    const investmentId = generateInvestmentId();
    const transactionId = generateTransactionId();
    const now = new Date().toISOString();
    
    // 开始事务
    await DB.batch([
      // 插入投资记录
      DB.prepare(`
        INSERT INTO investments (
          id, user_id, project_id, amount, quantity, unit_price, 
          status, transaction_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        investmentId,
        userPayload.userId,
        validatedData.project_id,
        validatedData.amount,
        validatedData.quantity,
        validatedData.unit_price,
        'pending',
        transactionId,
        now
      ),
      
      // 插入交易记录
      DB.prepare(`
        INSERT INTO transactions (
          id, user_id, project_id, investment_id, type, amount, 
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        transactionId,
        userPayload.userId,
        validatedData.project_id,
        investmentId,
        'purchase',
        validatedData.amount,
        'pending',
        now
      )
    ]);
    
    return c.json({
      success: true,
      data: {
        investment_id: investmentId,
        transaction_id: transactionId,
        message: '投资订单创建成功'
      }
    }, 201);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: '数据验证失败',
        details: error.errors
      }, 400);
    }
    
    console.error('创建投资记录失败:', error);
    return c.json({ success: false, error: '创建投资记录失败' }, 500);
  }
});

// 获取当前用户投资记录
app.get('/user', authMiddleware, async (c) => {
  try {
    const userPayload = c.get('user');
    const { DB } = c.env;
    
    const { results } = await DB.prepare(`
      SELECT 
        i.*,
        p.name as project_name,
        p.type as project_type,
        p.asset_type,
        t.status as transaction_status
      FROM investments i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN transactions t ON i.transaction_id = t.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `).bind(userPayload.userId).all();
    
    return c.json({ success: true, data: results });
    
  } catch (error) {
    console.error('获取用户投资记录失败:', error);
    return c.json({ success: false, error: '获取投资记录失败' }, 500);
  }
});

// 获取用户投资记录
app.get('/user/:userId', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('userId');
    const userPayload = c.get('user');
    const { DB } = c.env;
    
    // 检查权限
    if (userPayload.userId !== userId) {
      return c.json({ error: '权限不足' }, 403);
    }
    
    const { results } = await DB.prepare(`
      SELECT 
        i.*,
        p.name as project_name,
        p.type as project_type,
        p.asset_type,
        t.status as transaction_status
      FROM investments i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN transactions t ON i.transaction_id = t.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `).bind(userId).all();
    
    return c.json({ success: true, data: results });
    
  } catch (error) {
    console.error('获取用户投资记录失败:', error);
    return c.json({ success: false, error: '获取投资记录失败' }, 500);
  }
});

// 获取项目投资记录
app.get('/project/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const { DB } = c.env;
    
    const { results } = await DB.prepare(`
      SELECT 
        i.id,
        i.amount,
        i.quantity,
        i.unit_price,
        i.status,
        i.created_at,
        u.email as investor_email
      FROM investments i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.project_id = ? AND i.status = 'completed'
      ORDER BY i.created_at DESC
    `).bind(projectId).all();
    
    // 计算统计信息
    const totalAmount = results.reduce((sum, inv) => sum + inv.amount, 0);
    const totalQuantity = results.reduce((sum, inv) => sum + inv.quantity, 0);
    
    return c.json({ 
      success: true, 
      data: {
        investments: results,
        statistics: {
          total_amount: totalAmount,
          total_quantity: totalQuantity,
          investor_count: results.length
        }
      }
    });
    
  } catch (error) {
    console.error('获取项目投资记录失败:', error);
    return c.json({ success: false, error: '获取投资记录失败' }, 500);
  }
});

// 更新投资状态
app.put('/:investmentId/status', authMiddleware, async (c) => {
  try {
    const investmentId = c.req.param('investmentId');
    const { status } = await c.req.json();
    const userPayload = c.get('user');
    const { DB } = c.env;
    
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return c.json({ success: false, error: '无效的投资状态' }, 400);
    }
    
    // 检查投资记录是否属于当前用户
    const investment = await DB.prepare(
      'SELECT user_id, transaction_id FROM investments WHERE id = ?'
    ).bind(investmentId).first();
    
    if (!investment || investment.user_id !== userPayload.userId) {
      return c.json({ error: '投资记录不存在或权限不足' }, 404);
    }
    
    const now = new Date().toISOString();
    
    // 更新投资和交易状态
    await DB.batch([
      DB.prepare(
        'UPDATE investments SET status = ?, updated_at = ? WHERE id = ?'
      ).bind(status, now, investmentId),
      
      DB.prepare(
        'UPDATE transactions SET status = ?, updated_at = ? WHERE id = ?'
      ).bind(status, now, investment.transaction_id)
    ]);
    
    return c.json({ success: true, message: '投资状态更新成功' });
    
  } catch (error) {
    console.error('更新投资状态失败:', error);
    return c.json({ success: false, error: '更新投资状态失败' }, 500);
  }
});

// 获取投资详情
app.get('/:investmentId', authMiddleware, async (c) => {
  try {
    const investmentId = c.req.param('investmentId');
    const userPayload = c.get('user');
    const { DB } = c.env;
    
    const investment = await DB.prepare(`
      SELECT 
        i.*,
        p.name as project_name,
        p.type as project_type,
        p.asset_type,
        p.description as project_description,
        t.status as transaction_status,
        t.created_at as transaction_created_at
      FROM investments i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN transactions t ON i.transaction_id = t.id
      WHERE i.id = ? AND i.user_id = ?
    `).bind(investmentId, userPayload.userId).first();
    
    if (!investment) {
      return c.json({ error: '投资记录不存在' }, 404);
    }
    
    return c.json({ success: true, data: investment });
    
  } catch (error) {
    console.error('获取投资详情失败:', error);
    return c.json({ success: false, error: '获取投资详情失败' }, 500);
  }
});

export default app;