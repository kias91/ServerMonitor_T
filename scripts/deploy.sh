#!/bin/bash

# 서버 모니터링 MCP 배포 스크립트

set -e

echo "🚀 서버 모니터링 MCP 배포를 시작합니다..."

# 환경 변수 설정
DEPLOY_MODE=${1:-pm2}  # pm2 또는 docker
SERVICE_NAME="server-monitor-mcp"

case $DEPLOY_MODE in
    "pm2")
        echo "📦 PM2 모드로 배포합니다..."
        
        # 기존 서비스 중지
        if pm2 describe $SERVICE_NAME > /dev/null 2>&1; then
            echo "🛑 기존 서비스를 중지합니다..."
            pm2 stop $SERVICE_NAME
            pm2 delete $SERVICE_NAME
        fi
        
        # 빌드
        echo "🔨 애플리케이션을 빌드합니다..."
        npm run build
        
        # PM2로 시작
        echo "▶️  PM2로 서비스를 시작합니다..."
        npm run pm2:start
        
        # 상태 확인
        sleep 3
        pm2 status
        
        echo "✅ PM2 배포가 완료되었습니다!"
        echo "로그 확인: pm2 logs $SERVICE_NAME"
        ;;
        
    "docker")
        echo "🐳 Docker 모드로 배포합니다..."
        
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
        
        # 컨테이너 실행
        echo "▶️  Docker 컨테이너를 실행합니다..."
        docker run -d \
            --name $SERVICE_NAME \
            --restart unless-stopped \
            -p 8300:8300 \
            -v /var/run/docker.sock:/var/run/docker.sock:ro \
            -v "$(pwd)/logs:/app/logs" \
            $SERVICE_NAME
        
        # 상태 확인
        sleep 3
        docker ps | grep $SERVICE_NAME
        
        echo "✅ Docker 배포가 완료되었습니다!"
        echo "로그 확인: docker logs $SERVICE_NAME"
        ;;
        
    "compose")
        echo "🐳 Docker Compose 모드로 배포합니다..."
        
        # 기존 서비스 중지
        echo "🛑 기존 서비스를 중지합니다..."
        docker-compose down || true
        
        # 이미지 빌드 및 서비스 시작
        echo "🔨 Docker Compose로 빌드 및 실행합니다..."
        docker-compose up -d --build
        
        # 상태 확인
        sleep 5
        docker-compose ps
        
        echo "✅ Docker Compose 배포가 완료되었습니다!"
        echo "로그 확인: docker-compose logs -f"
        ;;
        
    *)
        echo "❌ 지원하지 않는 배포 모드입니다: $DEPLOY_MODE"
        echo "사용법: $0 [pm2|docker|compose]"
        exit 1
        ;;
esac

echo ""
echo "🎉 배포가 완료되었습니다!"
echo "서비스가 http://localhost:8300 에서 실행 중입니다."
