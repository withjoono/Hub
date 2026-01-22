import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Susi 앱 초기 데이터 마이그레이션
 * hub_apps 테이블에 'susi' 앱 정보 추가
 */
export class SeedSusiApp1768350000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Susi 앱 정보 삽입
    await queryRunner.query(`
      INSERT INTO hub_apps (
        id,
        name,
        description,
        icon_url,
        app_url,
        is_active,
        pricing,
        features,
        sort_order,
        created_at,
        updated_at
      ) VALUES (
        'susi',
        '수시 예측 분석 서비스',
        'AI 기반 수시 전형 예측 및 생기부 평가 서비스',
        NULL,
        'https://susi.turtleskool.com',
        true,
        '{"free": 0, "basic": 50000, "premium": 100000}',
        '{
          "free": ["basic-search", "university-info"],
          "basic": ["basic-search", "university-info", "ai-evaluation"],
          "premium": ["basic-search", "university-info", "prediction", "analytics", "export", "ai-evaluation"]
        }',
        1,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        app_url = EXCLUDED.app_url,
        pricing = EXCLUDED.pricing,
        features = EXCLUDED.features,
        updated_at = NOW();
    `);

    console.log('✅ Susi 앱 초기 데이터가 추가되었습니다.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Susi 앱 데이터 삭제 (롤백)
    await queryRunner.query(`
      DELETE FROM hub_apps WHERE id = 'susi';
    `);

    console.log('❌ Susi 앱 데이터가 삭제되었습니다.');
  }
}
