import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 상품-권한 매핑 테이블 생성
 * 관리자가 동적으로 상품별 권한을 관리할 수 있도록 함
 */
export class AddProductPermissionMappings1768351000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 상품-권한 매핑 테이블 생성
    await queryRunner.query(`
      CREATE TABLE hub_product_permission_mappings (
        id BIGSERIAL PRIMARY KEY,
        app_id VARCHAR(50) NOT NULL,
        external_product_id VARCHAR(100) NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        plan VARCHAR(20) NOT NULL DEFAULT 'premium',
        features TEXT NOT NULL,
        duration_days INT NULL,
        usage_limit INT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        memo TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_product_mapping_app FOREIGN KEY (app_id) REFERENCES hub_apps(id) ON DELETE CASCADE,
        CONSTRAINT uq_product_mapping_app_product UNIQUE (app_id, external_product_id)
      );
    `);

    // PostgreSQL 방식으로 컬럼 주석 추가
    await queryRunner.query(`
      COMMENT ON COLUMN hub_product_permission_mappings.app_id IS '앱 ID (susi, examhub 등)';
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN hub_product_permission_mappings.external_product_id IS '외부 앱의 상품 ID';
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN hub_product_permission_mappings.product_name IS '상품명';
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN hub_product_permission_mappings.plan IS '매핑될 플랜';
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN hub_product_permission_mappings.features IS '활성화할 기능 목록 (JSON)';
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN hub_product_permission_mappings.duration_days IS '구독 기간 (일 단위)';
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN hub_product_permission_mappings.usage_limit IS '사용 제한 (티켓제)';
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN hub_product_permission_mappings.is_active IS '활성화 여부';
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN hub_product_permission_mappings.memo IS '관리자 메모';
    `);

    // 인덱스 생성
    await queryRunner.query(`
      CREATE INDEX idx_product_mappings_app_id ON hub_product_permission_mappings(app_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_product_mappings_is_active ON hub_product_permission_mappings(is_active);
    `);

    console.log('✅ hub_product_permission_mappings 테이블이 생성되었습니다.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 인덱스 삭제
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_product_mappings_is_active;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_product_mappings_app_id;
    `);

    // 테이블 삭제
    await queryRunner.query(`
      DROP TABLE IF EXISTS hub_product_permission_mappings;
    `);

    console.log('❌ hub_product_permission_mappings 테이블이 삭제되었습니다.');
  }
}
