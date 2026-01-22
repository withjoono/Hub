import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AppSubscriptionEntity } from './app-subscription.entity';

/**
 * 앱 정의 엔티티
 * Hub에서 관리하는 독립적인 앱들을 정의
 */
@Entity('hub_apps')
export class AppEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string; // 'examhub', 'consultinghub', etc.

  @Column({ type: 'varchar', length: 100 })
  name: string; // '모의고사 분석 서비스'

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  app_url: string; // 'http://localhost:3003'

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'simple-json', nullable: true })
  pricing: {
    free: number;
    basic: number;
    premium: number;
  };

  @Column({ type: 'simple-json', nullable: true })
  features: {
    free: string[];
    basic: string[];
    premium: string[];
  };

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => AppSubscriptionEntity, (subscription) => subscription.app)
  subscriptions: AppSubscriptionEntity[];
}
