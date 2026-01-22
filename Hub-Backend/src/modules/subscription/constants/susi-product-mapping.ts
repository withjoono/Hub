/**
 * Susi 상품별 권한 매핑
 * Susi에서 결제 완료 시 이 매핑을 사용하여 Hub에 구독 정보를 전송
 */

export interface SusiProductMapping {
  productId: number;
  productName: string;
  plan: 'free' | 'basic' | 'premium';
  features: string[];
  duration?: number; // 구독 기간 (일 단위)
}

/**
 * Susi 상품 ID → Hub 구독 정보 매핑
 */
export const SUSI_PRODUCT_MAPPINGS: Record<number, SusiProductMapping> = {
  // 상품 ID는 Susi DB의 payment_product 테이블의 product_id 값
  // 예시로 1, 2를 사용 (실제 값은 Susi DB 확인 후 업데이트 필요)

  1: {
    productId: 1,
    productName: '2027 수시 예측 분석 서비스',
    plan: 'premium',
    features: ['prediction', 'analytics', 'export', 'ai-evaluation'],
    duration: 365, // 1년
  },

  2: {
    productId: 2,
    productName: '추가 AI 생기부 평가/컨설팅',
    plan: 'basic',
    features: ['ai-evaluation'],
    duration: 30, // 1개월
  },
};

/**
 * 상품 ID로 권한 매핑 조회
 */
export function getSusiProductMapping(productId: number): SusiProductMapping | undefined {
  return SUSI_PRODUCT_MAPPINGS[productId];
}

/**
 * 상품명으로 권한 매핑 조회
 */
export function getSusiProductMappingByName(productName: string): SusiProductMapping | undefined {
  return Object.values(SUSI_PRODUCT_MAPPINGS).find(
    mapping => mapping.productName === productName
  );
}

/**
 * 만료일 계산 (현재 시간 + duration 일)
 */
export function calculateExpiresAt(duration: number): string {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
  return expiresAt.toISOString();
}
