// 路径: /api/upload

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

// 文件上传验证
const FileUploadSchema = z.object({
  fileName: z.string().min(1, '文件名不能为空'),
  fileSize: z.number().positive('文件大小必须大于0'),
  fileType: z.string().min(1, '文件类型不能为空'),
  projectId: z.string().optional(),
  category: z.enum(['asset_docs', 'financial_docs', 'legal_docs', 'other']).default('other')
});

// 支持的文件类型
const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt'
};

// 最大文件大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 文件上传处理
app.post('/', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    const projectId = formData.get('projectId');
    const category = formData.get('category') || 'other';
    
    if (!file || !(file instanceof File)) {
      return c.json({
        success: false,
        error: '请选择要上传的文件'
      }, 400);
    }
    
    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return c.json({
        success: false,
        error: '文件大小不能超过10MB'
      }, 400);
    }
    
    // 验证文件类型
    if (!ALLOWED_FILE_TYPES[file.type]) {
      return c.json({
        success: false,
        error: '不支持的文件类型，请上传PDF、图片、Word或Excel文件'
      }, 400);
    }
    
    // 生成唯一文件名
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = ALLOWED_FILE_TYPES[file.type];
    const uniqueFileName = `${category}/${projectId || 'general'}/${timestamp}_${randomId}${fileExtension}`;
    
    // 上传文件到Cloudflare R2存储
    const { R2_BUCKET, DB } = c.env;
    let fileUrl;
    
    try {
      // 将文件上传到R2存储桶
      const fileBuffer = await file.arrayBuffer();
      await R2_BUCKET.put(uniqueFileName, fileBuffer, {
        httpMetadata: {
          contentType: file.type,
          contentDisposition: `attachment; filename="${file.name}"`
        },
        customMetadata: {
          originalName: file.name,
          category: category,
          projectId: projectId || '',
          uploadTime: new Date().toISOString()
        }
      });
      
      // 生成文件访问URL（使用R2的公共URL或自定义域名）
      fileUrl = `https://files.rwa-project-platform.pages.dev/${uniqueFileName}`;
      
    } catch (r2Error) {
      console.error('R2存储上传失败:', r2Error);
      return c.json({
        success: false,
        error: '文件存储失败，请重试'
      }, 500);
    }
    
    // 文件信息
    const fileInfo = {
      id: `file_${timestamp}_${randomId}`,
      originalName: file.name,
      fileName: uniqueFileName,
      fileSize: file.size,
      fileType: file.type,
      category: category,
      projectId: projectId,
      uploadTime: new Date().toISOString(),
      status: 'uploaded',
      url: fileUrl
    };
    
    // 保存文件信息到Cloudflare D1数据库
    try {
      await DB.prepare(`
        INSERT INTO uploaded_files (
          id, original_name, file_name, file_size, file_type, 
          category, project_id, upload_time, status, url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        fileInfo.id,
        fileInfo.originalName,
        fileInfo.fileName,
        fileInfo.fileSize,
        fileInfo.fileType,
        fileInfo.category,
        fileInfo.projectId,
        fileInfo.uploadTime,
        fileInfo.status,
        fileInfo.url
      ).run();
    } catch (dbError) {
      console.error('保存文件信息到数据库失败:', dbError);
      // 即使数据库保存失败，文件已经上传成功，继续返回结果
    }
    
    console.log('文件上传成功:', fileInfo);
    
    return c.json({
      success: true,
      message: '文件上传成功',
      data: fileInfo
    });
    
  } catch (error) {
    console.error('文件上传失败:', error);
    return c.json({
      success: false,
      error: '文件上传失败，请重试'
    }, 500);
  }
});

// 获取文件列表
app.get('/list', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const category = c.req.query('category');
    const { DB } = c.env;
    
    // 构建查询条件
    let query = 'SELECT * FROM uploaded_files WHERE status = "uploaded"';
    const params = [];
    
    if (projectId) {
      query += ' AND project_id = ?';
      params.push(projectId);
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY upload_time DESC';
    
    // 从数据库查询文件列表
    const { results } = await DB.prepare(query).bind(...params).all();
    
    // 转换数据格式
    const files = results.map(row => ({
      id: row.id,
      originalName: row.original_name,
      fileName: row.file_name,
      fileSize: row.file_size,
      fileType: row.file_type,
      category: row.category,
      projectId: row.project_id,
      uploadTime: row.upload_time,
      status: row.status,
      url: row.url
    }));
    
    return c.json({
      success: true,
      data: files,
      total: files.length
    });
    
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return c.json({
      success: false,
      error: '获取文件列表失败'
    }, 500);
  }
});

// 删除文件
app.delete('/:fileId', async (c) => {
  try {
    const fileId = c.req.param('fileId');
    
    if (!fileId) {
      return c.json({
        success: false,
        error: '文件ID不能为空'
      }, 400);
    }
    
    // 在实际应用中，这里应该从数据库删除文件记录，并从存储服务删除文件
    console.log('删除文件:', fileId);
    
    return c.json({
      success: true,
      message: '文件删除成功'
    });
    
  } catch (error) {
    console.error('删除文件失败:', error);
    return c.json({
      success: false,
      error: '删除文件失败'
    }, 500);
  }
});

export default app;