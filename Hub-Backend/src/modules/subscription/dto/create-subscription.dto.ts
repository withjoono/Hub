import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, IsArray, IsBoolean, IsIn } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 1, description: '회원 ID' })
  @IsNumber()
  memberId: number;

  @ApiProperty({ example: 'examhub', description: '앱 ID' })
  @IsString()
  appId: string;

  @ApiProperty({ example: 'premium', description: '구독 플랜' })
  @IsIn(['free', 'basic', 'premium'])
  plan: 'free' | 'basic' | 'premium';

  @ApiProperty({ example: '2025-12-31T23:59:59Z', description: '만료일', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ example: 123, description: '결제 주문 ID', required: false })
  @IsOptional()
  @IsNumber()
  paymentOrderId?: number;

  @ApiProperty({ example: ['prediction', 'analytics'], description: '활성화할 기능 목록', required: false })
  @IsOptional()
  @IsArray()
  features?: string[];

  @ApiProperty({ example: 100, description: '사용 제한 (티켓제)', required: false })
  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @ApiProperty({ example: true, description: '자동 갱신 여부', required: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}

export class UpdateSubscriptionDto {
  @ApiProperty({ example: 'premium', description: '구독 플랜', required: false })
  @IsOptional()
  @IsIn(['free', 'basic', 'premium'])
  plan?: 'free' | 'basic' | 'premium';

  @ApiProperty({ example: 'active', description: '구독 상태', required: false })
  @IsOptional()
  @IsIn(['active', 'expired', 'cancelled', 'suspended'])
  status?: 'active' | 'expired' | 'cancelled' | 'suspended';

  @ApiProperty({ example: '2025-12-31T23:59:59Z', description: '만료일', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ example: ['prediction', 'analytics'], description: '활성화할 기능 목록', required: false })
  @IsOptional()
  @IsArray()
  features?: string[];

  @ApiProperty({ example: true, description: '자동 갱신 여부', required: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}
