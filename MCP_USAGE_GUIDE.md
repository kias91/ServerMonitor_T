# MCP 서버 사용 가이드

## Claude Desktop에서 사용하기

### 1. Claude Desktop 설정
Claude Desktop의 설정 파일에 다음과 같이 MCP 서버를 추가하세요:

**Windows:**
`%APPDATA%\Claude\claude_desktop_config.json`

**macOS:**
`~/Library/Application Support/Claude/claude_desktop_config.json`

**Linux:**
`~/.config/claude/claude_desktop_config.json`

### 2. 설정 파일 내용
```json
{
  "mcpServers": {
    "server-monitor": {
      "command": "node",
      "args": ["/절대경로/ServerMonitor_T/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**주의:** `/절대경로/ServerMonitor_T/`를 실제 프로젝트 경로로 변경해주세요.

### 3. Claude Desktop 재시작
설정을 저장한 후 Claude Desktop을 재시작하세요.

## 사용 예시

### 시스템 정보 확인
```
서버의 현재 시스템 상태를 알려주세요.
```

### Docker 컨테이너 모니터링
```
실행 중인 Docker 컨테이너들의 상태를 확인해주세요.
```

### 로그 분석
```
web-server 컨테이너의 최근 24시간 로그를 분석해서 문제점을 찾아주세요.
```

### 컨테이너 재시작
```
nginx-proxy 컨테이너에 문제가 있는 것 같습니다. 재시작해주세요.
```

### 종합 상태 점검
```
서버의 전반적인 상태를 점검하고 문제점이나 개선사항을 알려주세요.
```

## 문제 해결

### MCP 서버 연결 실패
1. 설정 파일 경로가 정확한지 확인
2. Node.js가 설치되어 있는지 확인
3. 프로젝트가 빌드되었는지 확인 (`npm run build`)
4. Claude Desktop을 재시작

### Docker 관련 오류
1. Docker가 실행 중인지 확인
2. 사용자가 docker 그룹에 속해있는지 확인
3. Docker 소켓 권한 확인

### 권한 오류
Ubuntu 서버에서 실행할 때:
```bash
# Docker 그룹에 사용자 추가
sudo usermod -aG docker $USER

# 재로그인 후 확인
groups $USER
```
