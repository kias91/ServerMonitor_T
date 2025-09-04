import express from 'express';
import { ServerMonitorMCP } from './index.js';

const app = express();
const port = process.env.MCP_PORT || 8300;

// JSON 파싱 미들웨어
app.use(express.json());

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'server-monitor-mcp'
  });
});

// 서버 정보 엔드포인트
app.get('/info', (req, res) => {
  res.json({
    name: 'Server Monitor MCP',
    version: '1.0.0',
    description: 'MCP Server for monitoring Ubuntu server resources and Docker services',
    port: port
  });
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'Server Monitor MCP가 실행 중입니다.',
    endpoints: {
      health: '/health',
      info: '/info'
    }
  });
});

// MCP 서버 인스턴스 생성 (하지만 HTTP 모드에서는 시작하지 않음)
const mcpServer = new ServerMonitorMCP();

// Express 서버 시작
app.listen(port, () => {
  console.log(`🚀 Server Monitor MCP HTTP 서버가 포트 ${port}에서 실행 중입니다.`);
  console.log(`📊 헬스 체크: http://localhost:${port}/health`);
  console.log(`ℹ️  서버 정보: http://localhost:${port}/info`);
});

// 신호 처리
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다.');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT 신호를 받았습니다. 서버를 종료합니다.');
  process.exit(0);
});
