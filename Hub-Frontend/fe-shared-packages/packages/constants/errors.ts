/**
 * 에러 코드 상수
 */

// API 에러 코드
export const ERROR_CODES = {
  // 인증 관련 (C4xx)
  C401: 'C401', // 토큰 만료 (자동 갱신)
  C403: 'C403', // 권한 없음
  C404: 'C404', // 리소스 없음

  // 서버 에러 (C5xx)
  C500: 'C500', // 서버 에러
  C5050: 'C5050', // 세션 만료

  // 비즈니스 로직 (C9xx)
  C999: 'C999', // 유효하지 않은 토큰

  // 클라이언트 에러
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// 에러 메시지
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.C401]: '인증이 만료되었습니다. 다시 로그인해주세요.',
  [ERROR_CODES.C403]: '접근 권한이 없습니다.',
  [ERROR_CODES.C404]: '요청한 정보를 찾을 수 없습니다.',
  [ERROR_CODES.C500]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.C5050]: '세션이 만료되었습니다. 다시 로그인해주세요.',
  [ERROR_CODES.C999]: '로그인이 필요합니다.',
  [ERROR_CODES.NETWORK_ERROR]: '네트워크 연결을 확인해주세요.',
  [ERROR_CODES.TIMEOUT_ERROR]: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  [ERROR_CODES.VALIDATION_ERROR]: '입력 값을 확인해주세요.',
};

// HTTP 상태 코드
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;
