// Cloudflare Pages Functions - 项目管理API
// 路径: /api/projects

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

const app = new Hono();

// 启用CORS
app.use('*', cors({
  origin: ['https://rwa-project-platform.pages.dev', 'http://localhost:8788'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// 项目数据验证模式
const ProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  type: z.string().min(1, '项目类型不能为空'),
  assetType: z.string().min(1, '资产类型不能为空'),
  location: z.string().optional(),
  description: z.string().optional(),
  initiatorType: z.string().min(1, '发起方类型不能为空'),
  companyName: z.string().min(1, '公司名称不能为空'),
  contactPerson: z.string().min(1, '联系人不能为空'),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  contactEmail: z.string().email('邮箱格式不正确'),
  walletAddress: z.string().optional(),
  assetValue: z.number().positive('资产价值必须大于0'),
  annualRevenue: z.number().optional(),
  annualProfit: z.number().optional(),
  annualReturn: z.number().optional(),
  operationPeriod: z.number().positive('运营期限必须大于0'),
});

// 生成唯一项目ID
function generateProjectId() {
  return 'RWA' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 获取所有项目列表
app.get('/', async (c) => {
  try {
    const { DB } = c.env;
    const { results } = await DB.prepare(`
      SELECT p.*, pi.company_name, pi.contact_person, pf.asset_value
      FROM projects p
      LEFT JOIN project_initiators pi ON p.id = pi.project_id
      LEFT JOIN project_financials pf ON p.id = pf.project_id
      ORDER BY p.created_at DESC
    `).all();
    
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return c.json({ success: false, error: '获取项目列表失败' }, 500);
  }
});

// 获取单个项目详情
app.get('/:id', async (c) => {
  try {
    const projectId = c.req.param('id');
    const { DB } = c.env;
    
    // 获取项目基本信息
    const project = await DB.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first();
    if (!project) {
      return c.json({ success: false, error: '项目不存在' }, 404);
    }
    
    // 获取相关信息
    const [initiator, financial, tokenomics, compliance] = await Promise.all([
      DB.prepare('SELECT * FROM project_initiators WHERE project_id = ?').bind(projectId).first(),
      DB.prepare('SELECT * FROM project_financials WHERE project_id = ?').bind(projectId).first(),
      DB.prepare('SELECT * FROM project_tokenomics WHERE project_id = ?').bind(projectId).first(),
      DB.prepare('SELECT * FROM project_compliance WHERE project_id = ?').bind(projectId).first(),
    ]);
    
    const projectData = {
      ...project,
      initiator,
      financial,
      tokenomics,
      compliance
    };
    
    return c.json({ success: true, data: projectData });
  } catch (error) {
    console.error('获取项目详情失败:', error);
    return c.json({ success: false, error: '获取项目详情失败' }, 500);
  }
});

// 创建新项目
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = ProjectSchema.parse(body);
    const { DB, AI } = c.env;
    
    const projectId = generateProjectId();
    const now = new Date().toISOString();
    
    // 开始事务
    await DB.batch([
      // 插入项目基本信息
      DB.prepare(`
        INSERT INTO projects (id, name, type, asset_type, location, description, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        projectId,
        validatedData.name,
        validatedData.type,
        validatedData.assetType,
        validatedData.location || '',
        validatedData.description || '',
        '筹备中',
        now
      ),
      
      // 插入发起方信息
      DB.prepare(`
        INSERT INTO project_initiators (project_id, type, company_name, contact_person, contact_phone, contact_email, wallet_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        projectId,
        validatedData.initiatorType,
        validatedData.companyName,
        validatedData.contactPerson,
        validatedData.contactPhone,
        validatedData.contactEmail,
        validatedData.walletAddress || ''
      ),
      
      // 插入财务信息
      DB.prepare(`
        INSERT INTO project_financials (project_id, asset_value, annual_revenue, annual_profit, annual_return, operation_period)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        projectId,
        validatedData.assetValue,
        validatedData.annualRevenue || 0,
        validatedData.annualProfit || 0,
        validatedData.annualReturn || 0,
        validatedData.operationPeriod
      )
    ]);
    
    // 使用AI进行风险评估
    try {
      const riskAssessment = await AI.run('@cf/meta/llama-2-7b-chat-int8', {
        messages: [{
          role: 'user',
          content: `请对以下RWA项目进行风险评估，返回1-10的风险评分和风险等级：
项目名称：${validatedData.name}
资产类型：${validatedData.assetType}
资产价值：${validatedData.assetValue}
运营期限：${validatedData.operationPeriod}年
年化收益：${validatedData.annualReturn || 0}%`
        }]
      });
      
      // 保存AI风险评估结果
      await DB.prepare(`
        INSERT INTO risk_assessments (id, project_id, risk_score, risk_level, assessment_data, ai_model_version)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        'RISK' + Date.now(),
        projectId,
        7.5, // 默认风险评分
        '中等风险',
        JSON.stringify(riskAssessment),
        '@cf/meta/llama-2-7b-chat-int8'
      ).run();
    } catch (aiError) {
      console.warn('AI风险评估失败:', aiError);
    }
    
    return c.json({ 
      success: true, 
      data: { projectId, message: '项目创建成功' }
    }, 201);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        success: false, 
        error: '数据验证失败', 
        details: error.errors 
      }, 400);
    }
    
    console.error('创建项目失败:', error);
    return c.json({ success: false, error: '创建项目失败' }, 500);
  }
});

// 更新项目状态
app.put('/:id/status', async (c) => {
  try {
    const projectId = c.req.param('id');
    const { status } = await c.req.json();
    const { DB } = c.env;
    
    const validStatuses = ['筹备中', '募资中', '运营中', '已完成', '已暂停'];
    if (!validStatuses.includes(status)) {
      return c.json({ success: false, error: '无效的项目状态' }, 400);
    }
    
    await DB.prepare('UPDATE projects SET status = ? WHERE id = ?')
      .bind(status, projectId)
      .run();
    
    return c.json({ success: true, message: '项目状态更新成功' });
  } catch (error) {
    console.error('更新项目状态失败:', error);
    return c.json({ success: false, error: '更新项目状态失败' }, 500);
  }
});

// 删除项目
app.delete('/:id', async (c) => {
  try {
    const projectId = c.req.param('id');
    const { DB } = c.env;
    
    await DB.prepare('DELETE FROM projects WHERE id = ?')
      .bind(projectId)
      .run();
    
    return c.json({ success: true, message: '项目删除成功' });
  } catch (error) {
    console.error('删除项目失败:', error);
    return c.json({ success: false, error: '删除项目失败' }, 500);
  }
});

export default app;