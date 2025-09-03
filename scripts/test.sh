#!/bin/bash

# 간단한 MCP 서버 테스트 스크립트

echo "🧪 MCP 서버 테스트를 시작합니다..."

# Node.js가 설치되어 있는지 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    exit 1
fi

# 빌드 파일이 있는지 확인
if [ ! -f "dist/index.js" ]; then
    echo "🔨 빌드 파일이 없습니다. 빌드를 실행합니다..."
    npm run build
fi

echo "✅ 빌드 완료"

# Docker가 실행 중인지 확인
if ! docker info &> /dev/null; then
    echo "⚠️  Docker가 실행되고 있지 않습니다. Docker 모니터링 기능이 제한될 수 있습니다."
else
    echo "✅ Docker 서비스 확인됨"
fi

echo ""
echo "🚀 MCP 서버가 준비되었습니다!"
echo ""
echo "사용 방법:"
echo "1. AI 도구에서 이 MCP 서버를 연결하세요"
echo "2. 사용 가능한 도구들:"
echo "   - get_system_info: 시스템 정보 조회"
echo "   - get_docker_containers: Docker 컨테이너 목록"
echo "   - get_container_logs: 컨테이너 로그 조회"
echo "   - analyze_container_logs: 로그 분석"
echo "   - get_server_health: 서버 상태 점검"
echo ""
echo "서버 시작하려면 다음 명령어를 사용하세요:"
echo "  개발 모드: npm run dev"
echo "  프로덕션: npm run pm2:start"
echo ""
