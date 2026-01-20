## 거북스쿨 백엔드 Nest

**도메인**: v2.ingipsy.com
**관리자 페이지**: https://admin2.turtleskool.com

---

## 🚀 빠른 시작

### 필수 요구사항

- Node.js v18.x 이상
- Yarn 1.22.x
- Docker Desktop (PostgreSQL용)

### 개발 환경 설정

**자세한 설정 가이드는 [DEVELOPMENT-SETUP.md](./DEVELOPMENT-SETUP.md)를 참조하세요.**

```bash
# 1. 저장소 클론
git clone <repository-url>
cd Hub-Backend

# 2. 의존성 설치
yarn install

# 3. 환경 변수 설정
cp .env.example .env.development
# .env.development 파일을 편집하여 실제 값 입력

# 4. PostgreSQL 시작 (Docker)
# Windows
setup-db.bat

# Linux/Mac
chmod +x setup-db.sh
./setup-db.sh

# 5. 서버 실행
yarn start:dev
```

### 주요 명령어

```bash
# 개발 모드
yarn start:dev

# 프로덕션 빌드
yarn build
yarn start:prod

# 테스트
yarn test
yarn test:e2e

# 린팅 & 포맷팅
yarn lint
yarn format
```

---

## 📚 문서

- [개발 환경 설정 가이드](./DEVELOPMENT-SETUP.md) - 상세한 설정 및 문제 해결
- [API 문서](http://localhost:4001/swagger) - Swagger UI (서버 실행 후)

---

## 🔧 기술 스택

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.1.3
- **Database**: PostgreSQL (운영), Docker PostgreSQL (개발)
- **ORM**: TypeORM 0.3.20
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston
- **Monitoring**: Sentry
- **Caching**: Redis
- **Payment**: Iamport
- **SMS**: Aligo
- **Cloud**: Firebase Admin SDK

### EC2 환경세팅

1. E2 생성 (backend vpc에 생성해야함\*)

2. 보안그룹 설정 (서버 포트 4000 오픈)

3. 도커 설치

```sh
# Docker 설치
sudo yum install -y docker

# ec2-user를 docker 그룹에 추가
sudo usermod -aG docker ec2-user

# Docker 서비스 시작 및 부팅 시 자동 시작 설정
sudo systemctl enable --now docker

# 현재 셸을 새로고침하여 그룹 변경 적용
exec bash

# Docker 데몬이 실행 중인지 확인(안된다면 재연결)
docker ps
```

4. 도커 컴포즈 설치

```sh
# Docker CLI 플러그인 디렉토리 생성
sudo mkdir -p /usr/local/lib/docker/cli-plugins/

# Docker Compose 바이너리 다운로드
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose

# Docker Compose 바이너리에 실행 권한 추가
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Docker Compose 버전 확인
docker compose version
```

5. Ec2 생성 시 .pem파일 교체 및 깃허브 secrets(SERVER_SSH_KEY) 파일내용으로 수정
# Updated
