/**
 * ============================================================
 * 독립 앱 SSO 설정 템플릿
 * ============================================================
 *
 * 이 파일은 독립 앱(수시, 정시 등)에서 Hub의 SSO 토큰을
 * postMessage로 수신하기 위한 설정 템플릿입니다.
 *
 * 사용 방법:
 * 1. sso-client 폴더를 독립 앱의 src/lib/sso-client로 복사
 * 2. 이 파일의 내용을 참고하여 앱에 통합
 */

// ============================================================
// 1. 환경변수 설정 (.env)
// ============================================================
/*
# Hub URL 설정
VITE_HUB_URL=https://geobukschool.kr

# 개발 환경
# VITE_HUB_URL=http://localhost:3000
*/

// ============================================================
// 2. SSO 클라이언트 라이브러리 복사
// ============================================================
/*
독립앱/
├── src/
│   └── lib/
│       └── sso-client/           # Hub에서 복사
│           ├── index.ts
│           ├── types.ts
│           ├── token-validator.ts
│           ├── allowed-origins.ts
│           ├── sso-receiver.ts
│           └── hooks.ts
*/

// ============================================================
// 3. 앱 진입점 설정 (App.tsx 또는 main.tsx)
// ============================================================

import { useEffect, useRef } from 'react';

// SSO 클라이언트 라이브러리 (복사 후 경로에 맞게 수정)
// import { useSSOReceiver, extractTokensFromUrl, type SSOTokens } from '@/lib/sso-client';

// 예시: 토큰 저장 함수 (앱의 토큰 관리 방식에 맞게 구현)
// import { setTokens } from '@/lib/token-manager';

/**
 * Hub URL (환경변수에서 가져오기)
 */
const HUB_URL = import.meta.env.VITE_HUB_URL || 'http://localhost:3000';

/**
 * SSO 초기화 훅 (독립 앱용)
 *
 * @description
 * 1. Hub에서 새 창으로 열렸을 때 opener에 토큰 요청
 * 2. postMessage로 토큰 수신
 * 3. 토큰 저장 및 로그인 처리
 */
export function useIndependentAppSSO(options: {
  onTokensReceived: (tokens: any /* SSOTokens */) => void;
  onLogout?: () => void;
  debug?: boolean;
}) {
  const { onTokensReceived, onLogout, debug = false } = options;
  const hasRequested = useRef(false);

  useEffect(() => {
    // 이미 요청했으면 스킵
    if (hasRequested.current) return;

    // 1. URL 파라미터에서 토큰 확인 (레거시 지원)
    // const urlTokens = extractTokensFromUrl({ removeFromUrl: true, debug });
    // if (urlTokens) {
    //   onTokensReceived(urlTokens);
    //   return;
    // }

    // 2. opener(Hub)가 있으면 토큰 요청
    if (window.opener) {
      hasRequested.current = true;

      if (debug) {
        console.log('[SSO] Hub에 토큰 요청 중...');
      }

      // 토큰 요청 메시지 전송
      try {
        window.opener.postMessage(
          {
            type: 'SSO_TOKEN_REQUEST',
            requestId: `req_${Date.now()}`,
          },
          HUB_URL
        );
      } catch (error) {
        console.error('[SSO] 토큰 요청 실패:', error);
      }
    }
  }, [debug]);

  // 3. postMessage 리스너 설정
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Origin 검증 (중요!)
      const hubOrigin = new URL(HUB_URL).origin;
      if (event.origin !== hubOrigin) {
        return;
      }

      const data = event.data;
      if (!data || typeof data !== 'object') {
        return;
      }

      // 토큰 응답 처리
      if (data.type === 'SSO_TOKEN_RESPONSE') {
        if (data.tokens) {
          if (debug) {
            console.log('[SSO] 토큰 수신 완료');
          }
          onTokensReceived(data.tokens);
        } else if (data.error) {
          console.warn('[SSO] 토큰 수신 에러:', data.error);
        }
      }

      // 로그아웃 메시지 처리
      if (data.type === 'SSO_LOGOUT') {
        if (debug) {
          console.log('[SSO] 로그아웃 메시지 수신');
        }
        onLogout?.();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onTokensReceived, onLogout, debug]);
}

// ============================================================
// 4. 사용 예시 (App.tsx)
// ============================================================
/*
import { useIndependentAppSSO } from './hooks/use-independent-app-sso';
import { setTokens, clearTokens } from '@/lib/token-manager';
import { useAuthStore } from '@/stores/auth-store';

function App() {
  const { setTokens: setStoreTokens, clearTokens: clearStoreTokens } = useAuthStore();

  // SSO 토큰 수신 설정
  useIndependentAppSSO({
    onTokensReceived: (tokens) => {
      console.log('✅ Hub에서 SSO 토큰 수신');

      // 토큰 저장 (앱의 토큰 관리 방식에 맞게)
      setTokens(tokens.accessToken, tokens.refreshToken);
      setStoreTokens(tokens.accessToken, tokens.refreshToken, tokens.tokenExpiry);

      // 선택: 사용자 정보 fetch
      // fetchUserInfo();
    },
    onLogout: () => {
      console.log('🔒 Hub에서 로그아웃 메시지 수신');
      clearTokens();
      clearStoreTokens();
      // navigate('/login');
    },
    debug: import.meta.env.DEV,
  });

  return (
    <RouterProvider router={router} />
  );
}
*/

// ============================================================
// 5. 로그인 버튼 (비로그인 상태에서 Hub로 이동)
// ============================================================
/*
function LoginButton() {
  const handleLogin = () => {
    // 현재 URL을 redirect_uri로 전달하여 로그인 후 돌아오기
    const currentUrl = encodeURIComponent(window.location.href);
    const hubLoginUrl = `${HUB_URL}/auth/login?redirect_uri=${currentUrl}`;
    window.location.href = hubLoginUrl;
  };

  return (
    <button onClick={handleLogin} className="btn btn-primary">
      로그인
    </button>
  );
}
*/

// ============================================================
// 6. 체크리스트
// ============================================================
/*
✅ sso-client 폴더 복사
✅ 환경변수 VITE_HUB_URL 설정
✅ useIndependentAppSSO 훅 추가
✅ 토큰 저장 로직 연결
✅ 로그아웃 처리 연결
✅ (선택) 로그인 버튼 → Hub 리다이렉트
*/

export default {};
