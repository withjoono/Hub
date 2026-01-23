# Cloud Run 배포 트러블슈팅 가이드

## 배포 실패 원인 분석 (2026-01-22)

### 문제 해결 타임라인
총 8개의 커밋으로 5가지 주요 문제를 해결하여 Cloud Run 배포 성공

---

## 1️⃣ DATABASE_URL 파싱 실패 (Critical)

### 증상
```
Error: Invalid DATABASE_URL format. Expected: postgresql://user:password@host:port/database
    at InstanceWrapper.metatype (/app/dist/database/config/database-config.js:92:19)
```

### 원인
Cloud SQL Unix Socket 연결 형식이 표준 URL 파서로 처리되지 않음
```
postgresql://tsuser:password@/database?host=/cloudsql/PROJECT:REGION:INSTANCE
                              ↑ 호스트명 없이 @/ 형식 사용
```

JavaScript의 `new URL()` 생성자는 호스트가 없는 `@/` 형식을 인식하지 못함

### 해결 방법
**파일**: `src/database/config/database-config.ts`

1. **공백/개행 제거**: Secret Manager에서 가져온 값에 불필요한 문자가 포함될 수 있음
```typescript
const databaseUrl = process.env.DATABASE_URL.trim();
```

2. **Cloud SQL 형식 감지**: URL에 `?host=/cloudsql/` 포함 여부 확인

3. **정규식 수동 파싱**: 표준 URL 파서 대신 정규식 사용
```typescript
const match = databaseUrl.match(/^postgresql:\/\/([^:]+):([^@]+)@\/([^?]+)\?host=(.+)$/);
const [, username, password, database, socketPath] = match;

return {
  type: 'postgres',
  host: socketPath,  // Unix 소켓 경로
  port: undefined,   // Unix 소켓은 포트 불필요
  password,
  name: database,
  username,
  synchronize: false,
};
```

4. **상세 로깅**: 디버깅을 위한 마스킹된 URL 출력
```typescript
const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
console.log('🔗 DATABASE_URL 감지:', maskedUrl);
```

### 관련 커밋
- e1ad51a: 초기 파싱 시도
- e711ee6: Unix 소켓 연결 지원 추가
- 5bd8e00: 디버깅 로깅 추가
- c0cfee5: 정규식 수동 파싱으로 변경
- 8746d7b: trim() 추가 및 정규식 개선

---

## 2️⃣ Redis 연결 타임아웃 (Critical)

### 증상
- Container failed to start within timeout
- 애플리케이션이 무한 대기 상태로 진입하여 Cloud Run 헬스체크 실패

### 원인
Cloud Run 환경에 Redis가 기본적으로 제공되지 않음. `localhost:6379` 연결 시도가 타임아웃될 때까지 대기

### 해결 방법
**파일**: `src/app.module.ts`

Redis를 선택적으로 만들고 연결 실패 시 메모리 캐시로 폴백
```typescript
CacheModule.registerAsync({
  isGlobal: true,
  useFactory: async () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const redisHost = process.env.REDIS_HOST;

    // Redis 설정이 없으면 메모리 캐시 사용
    if (isProduction && !redisHost) {
      console.log('⚠️  Redis 미설정 - 메모리 캐시 사용 (Cloud Run)');
      return { ttl: 300000 };
    }

    try {
      const store = await redisStore({
        socket: {
          host: redisHost || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          connectTimeout: 5000,  // 5초 타임아웃
        },
        keyPrefix: 'hub-',
        ttl: 300000,
      });
      console.log(`✅ Redis 연결 성공`);
      return { store, ttl: 300000 };
    } catch (error) {
      console.warn('⚠️  Redis 연결 실패 - 메모리 캐시로 폴백:', error.message);
      return { ttl: 300000 };
    }
  },
}),
```

### 관련 커밋
- cae77e3: Redis 선택적 연결 구현

---

## 3️⃣ 환경 변수 이름 불일치 (High)

### 증상
```
An instance of EnvironmentVariablesValidator has failed the validation:
 - property AUTH_JWT_SECRET has failed the following constraints: isString
 - property AUTH_REFRESH_SECRET has failed the following constraints: isString
```

