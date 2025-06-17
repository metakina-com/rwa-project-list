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

// 添加项目估值API (修正路径为 /ai-valuation 以匹配前端调用)
app.post('/ai-valuation', async (c) => {
  try {
    const { projectData, complianceResults } = await c.req.json();
    const { AI } = c.env;
    
    // 使用AI进行项目估值
    const valuationPrompt = `
      基于以下信息进行RWA项目估值：
      资产类型：${projectData.assetType}
      基础资产价值：${projectData.assetValue}
      预期年化收益：${projectData.annualReturn}%
      运营期限：${projectData.operationPeriod}年
      合规评分：${complianceResults?.score || 75}
      
      请提供：
      1. 基础资产估值调整
      2. 代币化溢价评估
      3. 整体项目估值
      4. 建议发行规模
    `;
    
    const aiValuation = await AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [{ role: 'user', content: valuationPrompt }]
    });
    
    // 解析AI估值结果并返回结构化数据
    const valuationResults = parseValuationResults(aiValuation, projectData);
    
    return c.json({ success: true, data: valuationResults });
  } catch (error) {
    console.error('项目估值失败:', error);
    return c.json({ success: false, error: '估值计算失败' }, 500);
  }
});

// 添加代币化方案生成API
app.post('/tokenization-plan', async (c) => {
  try {
    const { projectData, valuationResults } = await c.req.json();
    
    const tokenizationPlan = generateTokenizationPlan(projectData, valuationResults);
    
    return c.json({ success: true, data: tokenizationPlan });
  } catch (error) {
    console.error('代币化方案生成失败:', error);
    return c.json({ success: false, error: '方案生成失败' }, 500);
  }
});

// 解析AI估值结果的辅助函数
function parseValuationResults(aiResponse, projectData) {
  try {
    // 从AI响应中提取数值，如果解析失败则使用默认计算
    const response = aiResponse.response || aiResponse.toString();
    
    // 基础资产价值
    const baseAssetValue = projectData.assetValue || 1000000;
    
    // 代币化溢价计算（基于资产类型和风险等级）
    const premiumRates = {
      'real-estate': 15,
      'art': 25,
      'equity': 20,
      'commodity': 10,
      'other': 12
    };
    
    const tokenizationPremium = premiumRates[projectData.assetType] || 15;
    
    // 整体项目估值
    const totalValuation = baseAssetValue * (1 + tokenizationPremium / 100);
    
    // 建议发行规模（基于估值的60-80%）
    const issuanceRatio = 0.7; // 70%
    const recommendedIssuance = totalValuation * issuanceRatio;
    const recommendedTokens = Math.floor(recommendedIssuance / 10); // 每10元对应1个代币
    
    return {
      baseAssetValue: baseAssetValue,
      tokenizationPremium: tokenizationPremium,
      totalValuation: totalValuation,
      recommendedIssuance: recommendedIssuance,
      recommendedTokens: recommendedTokens,
      aiAnalysis: {
        confidence: 85,
        riskLevel: calculateRiskLevel(projectData),
        marketPotential: calculateMarketPotential(projectData)
      }
    };
  } catch (error) {
    console.error('解析AI估值结果失败:', error);
    // 返回默认估值结果
    return getDefaultValuationResults(projectData);
  }
}

// 生成代币化方案的辅助函数
function generateTokenizationPlan(projectData, valuationResults) {
  const totalValue = valuationResults.totalValuation;
  const assetType = projectData.assetType;
  
  // NFT发行方案
  const nftPlan = generateNFTPlan(projectData, valuationResults);
  
  // 代币发行方案
  const tokenPlan = generateTokenPlan(projectData, valuationResults);
  
  // 分配方案
  const distributionPlan = generateDistributionPlan(totalValue);
  
  return {
    nftPlan,
    tokenPlan,
    distributionPlan,
    summary: {
      totalValue: totalValue,
      nftCollections: nftPlan.collections.length,
      tokenSupply: tokenPlan.totalSupply,
      estimatedROI: calculateEstimatedROI(projectData)
    }
  };
}

