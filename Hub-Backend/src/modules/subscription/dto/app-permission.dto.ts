import { ApiProperty } from '@nestjs/swagger';

/**
 * JWT 토큰에 포함될 앱별 권한 정보
 */
export class AppPermissionDto {
  @ApiProperty({ example: 'premium', description: '구독 플랜' })
  plan: 'free' | 'basic' | 'premium' | 'none';

  @ApiProperty({ example: '2025-12-31T23:59:59Z', description: '만료일', required: false })
  expires?: string;

  @ApiProperty({ example: ['prediction', 'analytics', 'export'], description: '사용 가능 기능', required: false })
  features?: string[];
}

/**
 * JWT 토큰에 포함될 전체 권한 정보
 * Record 타입으로 앱별 권한을 동적으로 관리
 */
export type PermissionsDto = Record<string, AppPermissionDto>;

/**
 * 앱별 라이선스 확인 응답
 */
export class LicenseCheckResponseDto {
  @ApiProperty({ example: true, description: '접근 권한 여부' })
  hasAccess: boolean;

  @ApiProperty({ example: 'premium', description: '구독 플랜' })
  plan: string;

  @ApiProperty({ example: ['prediction', 'analytics', 'export'], description: '사용 가능 기능' })
  features: string[];

  @ApiProperty({ example: '2025-12-31T23:59:59Z', description: '만료일', required: false })
  expiresAt?: string;

  @ApiProperty({ example: 100, description: '남은 사용 횟수 (티켓제)', required: false })
  remainingUsage?: number;
}
