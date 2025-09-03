import * as si from 'systeminformation';

export interface SystemInfo {
  cpu: {
    manufacturer: string;
    brand: string;
    cores: number;
    physicalCores: number;
    currentLoad: number;
    temperature?: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usedPercentage: number;
  };
  disk: {
    size: number;
    used: number;
    available: number;
    usedPercentage: number;
  }[];
  network: {
    interface: string;
    ip4: string;
    rx_bytes: number;
    tx_bytes: number;
  }[];
  uptime: number;
  hostname: string;
  platform: string;
  arch: string;
}

export interface ServerHealth {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  score: number; // 0-100
}

export class ServerMonitor {
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const [cpu, mem, disk, network, osInfo, currentLoad, cpuTemp] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.fsSize(),
        si.networkInterfaces(),
        si.osInfo(),
        si.currentLoad(),
        si.cpuTemperature().catch(() => ({ main: undefined }))
      ]);

      return {
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          cores: cpu.cores,
          physicalCores: cpu.physicalCores,
          currentLoad: Math.round(currentLoad.currentLoad * 100) / 100,
          temperature: cpuTemp.main
        },
        memory: {
          total: mem.total,
          free: mem.free,
          used: mem.used,
          usedPercentage: Math.round((mem.used / mem.total) * 100 * 100) / 100
        },
        disk: disk.map(d => ({
          size: d.size,
          used: d.used,
          available: d.available,
          usedPercentage: Math.round((d.used / d.size) * 100 * 100) / 100
        })),
        network: network
          .filter(n => !n.internal && n.ip4)
          .map(n => ({
            interface: n.iface,
            ip4: n.ip4,
            rx_bytes: (n as any).rx_bytes || 0,
            tx_bytes: (n as any).tx_bytes || 0
          })),
        uptime: (osInfo as any).uptime || 0,
        hostname: osInfo.hostname,
        platform: osInfo.platform,
        arch: osInfo.arch
      };
    } catch (error) {
      throw new Error(`시스템 정보 수집 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getServerHealth(): Promise<ServerHealth> {
    try {
      const systemInfo = await this.getSystemInfo();
      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      // CPU 사용률 체크
      if (systemInfo.cpu.currentLoad > 90) {
        issues.push('CPU 사용률이 매우 높습니다 (90% 이상)');
        recommendations.push('CPU 집약적인 프로세스를 확인하고 최적화하세요');
        score -= 30;
      } else if (systemInfo.cpu.currentLoad > 70) {
        issues.push('CPU 사용률이 높습니다 (70% 이상)');
        recommendations.push('CPU 사용량을 모니터링하세요');
        score -= 15;
      }

      // 메모리 사용률 체크
      if (systemInfo.memory.usedPercentage > 90) {
        issues.push('메모리 사용률이 매우 높습니다 (90% 이상)');
        recommendations.push('메모리를 많이 사용하는 프로세스를 확인하고 메모리를 추가하세요');
        score -= 25;
      } else if (systemInfo.memory.usedPercentage > 80) {
        issues.push('메모리 사용률이 높습니다 (80% 이상)');
        recommendations.push('메모리 사용량을 모니터링하세요');
        score -= 10;
      }

      // 디스크 사용률 체크
      for (const disk of systemInfo.disk) {
        if (disk.usedPercentage > 95) {
          issues.push(`디스크 사용률이 매우 높습니다 (${disk.usedPercentage.toFixed(1)}%)`);
          recommendations.push('디스크 공간을 확보하거나 용량을 확장하세요');
          score -= 25;
        } else if (disk.usedPercentage > 85) {
          issues.push(`디스크 사용률이 높습니다 (${disk.usedPercentage.toFixed(1)}%)`);
          recommendations.push('디스크 공간을 모니터링하고 정리하세요');
          score -= 10;
        }
      }

      // CPU 온도 체크 (온도 정보가 있는 경우)
      if (systemInfo.cpu.temperature && systemInfo.cpu.temperature > 80) {
        issues.push(`CPU 온도가 높습니다 (${systemInfo.cpu.temperature}°C)`);
        recommendations.push('CPU 쿨링을 확인하고 먼지를 제거하세요');
        score -= 15;
      }

      // 전체적인 상태 결정
      let status: 'healthy' | 'warning' | 'critical';
      if (score >= 80) {
        status = 'healthy';
      } else if (score >= 60) {
        status = 'warning';
      } else {
        status = 'critical';
      }

      return {
        status,
        issues,
        recommendations,
        score: Math.max(0, score)
      };
    } catch (error) {
      throw new Error(`서버 상태 체크 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}일 ${hours}시간 ${minutes}분`;
  }
}
