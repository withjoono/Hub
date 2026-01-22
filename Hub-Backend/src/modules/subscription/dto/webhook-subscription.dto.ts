import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, IsArray, IsIn, IsEnum } from 'class-validator';

/**
 * Webhook으로 구독 정보를 받을 때 사용하는 DTO
 * Susi 등 외부 앱에서 결제 완료 시 Hub에 알림
 *
 * 방법 1: externalProductId 제공 (권장)
 * - DB에서 자동으로 매핑 조회하여 적용
 *
 * 방법 2: plan + features 직접 제공 (fallback)
 * - 매핑이 없는 경우 사용
 */
export class WebhookSubscriptionDto {
  @ApiProperty({ example: 'your-secret-webhook-key', description: 'Webhook API Key (보안)' })
  @IsString()
  apiKey: string;

  @ApiProperty({ example: 1, description: '회원 ID' })
  @IsNumber()
  memberId: number;

  @ApiProperty({ example: 'susi', description: '앱 ID (susi, examhub 등)' })
  @IsString()
  appId: string;

  @ApiProperty({ example: '1', description: '외부 앱의 상품 ID (권장: DB 매핑 사용)', required: false })
  @IsOptional()
  @IsString()
  externalProductId?: string;

  @ApiProperty({ example: 'premium', description: '구독 플랜 (externalProductId 없을 때 필수)', required: false })
  @IsOptional()
  @IsIn(['free', 'basic', 'premium'])
  plan?: 'free' | 'basic' | 'premium';

  @ApiProperty({ example: '2026-11-30T23:59:59Z', description: '만료일 (선택: DB 매핑의 duration_days 우선)', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ example: 123, description: '결제 주문 ID (Susi의 payment_order_id)', required: false })
  @IsOptional()
  @IsNumber()
  paymentOrderId?: number;

  @ApiProperty({
    example: ['prediction', 'analytics', 'export', 'ai-evaluation'],
    description: '활성화할 기능 목록 (externalProductId 없을 때 필수)',
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ example: 100, description: '사용 제한 (티켓제)', required: false })
  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @ApiProperty({ example: true, description: '자동 갱신 여부', required: false })
  @IsOptional()
  autoRenew?: boolean;

  @ApiProperty({ example: 'payment_completed', description: '이벤트 타입', required: false })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiProperty({ example: '2027 수시 예측 분석 서비스', description: '상품명 (로깅용)', required: false })
  @IsOptional()
  @IsString()
  productName?: string;
}
