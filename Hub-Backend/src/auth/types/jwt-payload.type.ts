/**
 * 앱별 권한 정보
 */
export type AppPermission = {
  plan: 'free' | 'basic' | 'premium' | 'none';
  expires?: string;
  features?: string[];
};

/**
 * JWT 토큰에 포함될 전체 권한 정보
 */
export type PermissionsPayload = {
  [appId: string]: AppPermission;
};

/**
 * JWT Payload 타입
 * Spring 백엔드 호환 유지 + permissions 추가
 */
export type JwtPayloadType = {
  sub: string; // "ATK" | "RTK"
  jti: string; // memberId 값이 들어감
  iat: number;
  exp: number;
  permissions?: PermissionsPayload; // 앱별 권한 정보 (선택적)
};

// 스프링에서 사용중인 jwt payload (기존 호환)
// {
//     "sub": "ATK",
//     "jti": memberId,
//     "iat": 1716558652,
//     "exp": 1716576652
// }
//
// Hub 확장 (permissions 포함)
// {
//     "sub": "ATK",
//     "jti": memberId,
//     "iat": 1716558652,
//     "exp": 1716576652,
//     "permissions": {
//         "examhub": { "plan": "premium", "expires": "2025-12-31", "features": ["prediction", "analytics"] },
//         "appB": { "plan": "basic", "features": ["basic_feature"] }
//     }
// }
