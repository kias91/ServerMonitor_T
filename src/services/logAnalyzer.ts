import { DockerMonitor } from './dockerMonitor.js';

export interface LogAnalysis {
  containerId: string;
  containerName: string;
  timeRange: {
    start: Date;
    end: Date;
    hours: number;
  };
  summary: {
    totalLines: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
  errors: LogEntry[];
  warnings: LogEntry[];
  patterns: {
    pattern: string;
    count: number;
    severity: 'error' | 'warning' | 'info';
  }[];
  recommendations: string[];
}

export interface LogEntry {
  timestamp: Date;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  source?: string;
}

export class LogAnalyzer {
  private dockerMonitor: DockerMonitor;
  
  // 에러 패턴들
  private errorPatterns = [
    /error/i,
    /exception/i,
    /failed/i,
    /fatal/i,
    /critical/i,
    /panic/i,
    /crash/i,
    /unable to/i,
    /connection refused/i,
    /timeout/i,
    /not found/i,
    /access denied/i,
    /permission denied/i,
    /out of memory/i,
    /stack trace/i
  ];

  // 경고 패턴들
  private warningPatterns = [
    /warn/i,
    /warning/i,
    /deprecated/i,
    /slow/i,
    /retry/i,
    /fallback/i,
    /performance/i,
    /memory leak/i,
    /high cpu/i,
    /throttle/i
  ];

  // 정보 패턴들
  private infoPatterns = [
    /info/i,
    /started/i,
    /stopped/i,
    /connected/i,
    /disconnected/i,
    /initialized/i,
    /completed/i,
    /success/i
  ];

  constructor() {
    this.dockerMonitor = new DockerMonitor();
  }

