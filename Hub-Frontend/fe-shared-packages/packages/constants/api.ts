/**
 * API 관련 상수
 */

// API 엔드포인트 프리픽스
export const API_PREFIXES = {
  NEST: '/api-nest',
  SPRING: '/api-spring',
} as const;

// API 타임아웃 (ms)
export const API_TIMEOUT = {
  DEFAULT: 10000,
  UPLOAD: 60000,
  DOWNLOAD: 30000,
} as const;

// 페이지네이션 기본값
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// 캐시 시간 (TanStack Query)
export const CACHE_TIME = {
  SHORT: 1000 * 60 * 5, // 5분
  MEDIUM: 1000 * 60 * 30, // 30분
  LONG: 1000 * 60 * 60, // 1시간
  PERMANENT: Infinity,
} as const;

// stale 시간 (TanStack Query)
export const STALE_TIME = {
  SHORT: 1000 * 30, // 30초
  MEDIUM: 1000 * 60 * 5, // 5분
  LONG: 1000 * 60 * 30, // 30분
} as const;

// 재시도 횟수
export const RETRY_COUNT = {
  DEFAULT: 3,
  MUTATION: 0,
  CRITICAL: 5,
} as const;
