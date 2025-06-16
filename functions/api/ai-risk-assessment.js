// Cloudflare Pages Functions - AI风险评估API
// 路径: /api/ai-risk-assessment

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

const app = new Hono();

// 启用CORS
app.use('*', cors({
  origin: ['https://rwa-project-platform.pages.dev', 'http://localhost:8788'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// 风险评估请求数据验证
const RiskAssessmentSchema = z.object({
  projectId: z.string().min(1, '项目ID不能为空'),
  projectData: z.object({
    name: z.string(),
    assetType: z.string(),
    assetValue: z.number(),
    annualReturn: z.number().optional(),
    operationPeriod: z.number(),
    location: z.string().optional(),
    description: z.string().optional(),
    // 添加文件相关字段
    uploadedFiles: z.array(z.object({
      id: z.string(),
      originalName: z.string(),
      fileSize: z.number(),
      fileType: z.string(),
      category: z.string(),
      url: z.string().optional()
    })).optional(),
    fileCategories: z.object({
      asset_docs: z.array(z.any()).optional(),
      financial_docs: z.array(z.any()).optional(),
      legal_docs: z.array(z.any()).optional(),
      other: z.array(z.any()).optional()
    }).optional(),
    totalFileSize: z.number().optional()
  })
});

// 风险等级映射
const getRiskLevel = (score) => {
  if (score <= 3) return '低风险';
  if (score <= 6) return '中低风险';
  if (score <= 7.5) return '中等风险';
  if (score <= 9) return '中高风险';
  return '高风险';
};

// 分析上传的文件
const analyzeUploadedFiles = (projectData) => {
  const files = projectData.uploadedFiles || [];
  const categories = projectData.fileCategories || {
    asset_docs: [],
    financial_docs: [],
    legal_docs: [],
    other: []
  };
  
  const analysis = {
    assetDocsCount: categories.asset_docs?.length || 0,
    financialDocsCount: categories.financial_docs?.length || 0,
    legalDocsCount: categories.legal_docs?.length || 0,
    otherDocsCount: categories.other?.length || 0,
    totalSize: projectData.totalFileSize || 0,
    completenessScore: 0,
    summary: ''
  };
  
  // 计算文件完整性评分
  let score = 0;
  
  // 资产证明文件 (权重: 30%)
  if (analysis.assetDocsCount > 0) {
    score += Math.min(analysis.assetDocsCount * 1.5, 3);
  }
  
  // 财务文件 (权重: 25%)
  if (analysis.financialDocsCount > 0) {
    score += Math.min(analysis.financialDocsCount * 1.25, 2.5);
  }
  
  // 法律文件 (权重: 25%)
  if (analysis.legalDocsCount > 0) {
    score += Math.min(analysis.legalDocsCount * 1.25, 2.5);
  }
  
  // 其他支持文件 (权重: 20%)
  if (analysis.otherDocsCount > 0) {
    score += Math.min(analysis.otherDocsCount * 1, 2);
  }
  
  analysis.completenessScore = Math.min(Math.round(score), 10);
  
  // 生成文件分析摘要
  if (files.length === 0) {
    analysis.summary = '未提供任何支持文件，建议补充相关证明材料以降低评估风险。';
  } else {
    const totalFiles = files.length;
    let summaryParts = [];
    
    if (analysis.assetDocsCount > 0) {
      summaryParts.push(`包含${analysis.assetDocsCount}个资产证明文件`);
    }
    if (analysis.financialDocsCount > 0) {
      summaryParts.push(`${analysis.financialDocsCount}个财务文件`);
    }
    if (analysis.legalDocsCount > 0) {
      summaryParts.push(`${analysis.legalDocsCount}个法律文件`);
    }
    if (analysis.otherDocsCount > 0) {
      summaryParts.push(`${analysis.otherDocsCount}个其他支持文件`);
    }
    
    analysis.summary = `共提供${totalFiles}个文件，${summaryParts.join('、')}。`;
    
    // 添加文件质量评估
    if (analysis.completenessScore >= 8) {
      analysis.summary += '文件资料较为完整，有助于降低评估风险。';
    } else if (analysis.completenessScore >= 5) {
      analysis.summary += '文件资料基本齐全，建议补充部分关键文件。';
    } else {
      analysis.summary += '文件资料不够完整，存在较高的信息不对称风险。';
    }
  }
  
  return analysis;
};

// 解析AI响应并提取风险评分
const parseAIResponse = (aiResponse) => {
  try {
    const content = aiResponse.response || aiResponse.content || JSON.stringify(aiResponse);
    
    // 尝试提取数字评分 (1-10)
    const scoreMatch = content.match(/(?:评分|得分|分数)[：:]*\s*(\d+(?:\.\d+)?)/i) ||
                     content.match(/(\d+(?:\.\d+)?)\s*(?:分|points?)/i) ||
                     content.match(/(?:score|rating)[：:]*\s*(\d+(?:\.\d+)?)/i);
    
    let riskScore = scoreMatch ? parseFloat(scoreMatch[1]) : null;
    
    // 如果没有找到评分，尝试从风险等级推断
    if (!riskScore) {
      if (/高风险|high.risk/i.test(content)) riskScore = 8.5;
      else if (/中高风险|medium.high.risk/i.test(content)) riskScore = 7.5;
      else if (/中等风险|medium.risk/i.test(content)) riskScore = 6.0;
      else if (/中低风险|medium.low.risk/i.test(content)) riskScore = 4.5;
      else if (/低风险|low.risk/i.test(content)) riskScore = 2.5;
      else riskScore = 5.0; // 默认中等风险
    }
    
    // 确保评分在1-10范围内
    riskScore = Math.max(1, Math.min(10, riskScore));
    
    return {
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      aiAnalysis: content,
      confidence: scoreMatch ? 0.9 : 0.6
    };
  } catch (error) {
    console.error('解析AI响应失败:', error);
    return {
      riskScore: 5.0,
      riskLevel: '中等风险',
      aiAnalysis: '无法解析AI分析结果',
      confidence: 0.3
    };
  }
};

// 执行AI风险评估
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, projectData } = RiskAssessmentSchema.parse(body);
    const { AI, DB } = c.env;
    
    // 分析上传的文件
    const fileAnalysis = analyzeUploadedFiles(projectData);
    
    // 构建AI提示词
    const prompt = `作为专业的RWA(Real World Assets)风险评估专家，请对以下项目进行全面的风险评估：

项目信息：
- 项目名称：${projectData.name}
- 资产类型：${projectData.assetType}
- 资产价值：${projectData.assetValue.toLocaleString()} 元
- 预期年化收益率：${projectData.annualReturn || 0}%
- 运营期限：${projectData.operationPeriod} 年
- 项目位置：${projectData.location || '未指定'}
- 项目描述：${projectData.description || '无详细描述'}

文件资料分析：
${fileAnalysis.summary}
- 资产证明文件：${fileAnalysis.assetDocsCount} 个
- 财务文件：${fileAnalysis.financialDocsCount} 个
- 法律文件：${fileAnalysis.legalDocsCount} 个
- 其他文件：${fileAnalysis.otherDocsCount} 个
- 总文件大小：${(fileAnalysis.totalSize / 1024 / 1024).toFixed(2)} MB
- 文件完整性评分：${fileAnalysis.completenessScore}/10

请从以下维度进行评估：
1. 市场风险 - 资产类型的市场波动性和流动性
2. 信用风险 - 项目方的信誉和还款能力
3. 操作风险 - 项目运营和管理风险
4. 法律风险 - 合规性和监管风险
5. 技术风险 - 区块链和智能合约风险
6. 文档风险 - 基于提供文件的完整性和质量评估

请给出：
1. 综合风险评分（1-10分，1为最低风险，10为最高风险）
2. 风险等级（低风险/中低风险/中等风险/中高风险/高风险）
3. 主要风险点分析
4. 风险缓解建议
5. 文档建议（如需要补充哪些文件）

请以结构化的方式回答，包含明确的数字评分。`;
    
    // 调用Cloudflare Workers AI
    let aiResponse;
    try {
      // 尝试使用不同的AI模型
      const models = [
        '@cf/meta/llama-2-7b-chat-int8',
        '@cf/microsoft/DialoGPT-medium',
        '@cf/meta/llama-2-7b-chat-fp16'
      ];
      
      for (const model of models) {
        try {
          aiResponse = await AI.run(model, {
            messages: [{
              role: 'user',
              content: prompt
            }]
          });
          if (aiResponse) break;
        } catch (modelError) {
          console.warn(`模型 ${model} 调用失败:`, modelError);
          continue;
        }
      }
      
      if (!aiResponse) {
        throw new Error('所有AI模型调用失败');
      }
    } catch (aiError) {
      console.error('AI服务调用失败:', aiError);
      // 使用备用评估逻辑
      aiResponse = {
        response: `基于项目基本信息的风险评估：
        
资产类型 "${projectData.assetType}" 的市场风险为中等水平。
资产价值 ${projectData.assetValue.toLocaleString()} 元，规模适中。
预期年化收益率 ${projectData.annualReturn || 0}%，${projectData.annualReturn > 15 ? '收益率较高，风险相应增加' : '收益率合理'}。
运营期限 ${projectData.operationPeriod} 年，${projectData.operationPeriod > 5 ? '期限较长，增加不确定性' : '期限适中'}。

综合风险评分：6.5分
风险等级：中等风险

主要风险点：
1. 市场波动风险
2. 流动性风险
3. 运营管理风险

建议：
1. 加强项目监管和透明度
2. 建立风险准备金
3. 定期进行风险评估更新`
      };
    }
    
    // 解析AI响应
    const assessment = parseAIResponse(aiResponse);
    
    // 保存评估结果到数据库
    const assessmentId = 'RISK' + Date.now() + Math.random().toString(36).substr(2, 5);
    const now = new Date().toISOString();
    
    try {
      await DB.prepare(`
        INSERT INTO risk_assessments (
          id, project_id, risk_score, risk_level, assessment_data, ai_model_version, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        assessmentId,
        projectId,
        assessment.riskScore,
        assessment.riskLevel,
        JSON.stringify({
          aiAnalysis: assessment.aiAnalysis,
          confidence: assessment.confidence,
          projectData,
          timestamp: now
        }),
        'cloudflare-workers-ai',
        now
      ).run();
    } catch (dbError) {
      console.error('保存风险评估结果失败:', dbError);
      // 继续返回结果，即使保存失败
    }
    
    return c.json({
      success: true,
      data: {
        assessmentId,
        projectId,
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel,
        analysis: assessment.aiAnalysis,
        confidence: assessment.confidence,
        timestamp: now,
        recommendations: [
          '建议定期更新风险评估',
          '加强项目监管和透明度',
          '建立适当的风险缓解措施',
          '保持与投资者的及时沟通'
        ]
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: '请求数据格式错误',
        details: error.errors
      }, 400);
    }
    
    console.error('风险评估失败:', error);
    return c.json({
      success: false,
      error: '风险评估服务暂时不可用，请稍后重试'
    }, 500);
  }
});

// 获取项目的历史风险评估
app.get('/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const { DB } = c.env;
    
    const { results } = await DB.prepare(`
      SELECT * FROM risk_assessments 
      WHERE project_id = ? 
      ORDER BY created_at DESC
    `).bind(projectId).all();
    
    return c.json({
      success: true,
      data: results.map(assessment => ({
        ...assessment,
        assessment_data: JSON.parse(assessment.assessment_data || '{}')
      }))
    });
    
  } catch (error) {
    console.error('获取风险评估历史失败:', error);
    return c.json({
      success: false,
      error: '获取风险评估历史失败'
    }, 500);
  }
});

// 获取风险评估统计信息
app.get('/stats/overview', async (c) => {
  try {
    const { DB } = c.env;
    
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_assessments,
        AVG(risk_score) as avg_risk_score,
        COUNT(CASE WHEN risk_level = '低风险' THEN 1 END) as low_risk_count,
        COUNT(CASE WHEN risk_level = '中等风险' THEN 1 END) as medium_risk_count,
        COUNT(CASE WHEN risk_level = '高风险' THEN 1 END) as high_risk_count
      FROM risk_assessments
    `).first();
    
    return c.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('获取风险评估统计失败:', error);
    return c.json({
      success: false,
      error: '获取统计信息失败'
    }, 500);
  }
});

export default app;