import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFirebaseUidToMember1769513366700 implements MigrationInterface {
    name = 'AddFirebaseUidToMember1769513366700'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "mentoring_invite_tb" ("id" SERIAL NOT NULL, "teacher_id" bigint NOT NULL, "invite_code" character varying(32) NOT NULL, "class_id" character varying(100), "class_name" character varying(100), "invite_type" character varying(20) NOT NULL DEFAULT 'student', "use_count" integer NOT NULL DEFAULT '0', "max_use_count" integer NOT NULL DEFAULT '100', "is_active" boolean NOT NULL DEFAULT true, "expire_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_22772dcddd707b19c7de994652c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_80cb5f7e2ae06aada8c52f06e4" ON "mentoring_invite_tb" ("teacher_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bd98d837af95941091b26a262b" ON "mentoring_invite_tb" ("invite_code") `);
        await queryRunner.query(`CREATE INDEX "IDX_53633640066bfdd28a3c8d6171" ON "mentoring_invite_tb" ("expire_at") `);
        await queryRunner.query(`ALTER TABLE "auth_member" ADD "firebase_uid" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "auth_member" ALTER COLUMN "ck_sms" SET DEFAULT b'0'`);
        await queryRunner.query(`ALTER TABLE "auth_member" ALTER COLUMN "ck_sms_agree" SET DEFAULT b'0'`);
        await queryRunner.query(`CREATE INDEX "idx_member_firebase_uid" ON "auth_member" ("firebase_uid") `);
        await queryRunner.query(`ALTER TABLE "mentoring_invite_tb" ADD CONSTRAINT "FK_80cb5f7e2ae06aada8c52f06e41" FOREIGN KEY ("teacher_id") REFERENCES "auth_member"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mentoring_invite_tb" DROP CONSTRAINT "FK_80cb5f7e2ae06aada8c52f06e41"`);
        await queryRunner.query(`DROP INDEX "public"."idx_member_firebase_uid"`);
        await queryRunner.query(`ALTER TABLE "auth_member" ALTER COLUMN "ck_sms_agree" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "auth_member" ALTER COLUMN "ck_sms" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "auth_member" DROP COLUMN "firebase_uid"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_53633640066bfdd28a3c8d6171"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bd98d837af95941091b26a262b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_80cb5f7e2ae06aada8c52f06e4"`);
        await queryRunner.query(`DROP TABLE "mentoring_invite_tb"`);
    }

}
