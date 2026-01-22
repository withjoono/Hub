import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsNumber, IsBoolean, IsIn } from 'class-validator';

/**
 * 상품-권한 매핑 생성 DTO
 */
export class CreateProductMappingDto {
  @ApiProperty({ example: 'susi', description: '앱 ID' })
  @IsString()
  appId: string;

  @ApiProperty({ example: '1', description: '외부 앱의 상품 ID' })
  @IsString()
  externalProductId: string;

  @ApiProperty({ example: '2027 수시 예측 분석 서비스', description: '상품명' })
  @IsString()
  productName: string;

  @ApiProperty({ example: 'premium', description: '매핑될 플랜' })
  @IsIn(['free', 'basic', 'premium'])
  plan: 'free' | 'basic' | 'premium';

  @ApiProperty({
    example: ['prediction', 'analytics', 'export', 'ai-evaluation'],
    description: '활성화할 기능 목록'
  })
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @ApiProperty({ example: 365, description: '구독 기간 (일 단위)', required: false })
  @IsOptional()
  @IsNumber()
  durationDays?: number;

  @ApiProperty({ example: 100, description: '사용 제한 (티켓제)', required: false })
  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @ApiProperty({ example: true, description: '활성화 여부', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: '2027학년도 수시 전용 상품', description: '관리자 메모', required: false })
  @IsOptional()
  @IsString()
  memo?: string;
}

/**
 * 상품-권한 매핑 수정 DTO
 */
export class UpdateProductMappingDto {
  @ApiProperty({ example: '2027 수시 예측 분석 서비스', description: '상품명', required: false })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiProperty({ example: 'premium', description: '매핑될 플랜', required: false })
  @IsOptional()
  @IsIn(['free', 'basic', 'premium'])
  plan?: 'free' | 'basic' | 'premium';

  @ApiProperty({
    example: ['prediction', 'analytics', 'export', 'ai-evaluation'],
    description: '활성화할 기능 목록',
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ example: 365, description: '구독 기간 (일 단위)', required: false })
  @IsOptional()
  @IsNumber()
  durationDays?: number;

  @ApiProperty({ example: 100, description: '사용 제한 (티켓제)', required: false })
  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @ApiProperty({ example: true, description: '활성화 여부', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: '2027학년도 수시 전용 상품', description: '관리자 메모', required: false })
  @IsOptional()
  @IsString()
  memo?: string;
}
