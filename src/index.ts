import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ServerMonitor } from './services/serverMonitor';
import { DockerMonitor } from './services/dockerMonitor';
import { LogAnalyzer } from './services/logAnalyzer';

// 환경 변수에서 포트 읽기 (기본값: 8300)
const MCP_PORT = process.env.MCP_PORT || '8300';

class ServerMonitorMCP {
  private server: Server;
  private serverMonitor: ServerMonitor;
  private dockerMonitor: DockerMonitor;
  private logAnalyzer: LogAnalyzer;

  constructor() {
    this.server = new Server(
      {
        name: 'server-monitor-mcp',
        version: '1.0.0',
      }
    );

    this.serverMonitor = new ServerMonitor();
    this.dockerMonitor = new DockerMonitor();
    this.logAnalyzer = new LogAnalyzer();

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // 도구 목록 제공
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_system_info',
            description: '서버의 시스템 정보를 가져옵니다 (CPU, 메모리, 디스크 사용량 등)',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'get_docker_containers',
            description: '실행 중인 Docker 컨테이너 목록을 가져옵니다',
            inputSchema: {
              type: 'object',
              properties: {
                all: {
                  type: 'boolean',
                  description: '중지된 컨테이너도 포함할지 여부',
                  default: false,
                },
              },
            },
          },
          {
            name: 'get_container_stats',
            description: '특정 Docker 컨테이너의 리소스 사용량을 가져옵니다',
            inputSchema: {
              type: 'object',
              properties: {
                containerId: {
                  type: 'string',
                  description: '컨테이너 ID 또는 이름',
                },
              },
              required: ['containerId'],
            },
          },
          {
            name: 'get_container_logs',
            description: '특정 Docker 컨테이너의 로그를 가져옵니다',
            inputSchema: {
              type: 'object',
              properties: {
                containerId: {
                  type: 'string',
                  description: '컨테이너 ID 또는 이름',
                },
                lines: {
                  type: 'number',
                  description: '가져올 로그 라인 수',
                  default: 100,
                },
              },
              required: ['containerId'],
            },
          },
          {
            name: 'analyze_container_logs',
            description: 'Docker 컨테이너 로그를 분석하여 에러나 경고를 찾습니다',
            inputSchema: {
              type: 'object',
              properties: {
                containerId: {
                  type: 'string',
                  description: '컨테이너 ID 또는 이름',
                },
                hours: {
                  type: 'number',
                  description: '분석할 시간 범위 (시간)',
                  default: 24,
                },
              },
              required: ['containerId'],
            },
          },
          {
            name: 'restart_container',
            description: 'Docker 컨테이너를 재시작합니다',
            inputSchema: {
              type: 'object',
              properties: {
                containerId: {
                  type: 'string',
                  description: '컨테이너 ID 또는 이름',
                },
              },
              required: ['containerId'],
            },
          },
          {
            name: 'get_server_health',
            description: '서버의 전반적인 상태를 종합적으로 점검합니다',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
        ],
      };
    });

    // 도구 실행 핸들러
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_system_info':
            return await this.handleGetSystemInfo();

          case 'get_docker_containers':
            return await this.handleGetDockerContainers(args);

          case 'get_container_stats':
            return await this.handleGetContainerStats(args);

          case 'get_container_logs':
            return await this.handleGetContainerLogs(args);

          case 'analyze_container_logs':
            return await this.handleAnalyzeContainerLogs(args);

          case 'restart_container':
            return await this.handleRestartContainer(args);

          case 'get_server_health':
            return await this.handleGetServerHealth();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `오류 발생: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async handleGetSystemInfo() {
    const systemInfo = await this.serverMonitor.getSystemInfo();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(systemInfo, null, 2),
        },
      ],
    };
  }

  private async handleGetDockerContainers(args: any) {
    const containers = await this.dockerMonitor.getContainers(args?.all || false);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(containers, null, 2),
        },
      ],
    };
  }

  private async handleGetContainerStats(args: any) {
    if (!args?.containerId) {
      throw new Error('containerId는 필수 매개변수입니다');
    }
    const stats = await this.dockerMonitor.getContainerStats(args.containerId);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  private async handleGetContainerLogs(args: any) {
    if (!args?.containerId) {
      throw new Error('containerId는 필수 매개변수입니다');
    }
    const logs = await this.dockerMonitor.getContainerLogs(args.containerId, args?.lines || 100);
    return {
      content: [
        {
          type: 'text',
          text: logs,
        },
      ],
    };
  }

  private async handleAnalyzeContainerLogs(args: any) {
    if (!args?.containerId) {
      throw new Error('containerId는 필수 매개변수입니다');
    }
    const analysis = await this.logAnalyzer.analyzeContainerLogs(args.containerId, args?.hours || 24);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }

  private async handleRestartContainer(args: any) {
    if (!args?.containerId) {
      throw new Error('containerId는 필수 매개변수입니다');
    }
    const result = await this.dockerMonitor.restartContainer(args.containerId);
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  private async handleGetServerHealth() {
    const systemInfo = await this.serverMonitor.getSystemInfo();
    const containers = await this.dockerMonitor.getContainers(false);
    const health = await this.serverMonitor.getServerHealth();
    
    const healthReport = {
      timestamp: new Date().toISOString(),
      system: systemInfo,
      docker: {
        totalContainers: containers.length,
        runningContainers: containers.filter(c => c.state === 'running').length,
        containers: containers.map(c => ({
          name: c.name,
          status: c.status,
          state: c.state
        }))
      },
      health: health
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(healthReport, null, 2),
        },
      ],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('Server Monitor MCP가 시작되었습니다.');
  }
}

// 서버 시작
const mcpServer = new ServerMonitorMCP();
mcpServer.start().catch((error) => {
  console.error('서버 시작 실패:', error);
  process.exit(1);
});
