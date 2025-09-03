#!/bin/bash

# 서버 모니터링 MCP 설치 스크립트

set -e

echo "🚀 서버 모니터링 MCP 설치를 시작합니다..."

# 프로젝트 디렉토리로 이동
cd "$(dirname "$0")/.."

# Node.js 버전 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "Node.js 18 이상을 설치해주세요: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 버전이 너무 낮습니다. (현재: $(node -v), 필요: v18+)"
    exit 1
fi

echo "✅ Node.js 버전 확인: $(node -v)"

# PM2 설치 확인
if ! command -v pm2 &> /dev/null; then
    echo "🔧 PM2를 설치합니다..."
    npm install -g pm2
fi

echo "✅ PM2 설치 확인: $(pm2 -v)"

# 프로젝트 의존성 설치
echo "📦 프로젝트 의존성을 설치합니다..."
npm install

# TypeScript 빌드
echo "🔨 TypeScript 빌드를 실행합니다..."
npm run build

# 로그 디렉토리 생성
echo "📁 로그 디렉토리를 생성합니다..."
mkdir -p logs

# 환경 변수 설정
if [ ! -f .env ]; then
    echo "⚙️ 환경 변수 파일을 생성합니다..."
    cp .env.example .env
    echo "📝 .env 파일을 수정하여 환경에 맞게 설정해주세요."
fi

# Docker 권한 확인
if groups $USER | grep &>/dev/null '\bdocker\b'; then
    echo "✅ Docker 권한 확인됨"
else
    echo "⚠️  현재 사용자가 docker 그룹에 속해있지 않습니다."
    echo "다음 명령어로 docker 그룹에 추가할 수 있습니다:"
    echo "sudo usermod -aG docker $USER"
    echo "그 후 다시 로그인해주세요."
fi

echo ""
echo "🎉 설치가 완료되었습니다!"
echo ""
echo "사용 방법:"
echo "  개발 모드 실행: npm run dev"
echo "  프로덕션 빌드: npm run build"
echo "  PM2로 서비스 시작: npm run pm2:start"
echo "  PM2 로그 확인: npm run pm2:logs"
echo "  PM2 서비스 중지: npm run pm2:stop"
echo ""
echo "Docker로 실행:"
echo "  Docker 이미지 빌드: npm run docker:build"
echo "  Docker 컨테이너 실행: npm run docker:run"
echo "  Docker Compose 실행: docker-compose up -d"
echo ""
