import Docker from 'dockerode';

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  created: Date;
  ports: string[];
}

export interface ContainerStats {
  containerId: string;
  name: string;
  cpuUsage: number;
  memoryUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
  networkIO: {
    rx: number;
    tx: number;
  };
  blockIO: {
    read: number;
    write: number;
  };
  timestamp: Date;
}

export class DockerMonitor {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  async getContainers(all: boolean = false): Promise<ContainerInfo[]> {
    try {
      const containers = await this.docker.listContainers({ all });
      
      return containers.map(container => ({
        id: container.Id,
        name: container.Names[0]?.replace('/', '') || 'unknown',
        image: container.Image,
        status: container.Status,
        state: container.State,
        created: new Date(container.Created * 1000),
        ports: container.Ports?.map(port => 
          `${port.PrivatePort}${port.PublicPort ? `:${port.PublicPort}` : ''}/${port.Type}`
        ) || []
      }));
    } catch (error) {
      throw new Error(`Docker 컨테이너 목록 조회 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getContainerStats(containerId: string): Promise<ContainerStats> {
    try {
      const container = this.docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });
      const inspect = await container.inspect();

      // CPU 사용률 계산
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuUsage = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

      // 메모리 사용률 계산
      const memoryUsage = {
        used: stats.memory_stats.usage,
        limit: stats.memory_stats.limit,
        percentage: (stats.memory_stats.usage / stats.memory_stats.limit) * 100
      };

      // 네트워크 I/O 계산
      let networkRx = 0;
      let networkTx = 0;
      if (stats.networks) {
        Object.values(stats.networks).forEach((network: any) => {
          networkRx += network.rx_bytes;
          networkTx += network.tx_bytes;
        });
      }

      // 블록 I/O 계산
      let blockRead = 0;
      let blockWrite = 0;
      if (stats.blkio_stats?.io_service_bytes_recursive) {
        stats.blkio_stats.io_service_bytes_recursive.forEach((item: any) => {
          if (item.op === 'Read') blockRead += item.value;
          if (item.op === 'Write') blockWrite += item.value;
        });
      }

      return {
        containerId: inspect.Id,
        name: inspect.Name.replace('/', ''),
        cpuUsage: Math.round(cpuUsage * 100) / 100,
        memoryUsage,
        networkIO: {
          rx: networkRx,
          tx: networkTx
        },
        blockIO: {
          read: blockRead,
          write: blockWrite
        },
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`컨테이너 상태 조회 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getContainerLogs(containerId: string, lines: number = 100): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: lines,
        timestamps: true
      });

      return logs.toString();
    } catch (error) {
      throw new Error(`컨테이너 로그 조회 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async restartContainer(containerId: string): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.restart();
      return `컨테이너 ${containerId}가 성공적으로 재시작되었습니다.`;
    } catch (error) {
      throw new Error(`컨테이너 재시작 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getDockerInfo(): Promise<any> {
    try {
      return await this.docker.info();
    } catch (error) {
      throw new Error(`Docker 정보 조회 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