  async analyzeContainerLogs(containerId: string, hours: number = 24): Promise<LogAnalysis> {
    try {
      // 더 많은 로그를 가져와서 분석
      const logs = await this.dockerMonitor.getContainerLogs(containerId, 10000);
      const container = await this.getContainerInfo(containerId);
      
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
      
      const logLines = logs.split('\n').filter(line => line.trim());
      const parsedLogs = this.parseLogLines(logLines, startTime, endTime);
      
      const errors = parsedLogs.filter(log => log.level === 'error');
      const warnings = parsedLogs.filter(log => log.level === 'warning');
      const infos = parsedLogs.filter(log => log.level === 'info');
      
      const patterns = this.findPatterns(parsedLogs);
      const recommendations = this.generateRecommendations(errors, warnings, patterns);

      return {
        containerId,
        containerName: container.name,
        timeRange: {
          start: startTime,
          end: endTime,
          hours
        },
        summary: {
          totalLines: parsedLogs.length,
          errorCount: errors.length,
          warningCount: warnings.length,
          infoCount: infos.length
        },
        errors: errors.slice(0, 50), // 최근 50개 에러만
        warnings: warnings.slice(0, 30), // 최근 30개 경고만
        patterns,
        recommendations
      };
    } catch (error) {
      throw new Error(`로그 분석 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getContainerInfo(containerId: string): Promise<{ name: string }> {
    const containers = await this.dockerMonitor.getContainers(true);
    const container = containers.find(c => c.id.startsWith(containerId) || c.name === containerId);
    return { name: container?.name || containerId };
  }

  private parseLogLines(logLines: string[], startTime: Date, endTime: Date): LogEntry[] {
    const parsedLogs: LogEntry[] = [];

    for (const line of logLines) {
      try {
        const logEntry = this.parseLogLine(line);
        if (logEntry && logEntry.timestamp >= startTime && logEntry.timestamp <= endTime) {
          parsedLogs.push(logEntry);
        }
      } catch (error) {
        // 파싱 실패한 로그는 스킵
        continue;
      }
    }

    return parsedLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private parseLogLine(line: string): LogEntry | null {
    // Docker 로그 타임스탬프 파싱 (RFC3339 형식)
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(.*)$/);
    
    let timestamp = new Date();
    let message = line;
    
    if (timestampMatch) {
      timestamp = new Date(timestampMatch[1]);
      message = timestampMatch[2];
    }

    // 로그 레벨 결정
    const level = this.determineLogLevel(message);
    
    // ANSI 이스케이프 코드 제거
    message = message.replace(/\x1b\[[0-9;]*m/g, '');

    return {
      timestamp,
      level,
      message: message.trim()
    };
  }

  private determineLogLevel(message: string): 'error' | 'warning' | 'info' | 'debug' {
    // 에러 패턴 체크
    for (const pattern of this.errorPatterns) {
      if (pattern.test(message)) {
        return 'error';
      }
    }

    // 경고 패턴 체크
    for (const pattern of this.warningPatterns) {
      if (pattern.test(message)) {
        return 'warning';
      }
    }

    // 정보 패턴 체크
    for (const pattern of this.infoPatterns) {
      if (pattern.test(message)) {
        return 'info';
      }
    }

    return 'debug';
  }

  private findPatterns(logs: LogEntry[]): { pattern: string; count: number; severity: 'error' | 'warning' | 'info' }[] {
    const patternCount = new Map<string, { count: number; severity: 'error' | 'warning' | 'info' }>();

    for (const log of logs) {
      // 에러 패턴 찾기
      for (const pattern of this.errorPatterns) {
        if (pattern.test(log.message)) {
          const key = pattern.source;
          const current = patternCount.get(key) || { count: 0, severity: 'error' as const };
          patternCount.set(key, { count: current.count + 1, severity: 'error' });
        }
      }

      // 경고 패턴 찾기
      for (const pattern of this.warningPatterns) {
        if (pattern.test(log.message)) {
          const key = pattern.source;
          const current = patternCount.get(key) || { count: 0, severity: 'warning' as const };
          patternCount.set(key, { count: current.count + 1, severity: 'warning' });
        }
      }
    }

    return Array.from(patternCount.entries())
      .map(([pattern, data]) => ({
        pattern: pattern.replace(/[\\\/]/g, ''),
        count: data.count,
        severity: data.severity
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // 상위 10개 패턴만
  }

  private generateRecommendations(
    errors: LogEntry[], 
    warnings: LogEntry[], 
    patterns: { pattern: string; count: number; severity: 'error' | 'warning' | 'info' }[]
  ): string[] {
    const recommendations: string[] = [];

    // 에러 기반 추천
    if (errors.length > 100) {
      recommendations.push('에러가 매우 많이 발생하고 있습니다. 애플리케이션 상태를 점검하세요.');
    } else if (errors.length > 10) {
      recommendations.push('에러가 발생하고 있습니다. 로그를 자세히 확인해보세요.');
    }

    // 경고 기반 추천
    if (warnings.length > 200) {
      recommendations.push('경고가 매우 많이 발생하고 있습니다. 성능이나 설정을 점검하세요.');
    }

    // 패턴 기반 추천
    for (const pattern of patterns) {
      if (pattern.severity === 'error' && pattern.count > 20) {
        recommendations.push(`"${pattern.pattern}" 관련 에러가 반복적으로 발생하고 있습니다 (${pattern.count}회).`);
      }
      
      if (pattern.pattern.includes('timeout') && pattern.count > 5) {
        recommendations.push('타임아웃 문제가 발생하고 있습니다. 네트워크나 성능을 점검하세요.');
      }
      
      if (pattern.pattern.includes('memory') && pattern.count > 3) {
        recommendations.push('메모리 관련 문제가 감지되었습니다. 메모리 사용량을 확인하세요.');
      }
      
      if (pattern.pattern.includes('connection') && pattern.count > 10) {
        recommendations.push('연결 문제가 반복적으로 발생하고 있습니다. 네트워크나 외부 서비스 상태를 확인하세요.');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('로그에서 심각한 문제는 발견되지 않았습니다.');
    }

    return recommendations;
  }
}