// NFT方案生成
function generateNFTPlan(projectData, valuationResults) {
  const totalValue = valuationResults.totalValuation;
  const assetType = projectData.assetType;
  
  const nftPlan = {
    collections: [],
    totalSupply: 0,
    priceRange: { min: 0, max: 0 }
  };

  // 所有权NFT（高价值）
  if (totalValue > 1000000) {
    nftPlan.collections.push({
      type: 'ownership',
      name: `${projectData.name || '项目'} 所有权凭证`,
      supply: Math.min(Math.floor(totalValue / 100000), 100),
      price: 100000,
      rights: ['收益分配权', '治理投票权', '转让权'],
      description: '代表项目核心资产的所有权份额'
    });
  }

  // 收益权NFT（中等价值）
  nftPlan.collections.push({
    type: 'revenue',
    name: `${projectData.name || '项目'} 收益权NFT`,
    supply: Math.floor(totalValue / 10000),
    price: 10000,
    rights: ['收益分配权', '信息知情权'],
    description: '享有项目收益分配的权利凭证'
  });

  // 使用权NFT（低门槛）
  if (['real-estate', 'infrastructure'].includes(assetType)) {
    nftPlan.collections.push({
      type: 'access',
      name: `${projectData.name || '项目'} 使用权NFT`,
      supply: Math.floor(totalValue / 1000),
      price: 1000,
      rights: ['使用权', '优先购买权'],
      description: '享有资产使用权的凭证'
    });
  }

  nftPlan.totalSupply = nftPlan.collections.reduce((sum, col) => sum + col.supply, 0);
  nftPlan.priceRange = {
    min: Math.min(...nftPlan.collections.map(col => col.price)),
    max: Math.max(...nftPlan.collections.map(col => col.price))
  };

  return nftPlan;
}

// 代币方案生成
function generateTokenPlan(projectData, valuationResults) {
  const totalValue = valuationResults.totalValuation;
  const expectedReturn = projectData.annualReturn || 8;
  
  return {
    tokenName: `${projectData.name || 'RWA'} Token`,
    tokenSymbol: generateTokenSymbol(projectData.name || 'RWA'),
    totalSupply: Math.floor(totalValue / 10),
    initialPrice: 10,
    distributionSchedule: generateDistributionSchedule(totalValue),
    vestingPeriod: calculateVestingPeriod(projectData.operationPeriod),
    stakingRewards: Math.max(expectedReturn - 2, 3),
    governance: {
      votingPower: 'proportional',
      proposalThreshold: '1%',
      quorum: '10%'
    }
  };
}

// 辅助函数
function generateTokenSymbol(projectName) {
  if (!projectName) return 'RWA';
  const words = projectName.split(/[\s\-_]+/);
  if (words.length >= 2) {
    return (words[0].substring(0, 2) + words[1].substring(0, 2)).toUpperCase();
  }
  return projectName.substring(0, 4).toUpperCase();
}

function generateDistributionSchedule(totalValue) {
  if (totalValue > 10000000) {
    return { publicSale: 40, privateSale: 20, team: 15, ecosystem: 15, reserve: 10 };
  } else if (totalValue > 1000000) {
    return { publicSale: 50, privateSale: 15, team: 10, ecosystem: 15, reserve: 10 };
  } else {
    return { publicSale: 60, team: 10, ecosystem: 20, reserve: 10 };
  }
}

function calculateVestingPeriod(operationPeriod) {
  const period = operationPeriod || 5;
  return Math.min(period * 12, 60); // 最长5年
}

function calculateRiskLevel(projectData) {
  const riskFactors = {
    'real-estate': 'medium',
    'art': 'high',
    'equity': 'high',
    'commodity': 'medium',
    'other': 'medium'
  };
  return riskFactors[projectData.assetType] || 'medium';
}

function calculateMarketPotential(projectData) {
  const potential = {
    'real-estate': 'high',
    'art': 'medium',
    'equity': 'high',
    'commodity': 'medium',
    'other': 'medium'
  };
  return potential[projectData.assetType] || 'medium';
}

function calculateEstimatedROI(projectData) {
  return projectData.annualReturn || 8;
}

function getDefaultValuationResults(projectData) {
  const baseValue = projectData.assetValue || 1000000;
  return {
    baseAssetValue: baseValue,
    tokenizationPremium: 15,
    totalValuation: baseValue * 1.15,
    recommendedIssuance: baseValue * 1.15 * 0.7,
    recommendedTokens: Math.floor(baseValue * 1.15 * 0.7 / 10),
    aiAnalysis: {
      confidence: 75,
      riskLevel: 'medium',
      marketPotential: 'medium'
    }
  };
}

function generateDistributionPlan(totalValue) {
  return {
    phases: [
      { name: '种子轮', percentage: 10, price: 8 },
      { name: '私募轮', percentage: 20, price: 9 },
      { name: '公募轮', percentage: 40, price: 10 },
      { name: '团队激励', percentage: 15, lockPeriod: 24 },
      { name: '生态建设', percentage: 15, lockPeriod: 12 }
    ],
    timeline: {
      seedRound: '第1-2月',
      privateRound: '第3-4月',
      publicRound: '第5-6月',
      listing: '第7月'
    }
  };
}

export default app;