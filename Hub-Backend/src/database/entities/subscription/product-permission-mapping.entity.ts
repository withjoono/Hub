import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type MappingPlan = 'free' | 'basic' | 'premium';

/**
 * 상품-권한 매핑 엔티티
 * 각 앱의 상품(payment_product)과 Hub 구독 권한을 매핑
 * 관리자가 동적으로 관리 가능
 */
@Entity('hub_product_permission_mappings')
@Index(['app_id', 'external_product_id'], { unique: true })
export class ProductPermissionMappingEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 50, comment: '앱 ID (susi, examhub 등)' })
  app_id: string;

  @Column({ type: 'varchar', length: 100, comment: '외부 앱의 상품 ID (문자열 지원)' })
  external_product_id: string;

  @Column({ type: 'varchar', length: 200, comment: '상품명' })
  product_name: string;

  @Column({ type: 'varchar', length: 20, default: 'premium', comment: '매핑될 플랜' })
  plan: MappingPlan;

  @Column({ type: 'simple-json', comment: '활성화할 기능 목록' })
  features: string[];

  @Column({ type: 'int', nullable: true, comment: '구독 기간 (일 단위)' })
  duration_days: number;

  @Column({ type: 'int', nullable: true, comment: '사용 제한 (티켓제)' })
  usage_limit: number;

  @Column({ type: 'boolean', default: true, comment: '활성화 여부' })
  is_active: boolean;

  @Column({ type: 'text', nullable: true, comment: '관리자 메모' })
  memo: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  /**
   * 만료일 계산
   */
  calculateExpiresAt(): Date | null {
    if (!this.duration_days) return null;
    const now = new Date();
    return new Date(now.getTime() + this.duration_days * 24 * 60 * 60 * 1000);
  }
}
