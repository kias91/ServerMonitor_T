# 서버 모니터링 MCP (Model Context Protocol) 서버

## 개요

이 프로젝트는 우분투 서버의 자원 모니터링, Docker 컨테이너 상태 모니터링, 로그 분석 등을 제공하는 MCP 서버입니다. AI 도구와 연동하여 서버 모니터링을 자동화하고 인텔리전트한 서버 관리를 가능하게 합니다.

## 주요 기능

### 🖥️ 서버 자원 모니터링
- CPU 사용률 및 온도 모니터링
- 메모리 사용률 추적
- 디스크 사용량 모니터링
- 네트워크 I/O 상태 확인
- 시스템 업타임 및 기본 정보

### 🐳 Docker 서비스 모니터링
- 실행 중인 컨테이너 목록 조회
- 컨테이너별 리소스 사용량 모니터링
- 컨테이너 상태 및 포트 정보
- 컨테이너 재시작 기능

### 📊 로그 분석
- Docker 컨테이너 로그 수집
- 에러 및 경고 패턴 자동 감지
- 로그 분석 및 문제점 진단
- 개선 권장사항 제공

### 🏥 종합 헬스 체크
- 서버 전반적인 상태 평가
- 성능 점수 산출
- 문제점 및 권장사항 제공

## 설치 및 실행

### 전제 조건
- Node.js 18 이상
- Docker (모니터링 대상)
- Ubuntu/Linux 환경

### 빠른 설치
```bash
# 저장소 클론
git clone <repository-url>
cd ServerMonitor_T

# 자동 설치 스크립트 실행
./scripts/install.sh
```

### 수동 설치
```bash
# 의존성 설치
npm install

# TypeScript 빌드
npm run build

# 환경 변수 설정
cp .env.example .env
# .env 파일을 환경에 맞게 수정

# 로그 디렉토리 생성
mkdir -p logs
```

## 실행 방법

### 1. 개발 모드
```bash
npm run dev
```

### 2. PM2로 프로덕션 실행
```bash
# PM2 시작
npm run pm2:start

# 로그 확인
npm run pm2:logs

# 서비스 중지
npm run pm2:stop

# 서비스 재시작
npm run pm2:restart
```

### 3. Docker로 실행
```bash
# Docker 이미지 빌드 및 실행
npm run docker:build
npm run docker:run

# 또는 Docker Compose 사용
docker-compose up -d
```

### 4. 자동 배포 스크립트
```bash
# PM2 모드로 배포
./scripts/deploy.sh pm2

# Docker 모드로 배포
./scripts/deploy.sh docker

# Docker Compose 모드로 배포
./scripts/deploy.sh compose
```

## MCP 도구 목록

### `get_system_info`
서버의 시스템 정보를 가져옵니다 (CPU, 메모리, 디스크 사용량 등)

### `get_docker_containers`
실행 중인 Docker 컨테이너 목록을 가져옵니다
- `all` (boolean): 중지된 컨테이너도 포함할지 여부

### `get_container_stats`
특정 Docker 컨테이너의 리소스 사용량을 가져옵니다
- `containerId` (string): 컨테이너 ID 또는 이름

### `get_container_logs`
특정 Docker 컨테이너의 로그를 가져옵니다
- `containerId` (string): 컨테이너 ID 또는 이름
- `lines` (number): 가져올 로그 라인 수 (기본값: 100)

### `analyze_container_logs`
Docker 컨테이너 로그를 분석하여 에러나 경고를 찾습니다
- `containerId` (string): 컨테이너 ID 또는 이름
- `hours` (number): 분석할 시간 범위 (기본값: 24시간)

### `restart_container`
Docker 컨테이너를 재시작합니다
- `containerId` (string): 컨테이너 ID 또는 이름

### `get_server_health`
서버의 전반적인 상태를 종합적으로 점검합니다

## 사용 예시

### AI와 연동 사용법

```python
# AI 도구에서 MCP 서버와 연동하여 사용하는 예시

# 1. 서버 상태 종합 점검
response = mcp_client.call_tool("get_server_health")

# 2. 특정 컨테이너 로그 분석
response = mcp_client.call_tool("analyze_container_logs", {
    "containerId": "web-server",
    "hours": 24
})

# 3. 컨테이너 재시작
response = mcp_client.call_tool("restart_container", {
    "containerId": "failing-service"
})
```

## 프로젝트 구조

```
ServerMonitor_T/
├── src/
│   ├── index.ts              # MCP 서버 메인 파일
│   └── services/
│       ├── serverMonitor.ts  # 시스템 모니터링 서비스
│       ├── dockerMonitor.ts  # Docker 모니터링 서비스
│       └── logAnalyzer.ts    # 로그 분석 서비스
├── scripts/
│   ├── install.sh           # 설치 스크립트
│   └── deploy.sh            # 배포 스크립트
├── dist/                    # 빌드된 JavaScript 파일
├── logs/                    # 로그 파일
├── package.json
├── tsconfig.json
├── ecosystem.config.js      # PM2 설정
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 환경 변수

`.env` 파일에서 다음 환경 변수를 설정할 수 있습니다:

```bash
# 서버 포트
MCP_PORT=8300

# 노드 환경
NODE_ENV=production

# 로그 레벨
LOG_LEVEL=info

# Docker 소켓 경로
DOCKER_SOCKET_PATH=/var/run/docker.sock

# 모니터링 간격 (초)
MONITORING_INTERVAL=60

# 도메인 설정
DOMAIN=podo-life.co.kr
```

## 보안 고려사항

1. **Docker 소켓 접근**: Docker 소켓에 대한 읽기 전용 접근이 필요합니다
2. **사용자 권한**: Docker 그룹에 속한 사용자로 실행해야 합니다
3. **네트워크 보안**: 필요한 경우 HTTPS 설정을 통해 보안 통신을 구성하세요

## 문제 해결

### Docker 컨테이너가 계속 재시작되는 경우

**문제**: Docker 컨테이너가 시작되자마자 종료되어 계속 재시작됩니다.

**원인**: MCP 서버가 stdio 전송을 사용하는데, Docker 컨테이너에서는 stdin이 연결되지 않아 프로세스가 바로 종료됩니다.

**해결방법**: 
1. HTTP 서버 모드를 사용하세요:
```bash
# 업데이트된 배포 스크립트 사용
./scripts/update-deploy.sh

# 또는 수동으로 HTTP 서버 모드 실행
docker run -d --name server-monitor-mcp -p 8300:8300 -e DOCKER_ENV=true server-monitor-mcp
```

2. 헬스 체크로 서버 상태 확인:
```bash
curl http://localhost:8300/health
```

### Docker 권한 문제
```bash
sudo usermod -aG docker $USER
# 재로그인 후 확인
groups $USER
```

### PM2 서비스 상태 확인
```bash
pm2 status
pm2 logs server-monitor-mcp
```

### Docker 컨테이너 상태 확인
```bash
docker ps
docker logs server-monitor-mcp
```

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이센스

MIT License

## 연락처

프로젝트와 관련된 문의사항이 있으시면 이슈를 생성해주세요.

---

**참고**: 이 프로젝트는 MCP 파일럿 프로젝트로, 필수 기능 구현에 집중하여 빠르고 간편하게 구축되었습니다.
