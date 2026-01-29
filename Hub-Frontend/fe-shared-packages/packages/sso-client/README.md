# SSO Client Library

Hub SSO 시스템을 위한 공유 클라이언트 라이브러리입니다.

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Hub (geobukschool.kr)                     │
│                   SSO 중앙 인증 서버                          │
│                                                              │
│  useSSOProvider()                                            │
│  - postMessage 리스너 등록                                   │
│  - 토큰 요청 수신 시 토큰 전달                                │
└─────────────────────────────────────────────────────────────┘
                              │
                    postMessage (안전)
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  수시 서비스   │   │  정시 서비스   │   │  기타 서비스   │
│               │   │               │   │               │
│  useSSOInit() │   │  useSSOInit() │   │  useSSOInit() │
│  토큰 요청    │   │  토큰 요청    │   │  토큰 요청    │
│  토큰 수신    │   │  토큰 수신    │   │  토큰 수신    │
└───────────────┘   └───────────────┘   └───────────────┘
```

## URL 방식 vs postMessage 방식

| 방식 | URL 파라미터 | postMessage |
|------|-------------|-------------|
| 보안 | ⚠️ 히스토리/로그 노출 | ✅ 노출 없음 |
| Referrer 유출 | ⚠️ 가능 | ✅ 없음 |

**postMessage 방식을 권장합니다.**

---

## Hub에서 사용 (토큰 발급자)

### 1. SSO Provider 훅 사용

```typescript
// src/hooks/use-sso-provider.ts 사용
import { useSSOProvider } from '@/hooks/use-sso-provider';

function ServiceLinks() {
  const { openSSOService, isSSOService, getTokens } = useSSOProvider();

  const handleOpenSusi = () => {
    // postMessage로 토큰 전달 (URL 노출 없음)
    openSSOService('https://susi.geobukschool.kr');
  };

  return <button onClick={handleOpenSusi}>수시 서비스</button>;
}
```

### 2. 플로우

1. 사용자가 "수시 서비스" 버튼 클릭
2. 새 창으로 수시 앱 열기 (`window.open`)
3. 수시 앱에서 `SSO_TOKEN_REQUEST` 메시지 전송
4. Hub에서 `SSO_TOKEN_RESPONSE`로 토큰 전달

---

## 독립 앱에서 사용 (토큰 수신자)

### 1. 라이브러리 복사

```bash
# Hub에서 sso-client 폴더 복사
cp -r Hub-Frontend/fe-shared-packages/packages/sso-client ./src/lib/sso-client
```

### 2. 환경변수 설정

```bash
# .env
VITE_HUB_URL=https://geobukschool.kr

# 개발 환경
# VITE_HUB_URL=http://localhost:3000
```

### 3. 앱 진입점에 SSO 초기화

```typescript
// App.tsx
import { useEffect, useRef } from 'react';
import { setTokens } from '@/lib/token-manager';

const HUB_URL = import.meta.env.VITE_HUB_URL || 'http://localhost:3000';

function App() {
  const hasRequested = useRef(false);

  // 1. Hub에 토큰 요청
  useEffect(() => {
    if (hasRequested.current || !window.opener) return;
    hasRequested.current = true;

    window.opener.postMessage(
      { type: 'SSO_TOKEN_REQUEST', requestId: `req_${Date.now()}` },
      HUB_URL
    );
  }, []);

  // 2. postMessage 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const hubOrigin = new URL(HUB_URL).origin;
      if (event.origin !== hubOrigin) return;

      const data = event.data;
      if (data?.type === 'SSO_TOKEN_RESPONSE' && data.tokens) {
        console.log('✅ SSO 토큰 수신');
        setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      }
      if (data?.type === 'SSO_LOGOUT') {
        console.log('🔒 로그아웃');
        clearTokens();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return <RouterProvider router={router} />;
}
```

### 4. 또는 공유 훅 사용

```typescript
import { useSSOReceiver } from '@/lib/sso-client';

function App() {
  useSSOReceiver({
    hubUrl: import.meta.env.VITE_HUB_URL,
    allowedOrigins: [import.meta.env.VITE_HUB_URL],
    onTokensReceived: (tokens) => {
      setTokens(tokens.accessToken, tokens.refreshToken);
    },
    onLogout: () => {
      clearTokens();
    },
  });

  return <RouterProvider router={router} />;
}
```

---

## API Reference

### Types

```typescript
interface SSOTokens {
  accessToken: string;
  refreshToken: string;
  tokenExpiry?: number;
}

interface SSOPostMessageData {
  type: 'SSO_TOKEN_REQUEST' | 'SSO_TOKEN_RESPONSE' | 'SSO_LOGOUT';
  tokens?: SSOTokens;
  error?: string;
  requestId?: string;
}
```

### Token Validation

```typescript
import { validateToken, isTokenExpired, getTokenExpiry } from '@/lib/sso-client';

// 토큰 종합 검증
const result = validateToken(token);
// { isValid: true, payload: {...}, expiry: 1234567890 }

// 만료 여부 확인
const expired = isTokenExpired(token);

// 만료 시간 추출
const expiry = getTokenExpiry(token);
```

### Origin Validation

```typescript
import { isAllowedOrigin } from '@/lib/sso-client';

// 허용된 도메인인지 확인
const allowed = isAllowedOrigin('https://susi.geobukschool.kr');
// true
```

---

## 보안 고려사항

1. **Origin 검증 필수**: postMessage 수신 시 항상 `event.origin` 확인
2. **허용 도메인 제한**: `allowed-origins.ts`에 허용 도메인 명시
3. **토큰 검증**: 수신한 토큰은 반드시 `validateToken()`으로 검증
4. **HTTPS 사용**: 프로덕션에서는 반드시 HTTPS 사용

---

## 파일 구조

```
sso-client/
├── index.ts              # 배럴 export
├── types.ts              # 타입 정의
├── token-validator.ts    # JWT 검증
├── allowed-origins.ts    # Origin 검증
├── sso-receiver.ts       # 토큰 수신 (독립 앱용)
├── sso-sender.ts         # 토큰 전송 (Hub용)
├── hooks.ts              # React Hooks
├── templates/
│   └── independent-app-setup.ts  # 독립 앱 설정 템플릿
└── README.md
```
