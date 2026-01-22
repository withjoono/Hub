import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Susi 상품-권한 매핑 초기 데이터
 * 2개의 Susi 상품에 대한 권한 매핑 정의
 *
 * ⚠️ 주의: external_product_id는 Susi DB의 실제 product_id로 업데이트 필요
 */
export class SeedSusiProductMappings1768352000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Susi 상품 1: 2027 수시 예측 분석 서비스 (Premium)
    await queryRunner.query(`
      INSERT INTO hub_product_permission_mappings (
        app_id,
        external_product_id,
        product_name,
        plan,
        features,
        duration_days,
        usage_limit,
        is_active,
        memo,
        created_at,
        updated_at
      ) VALUES (
        'susi',
        '1',
        '2027 수시 예측 분석 서비스',
        'premium',
        '["prediction", "analytics", "export", "ai-evaluation"]',
        365,
        NULL,
        true,
        '2027학년도 수시 전형 예측 및 생기부 평가 풀패키지',
        NOW(),
        NOW()
      )
      ON CONFLICT (app_id, external_product_id) DO UPDATE SET
        product_name = EXCLUDED.product_name,
        plan = EXCLUDED.plan,
        features = EXCLUDED.features,
        duration_days = EXCLUDED.duration_days,
        updated_at = NOW();
    `);

    // Susi 상품 2: 추가 AI 생기부 평가/컨설팅 (Basic)
    await queryRunner.query(`
      INSERT INTO hub_product_permission_mappings (
        app_id,
        external_product_id,
        product_name,
        plan,
        features,
        duration_days,
        usage_limit,
        is_active,
        memo,
        created_at,
        updated_at
      ) VALUES (
        'susi',
        '2',
        '추가 AI 생기부 평가/컨설팅',
        'basic',
        '["ai-evaluation"]',
        30,
        NULL,
        true,
        'AI 기반 생기부 평가 단독 상품',
        NOW(),
        NOW()
      )
      ON CONFLICT (app_id, external_product_id) DO UPDATE SET
        product_name = EXCLUDED.product_name,
        plan = EXCLUDED.plan,
        features = EXCLUDED.features,
        duration_days = EXCLUDED.duration_days,
        updated_at = NOW();
    `);

    console.log('✅ Susi 상품-권한 매핑 초기 데이터가 추가되었습니다.');
    console.log('⚠️  주의: external_product_id를 Susi DB의 실제 product_id로 업데이트하세요!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Susi 상품 매핑 삭제 (롤백)
    await queryRunner.query(`
      DELETE FROM hub_product_permission_mappings WHERE app_id = 'susi';
    `);

    console.log('❌ Susi 상품-권한 매핑 데이터가 삭제되었습니다.');
  }
}
