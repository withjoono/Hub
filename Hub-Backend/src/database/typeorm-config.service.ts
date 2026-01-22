import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { AllConfigType } from '../config/config.type';
import { MemberEntity } from './entities/member/member.entity';
import { MemberInterestsEntity } from './entities/member/member-interests';
import { SchoolRecordAttendanceDetailEntity } from './entities/schoolrecord/schoolrecord-attendance-detail.entity';
import { SchoolRecordSelectSubjectEntity } from './entities/schoolrecord/schoolrecord-select-subject.entity';
import { SchoolRecordSubjectLearningEntity } from './entities/schoolrecord/schoolrecord-subject-learning.entity';
import { SchoolRecordVolunteerEntity } from './entities/schoolrecord/schoolrecord-volunteer.entity';
import { MockexamScoreEntity } from './entities/mock-exam/mockexam-score.entity';
import { MockexamRawScoreEntity } from './entities/mock-exam/mockexam-raw-score.entity';
import { MockexamScheduleEntity } from './entities/mock-exam/mockexam-schedule.entity';
import { MockexamRawToStandardEntity } from './entities/mock-exam/mockexam-raw-to-standard.entity';
import { PayServiceEntity } from './entities/pay/pay-service.entity';
import { PayCouponEntity } from './entities/pay/pay-coupon.entity';
import { PayContractEntity } from './entities/pay/pay-contract.entity';
import { PayOrderEntity } from './entities/pay/pay-order.entity';
import { PayCancelLogEntity } from './entities/pay/pay-cancel-log.entity';
import { PayProductEntity } from './entities/pay/pay-product.entity';
import { PayServiceProductEntity } from './entities/pay/pay-service-product.entity';
import { SchoolrecordSportsArtEntity } from './entities/schoolrecord/schoolrecord-sport-art.entity';
import { BoardEntity } from './entities/boards/board.entity';
import { PostEntity } from './entities/boards/post.entity';
import { CommentEntity } from './entities/boards/comment.entity';
import { AdmissionCategoryEntity } from './entities/core/admission-category.entity';
import { AdmissionMethodEntity } from './entities/core/admission-method.entity';
import { AdmissionSubtypeEntity } from './entities/core/admission-subtype.entity';
import { AdmissionEntity } from './entities/core/admission.entity';
import { GeneralFieldEntity } from './entities/core/general-field.entity';
import { MajorFieldEntity } from './entities/core/major-field.entity';
import { MidFieldEntity } from './entities/core/mid-field.entity';
import { MinorFieldEntity } from './entities/core/minor-field.entity';
import { RecruitmentUnitEntity } from './entities/core/recruitment-unit.entity';
import { RecruitmentUnitScoreEntity } from './entities/core/recruitment-unit-score.entity';
import { RecruitmentUnitInterviewEntity } from './entities/core/recruitment-unit-interview.entity';
import { RecruitmentUnitMinimumGradeEntity } from './entities/core/recruitment-unit-minimum_grade.entity';
import { RecruitmentUnitPreviousResultEntity } from './entities/core/recruitment-unit-previous-result.entity';
import { UniversityEntity } from './entities/core/university.entity';
import { MemberUploadFileListEntity } from './entities/member/member-file';
import { SubjectCodeListEntity } from './entities/common-code/subject-code-list-entity';
import { RecruitmentUnitPassFailRecordsEntity } from './entities/core/recruitment-unit-pass-fail-record.entity';
import { MemberRecruitmentUnitCombinationEntity } from './entities/member/member-recruitment-unit-combination.entity';
import { RegularAdmissionEntity } from './entities/core/regular-admission.entity';
import { RegularAdmissionPreviousResultEntity } from './entities/core/regular-admission-previous-result.entity';
import { MemberRegularInterestsEntity } from './entities/member/member-regular-interests';
import { MemberRegularCombinationEntity } from './entities/member/member-regular-combination.entity';
import { MockexamStandardScoreEntity } from './entities/mock-exam/mockexam-standard-score.entity';
import { TempCodeEntity, AccountLinkEntity, AdminClassEntity } from './entities/mentoring';
import {
  PlanEntity,
  PlannerItemEntity,
  RoutineEntity,
  PlannerClassEntity,
  PlannerManagementEntity,
  PlannerNoticeEntity,
} from './entities/planner';
import {
  HealthRecordEntity,
  ConsultationEntity,
  AttendanceEntity,
  TestEntity,
} from './entities/myclass';
import { OAuthClientEntity } from './entities/oauth/oauth-client.entity';
import { OAuthAuthorizationCodeEntity } from './entities/oauth/oauth-authorization-code.entity';
import { AppEntity, AppSubscriptionEntity, ProductPermissionMappingEntity } from './entities/subscription';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService<AllConfigType>) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbConfig = this.configService.getOrThrow('database', { infer: true });
    const nodeEnv = this.configService.get('app.nodeEnv', { infer: true });
    const isDevelopment = nodeEnv === 'development';
    const isSqlite = dbConfig.type === 'better-sqlite3';

    console.log('🔍 TypeORM Config:', {
      type: dbConfig.type,
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.name,
      username: dbConfig.username,
      synchronize: dbConfig.synchronize,
    });

    const baseOptions = {
      type: dbConfig.type,
      database: dbConfig.name,
      synchronize: dbConfig.synchronize,
      logging: false,
      // 개발환경: 빠른 실패, 프로덕션: 안정적 재시도
      retryAttempts: isDevelopment ? 3 : 10,
      retryDelay: isDevelopment ? 1000 : 3000,
      // this.configService.getOrThrow('app.nodeEnv', { infer: true }) ===
      // 'development',
    };

    // SQLite는 host, port, username, password가 필요하지 않음
    const connectionOptions = isSqlite
      ? baseOptions
      : {
          ...baseOptions,
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
        };

    return {
      ...connectionOptions,
      entities: [
        MemberEntity,
        MemberInterestsEntity, // 유저 관심목록(수시 교과, 수시 학종, 논술)
        MemberUploadFileListEntity, // 유저 업로드 파일

        SchoolRecordAttendanceDetailEntity, // 학생부 교과
        SchoolRecordSelectSubjectEntity, // 학생부 선택과목
        SchoolRecordSubjectLearningEntity, // 학생부 기본과목
        SchoolRecordVolunteerEntity, // 학생부 봉사
        SchoolrecordSportsArtEntity, // 학생부 체육

        // 모의고사 관련
        MockexamScoreEntity, // 표준점수(안씀)
        MockexamRawScoreEntity, // 유저 원점수
        MockexamScheduleEntity, // 일정
        MockexamRawToStandardEntity, // 원점수 -> 표준점수 테이블
        MockexamStandardScoreEntity, // 유저 표준점수

        // 결제 관련
        PayServiceEntity, // 서비스 (판매 상품)
        PayCouponEntity, // 쿠폰
        PayContractEntity, // 계약
        PayOrderEntity, // 결제 주문
        PayCancelLogEntity, // 결제 취소 로그
        PayProductEntity, // 상품 코드 (상품 마스터)
        PayServiceProductEntity, // 서비스-상품 관계

        // 통합 코드
        SubjectCodeListEntity, // 교과 코드

        // 게시판 관련
        BoardEntity,
        PostEntity,
        CommentEntity,

        // 개편된 테이블
        AdmissionCategoryEntity, // 중심전형분류(학생부교과, 학생부학종)
        AdmissionMethodEntity, // 전형 방법 (각 성적 비율, 지원자격)
        AdmissionSubtypeEntity, // 전형 상세 타입 (농어촌, 특기자)
        AdmissionEntity, // 전형 (일반전형, 학교장추천전형, 고른기회전형)
        GeneralFieldEntity, // 기본 계열 (자연, 의치한약수, 인문, 예체능 등)
        MajorFieldEntity, // 대계열
        MidFieldEntity, // 중계열
        MinorFieldEntity, // 소계열
        RecruitmentUnitEntity, // 모집단위
        RecruitmentUnitScoreEntity, // 모집단위 점수 (등급컷, 위험도)
        RecruitmentUnitInterviewEntity, // 모집단위 면접 정보
        RecruitmentUnitMinimumGradeEntity, // 모집단위 최저등급 정보
        RecruitmentUnitPreviousResultEntity, // 모집단위 과거 입결 정보
        RecruitmentUnitPassFailRecordsEntity, // 모집단위 합불 데이터
        UniversityEntity, // 대학 정보
        MemberRecruitmentUnitCombinationEntity, // 조합 테이블

        // 정시 테이블
        RegularAdmissionEntity,
        RegularAdmissionPreviousResultEntity,
        MemberRegularInterestsEntity, // 정시 관심대학
        MemberRegularCombinationEntity, // 정시 조합

        // 멘토링 관련
        TempCodeEntity, // 임시 연계 코드
        AccountLinkEntity, // 계정 연동 관계
        AdminClassEntity, // 관리자 클래스 (양방향 관계)

        // 플래너 관련
        PlanEntity, // 장기 학습계획
        PlannerItemEntity, // 일정 아이템
        RoutineEntity, // 루틴
        PlannerClassEntity, // 플래너 클래스
        PlannerManagementEntity, // 플래너 멤버십
        PlannerNoticeEntity, // 플래너 공지사항

        // 마이클래스 관련
        HealthRecordEntity, // 건강 기록
        ConsultationEntity, // 상담 기록
        AttendanceEntity, // 출결 기록
        TestEntity, // 테스트 기록

        // OAuth 2.0 관련
        OAuthClientEntity, // OAuth 클라이언트 등록
        OAuthAuthorizationCodeEntity, // OAuth Authorization Code

        // 앱 구독/권한 관련
        AppEntity, // 앱 정의 (examhub, susi 등)
        AppSubscriptionEntity, // 사용자별 앱 구독 정보
        ProductPermissionMappingEntity, // 상품-권한 매핑 (관리자가 동적 관리)
      ],
    } as TypeOrmModuleOptions;
  }
}