### 원인
Secret Manager 시크릿과 Cloud Run 환경 변수 매핑이 잘못됨
- Secret Manager: `jwt-secret`, `auth-secret`
- 잘못된 매핑: `JWT_SECRET`, `AUTH_SECRET`
- 올바른 이름: `AUTH_JWT_SECRET`, `AUTH_REFRESH_SECRET`

### 해결 방법
**파일**: `.github/workflows/deploy-backend.yml`

Secret Manager 시크릿을 올바른 환경 변수 이름으로 매핑
```yaml
--update-secrets="
  DATABASE_URL=database-url:latest,
  AUTH_JWT_SECRET=jwt-secret:latest,
  AUTH_REFRESH_SECRET=auth-secret:latest,
  FIREBASE_SERVICE_ACCOUNT=firebase-service-account:latest"
```

### 검증 방법
`src/auth/config/auth-config.ts`에서 요구하는 환경 변수 이름 확인
```typescript
class EnvironmentVariablesValidator {
  @IsString()
  AUTH_JWT_SECRET: string;  // ← 정확히 이 이름이어야 함

  @IsString()
  AUTH_REFRESH_SECRET: string;  // ← 정확히 이 이름이어야 함
}
```

### 관련 커밋
- 0365b1f: 환경 변수 매핑 수정

---

## 4️⃣ 필수 환경 변수 누락 (Medium)

### 증상
```
An instance of EnvironmentVariablesValidator has failed the validation:
 - property IMP_KEY has failed the following constraints: isString
 - property IMP_SECRET has failed the following constraints: isString
 - property IMP_STORE_CODE has failed the following constraints: isString
```

### 원인
Iamport 결제 시스템 관련 환경 변수가 Cloud Run 배포에 포함되지 않음

### 해결 방법
**파일**: `.github/workflows/deploy-backend.yml`

테스트 모드 환경 변수 추가
```yaml
--set-env-vars="
  NODE_ENV=production,
  AUTH_JWT_TOKEN_EXPIRES_IN=7200000,
  AUTH_REFRESH_TOKEN_EXPIRES_IN=5184000000,
  IMP_KEY=test_key,
  IMP_SECRET=test_secret,
  IMP_STORE_CODE=test_store,
  ALIGO_TEST_MODE=true,
  GCS_PROJECT_ID=ts-back-nest-479305,
  GCS_BUCKET_NAME=ts-back-nest-bk,
  GCS_PUBLIC_URL=https://storage.googleapis.com/ts-back-nest-bk"
```

### 프로덕션 배포 시 주의사항
실제 Iamport 자격 증명은 다음 방법 중 하나로 설정:
1. **Secret Manager 사용** (권장)
```bash
gcloud secrets create imp-key --data-file=-
gcloud secrets create imp-secret --data-file=-
```

2. **Cloud Run Console에서 직접 설정**
```
Cloud Run → geobukschool-backend → 수정 → 변수 및 비밀
```

### 관련 커밋
- e8a2b30: 기본 환경 변수 추가

---

## 5️⃣ GitHub Secret 스캔 차단 (Low)

### 증상
```
remote: error: GH013: Repository rule violations found for refs/heads/main
remote: - Push cannot contain secrets
remote: - Slack Incoming Webhook URL
```

### 원인
Slack webhook URL이 워크플로우 파일에 직접 포함되어 GitHub의 secret scanning에 감지됨

### 해결 방법
1. **커밋 롤백**
```bash
git reset --soft HEAD~1
```

2. **민감한 값 제거**: 워크플로우 파일에서 실제 webhook URL 제거

3. **Secret Manager 권장**: 민감한 자격 증명은 모두 Secret Manager에 저장
```bash
gcloud secrets create slack-webhook --data-file=-
```

### 관련 커밋
- e8a2b30: 민감한 정보 제거 후 재커밋

---

## 추가 개선 사항

### PORT 환경 변수 처리
**파일**: `src/main.ts`

