FROM node:18-alpine

# 필요한 시스템 패키지 설치
RUN apk add --no-cache \
    docker-cli \
    procps \
    coreutils

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# 로그 디렉토리 생성
RUN mkdir -p logs

# 비특권 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 앱 디렉토리 소유권 변경
RUN chown -R nextjs:nodejs /app
USER nextjs

# 포트 노출
EXPOSE 8300

# 애플리케이션 시작 (HTTP 서버 모드)
CMD ["npm", "run", "start:server"]
