#!/bin/bash

# 서버 모니터링 MCP 업데이트 배포 스크립트

set -e

echo "🔄 기존 컨테이너를 중지하고 새 버전을 배포합니다..."

SERVICE_NAME="server-monitor-mcp"

# 기존 컨테이너 중지 및 제거
if docker ps -a | grep -q $SERVICE_NAME; then
    echo "🛑 기존 컨테이너를 중지하고 제거합니다..."
    docker stop $SERVICE_NAME || true
    docker rm $SERVICE_NAME || true
fi

# 기존 이미지 제거
if docker images | grep -q $SERVICE_NAME; then
    echo "🗑️  기존 이미지를 제거합니다..."
    docker rmi $SERVICE_NAME || true
fi

# 새 이미지 빌드
echo "🔨 Docker 이미지를 빌드합니다..."
docker build -t $SERVICE_NAME .

# 컨테이너 실행 (HTTP 서버 모드)
echo "▶️  Docker 컨테이너를 실행합니다..."
docker run -d \
    --name $SERVICE_NAME \
    --restart unless-stopped \
    -p 8300:8300 \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    -v "$(pwd)/logs:/app/logs" \
    -e NODE_ENV=production \
    -e MCP_PORT=8300 \
    -e DOCKER_ENV=true \
    $SERVICE_NAME

# 잠시 대기 후 상태 확인
echo "⏳ 컨테이너 시작을 기다리는 중..."
sleep 5

# 컨테이너 상태 확인
echo "📊 컨테이너 상태:"
docker ps | grep $SERVICE_NAME

# 헬스 체크
echo "🏥 헬스 체크를 시도합니다..."
sleep 3
curl -s http://localhost:8300/health | jq . || echo "헬스 체크 실패 (jq가 설치되지 않았거나 서버가 준비되지 않음)"

echo ""
echo "✅ 배포가 완료되었습니다!"
echo "🌐 서비스 URL: http://localhost:8300"
echo "🏥 헬스 체크: http://localhost:8300/health"
echo "📊 서버 정보: http://localhost:8300/info"
echo ""
echo "📋 유용한 명령어:"
echo "  로그 확인: docker logs -f $SERVICE_NAME"
echo "  컨테이너 중지: docker stop $SERVICE_NAME"
echo "  컨테이너 시작: docker start $SERVICE_NAME"