Cloud Run은 PORT를 문자열로 제공하므로 명시적 변환 필요
```typescript
const appPort = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : configService.getOrThrow('app', { infer: true }).port;
```

**관련 커밋**: c9207dd

---

## 최종 배포 성공 구성

### Secret Manager 시크릿
```
database-url: postgresql://tsuser:password@/geobukschool_prod?host=/cloudsql/ts-back-nest-479305:asia-northeast3:geobuk-db
jwt-secret: <base64-encoded>
auth-secret: <base64-encoded>
firebase-service-account: <JSON 자격 증명>
```

### Cloud Run 환경 변수
```yaml
NODE_ENV: production
AUTH_JWT_TOKEN_EXPIRES_IN: 7200000
AUTH_REFRESH_TOKEN_EXPIRES_IN: 5184000000
IMP_KEY: test_key
IMP_SECRET: test_secret
IMP_STORE_CODE: test_store
ALIGO_TEST_MODE: true
GCS_PROJECT_ID: ts-back-nest-479305
GCS_BUCKET_NAME: ts-back-nest-bk
GCS_PUBLIC_URL: https://storage.googleapis.com/ts-back-nest-bk
```

### Cloud SQL 연결
```yaml
--add-cloudsql-instances: ts-back-nest-479305:asia-northeast3:geobuk-db
```

---

## 베스트 프랙티스

### 1. DATABASE_URL 설정
- ✅ Cloud SQL Unix Socket 형식 사용: `postgresql://user:pass@/db?host=/cloudsql/...`
- ✅ Secret Manager에 저장
- ✅ 공백/개행 제거를 위한 `.trim()` 사용
- ❌ 절대 코드에 하드코딩하지 않기

### 2. Redis 설정
- ✅ 운영 환경에서 선택적으로 설정
- ✅ 연결 실패 시 메모리 캐시 폴백
- ✅ 연결 타임아웃 설정 (5초)
- ❌ 필수 의존성으로 만들지 않기

### 3. 환경 변수 검증
- ✅ `class-validator`로 필수 변수 검증
- ✅ 환경별 설정 파일 분리 (`.env.development`, `.env.production`)
- ✅ 타입 안전성 보장 (`EnvironmentVariablesValidator`)
- ❌ 프로덕션에서 기본값 사용하지 않기

### 4. 시크릿 관리
- ✅ 민감한 정보는 Secret Manager 사용
- ✅ GitHub Secrets으로 CI/CD 파이프라인 관리
- ✅ 워크플로우 파일에서 실제 값 제거
- ❌ 절대 git에 커밋하지 않기

### 5. 배포 검증
- ✅ 로컬에서 프로덕션 환경 변수로 테스트
- ✅ Cloud Run 로그 모니터링
- ✅ Swagger 문서로 API 동작 확인
- ✅ 헬스체크 엔드포인트 설정

---

## 디버깅 팁

### Cloud Run 로그 확인
```bash
gcloud run services logs read geobukschool-backend \
  --region asia-northeast3 \
  --limit 50
```

### Secret Manager 시크릿 확인
```bash
gcloud secrets versions access latest --secret=database-url
```

### 로컬에서 프로덕션 환경 테스트
```bash
# .env.production 파일 생성
DATABASE_URL="postgresql://..."
NODE_ENV=production
AUTH_JWT_SECRET="..."

# 빌드 및 실행
yarn build
yarn start:prod
```

### DATABASE_URL 파싱 테스트
```typescript
// 간단한 테스트 스크립트
const url = "postgresql://tsuser:password@/database?host=/cloudsql/project:region:instance";
const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@\/([^?]+)\?host=(.+)$/);
console.log(match);  // [전체매칭, username, password, database, socketPath]
```

---

## 참고 문서

- [Cloud SQL Unix 소켓 연결](https://cloud.google.com/sql/docs/postgres/connect-run)
- [Cloud Run 환경 변수](https://cloud.google.com/run/docs/configuring/environment-variables)
- [Secret Manager 가이드](https://cloud.google.com/secret-manager/docs/creating-and-accessing-secrets)
- [GitHub Actions 시크릿](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
