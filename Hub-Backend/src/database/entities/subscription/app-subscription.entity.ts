import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AppEntity } from './app.entity';
import { MemberEntity } from '../member/member.entity';

export type SubscriptionPlan = 'free' | 'basic' | 'premium';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'suspended';

/**
 * 사용자별 앱 구독 엔티티
 * Hub에서 결제 후 각 앱에 대한 사용 권한을 관리
 */
@Entity('hub_app_subscriptions')
@Index(['member_id', 'app_id'], { unique: true })
export class AppSubscriptionEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  member_id: number;

  @Column({ type: 'varchar', length: 50 })
  app_id: string;

  @Column({ type: 'varchar', length: 20, default: 'free' })
  plan: SubscriptionPlan;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @Column({ type: 'bigint', nullable: true })
  payment_order_id: number; // PayOrderEntity 참조

  @Column({ type: 'simple-json', nullable: true })
  features: string[]; // 활성화된 기능 목록

  @Column({ type: 'int', default: 0 })
  usage_count: number; // 사용 횟수 (티켓제일 경우)

  @Column({ type: 'int', nullable: true })
  usage_limit: number; // 사용 제한 (티켓제일 경우)

  @Column({ type: 'boolean', default: false })
  auto_renew: boolean; // 자동 갱신 여부

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => AppEntity, (app) => app.subscriptions)
  @JoinColumn({ name: 'app_id' })
  app: AppEntity;

  @ManyToOne(() => MemberEntity)
  @JoinColumn({ name: 'member_id' })
  member: MemberEntity;

  /**
   * 구독이 유효한지 확인
   */
  isValid(): boolean {
    if (this.status !== 'active') return false;
    if (this.expires_at && new Date() > this.expires_at) return false;
    if (this.usage_limit && this.usage_count >= this.usage_limit) return false;
    return true;
  }

  /**
   * 특정 기능 사용 가능 여부 확인
   */
  hasFeature(feature: string): boolean {
    if (!this.isValid()) return false;
    if (!this.features) return false;
    return this.features.includes(feature);
  }
}
