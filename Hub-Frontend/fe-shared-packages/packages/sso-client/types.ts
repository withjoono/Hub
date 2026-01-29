/**
 * SSO Client 타입 정의
 */

/**
 * SSO 토큰 인터페이스
 */
export interface SSOTokens {
  accessToken: string;
  refreshToken: string;
  tokenExpiry?: number; // Unix timestamp (seconds)
}

/**
 * JWT 페이로드 (디코딩 후)
 */
export interface JWTPayload {
  sub?: string;       // subject (ATK/RTK)
  jti?: string | number; // JWT ID (memberId)
  exp?: number;       // expiration time
  iat?: number;       // issued at
  [key: string]: unknown;
}

/**
 * postMessage 이벤트 데이터
 */
export interface SSOPostMessageData {
  type: 'SSO_TOKEN' | 'SSO_TOKEN_REQUEST' | 'SSO_TOKEN_RESPONSE' | 'SSO_LOGOUT';
  tokens?: SSOTokens;
  error?: string;
  requestId?: string;
}

/**
 * SSO 서비스 설정
 */
export interface SSOServiceConfig {
  /** 서비스 이름 (예: 'susi', 'jungsi') */
  name: string;
  /** 서비스 URL */
  url: string;
  /** postMessage 사용 여부 (기본: true) */
  usePostMessage?: boolean;
}

/**
 * SSO 설정
 */
export interface SSOConfig {
  /** Hub (토큰 발급자) URL */
  hubUrl: string;
  /** 허용된 origin 목록 */
  allowedOrigins: string[];
  /** SSO 연동 서비스 목록 */
  services?: SSOServiceConfig[];
  /** 토큰 저장 핸들러 */
  onTokensReceived?: (tokens: SSOTokens) => void;
  /** 로그아웃 핸들러 */
  onLogout?: () => void;
  /** 디버그 모드 */
  debug?: boolean;
}

/**
 * 토큰 검증 결과
 */
export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
  payload?: JWTPayload;
  expiry?: number;
}
