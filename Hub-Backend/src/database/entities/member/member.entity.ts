import { Column, Entity, PrimaryGeneratedColumn, Unique, Index, OneToMany } from 'typeorm';
import { MemberInterestsEntity } from './member-interests';
import { SchoolRecordAttendanceDetailEntity } from '../schoolrecord/schoolrecord-attendance-detail.entity';
import { SchoolRecordSelectSubjectEntity } from '../schoolrecord/schoolrecord-select-subject.entity';
import { SchoolRecordSubjectLearningEntity } from '../schoolrecord/schoolrecord-subject-learning.entity';
import { SchoolRecordVolunteerEntity } from '../schoolrecord/schoolrecord-volunteer.entity';
import { MockexamScoreEntity } from '../mock-exam/mockexam-score.entity';
import { MockexamRawScoreEntity } from '../mock-exam/mockexam-raw-score.entity';
import { Exclude, Expose } from 'class-transformer';
import { SchoolrecordSportsArtEntity } from '../schoolrecord/schoolrecord-sport-art.entity';
import { PostEntity } from '../boards/post.entity';
import { CommentEntity } from '../boards/comment.entity';
import { MemberRecruitmentUnitCombinationEntity } from './member-recruitment-unit-combination.entity';
import { MemberRegularInterestsEntity } from './member-regular-interests';
import { MockexamStandardScoreEntity } from '../mock-exam/mockexam-standard-score.entity';

@Entity('auth_member')
@Unique(['email', 'phone', 'oauth_id'])
@Index(['email', 'phone', 'oauth_id'])
export class MemberEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 500 })
  email: string;

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'varchar', length: 500, nullable: true })
  password: string | null;

  @Column({ type: 'varchar', length: 500 })
  role_type: string;

  @Column({ type: 'varchar', length: 255 })
  phone: string;

  @Column({
    type: 'bit',
    default: () => "b'0'",
    transformer: {
      from: (v: Buffer | number | boolean) =>
        v === true || v === 1 || (v instanceof Buffer && v[0] === 1),
      to: (v: boolean) => (v ? 1 : 0),
    },
  })
  ck_sms: boolean;

  @Column({
    type: 'bit',
    default: () => "b'0'",
    transformer: {
      from: (v: Buffer | number | boolean) =>
        v === true || v === 1 || (v instanceof Buffer && v[0] === 1),
      to: (v: boolean) => (v ? 1 : 0),
    },
  })
  ck_sms_agree: boolean;

  @Column({ type: 'int', nullable: true })
  expiration_period: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nickname: string | null;

  @Column({ type: 'varchar', length: 20, default: 'student' }) // student, teacher, parent
  member_type: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  introduction: string | null;

  @Column({ type: 'varchar', length: 4000, nullable: true })
  profile_image_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  provider_type: string | null;

  @Expose({ groups: ['admin'] })
  @Column({ type: 'varchar', length: 500, nullable: true })
  oauth_id: string | null;

  @Expose({ groups: ['admin'] })
  @Index('idx_member_firebase_uid')
  @Column({ type: 'varchar', length: 128, nullable: true })
  firebase_uid: string | null;

  @Column({ type: 'bigint', nullable: true })
  s_type_id: number | null;

  @Column({ type: 'bigint', nullable: true })
  hst_type_id: number | null;

  @Column({ type: 'bigint', nullable: true })
  g_type_id: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  graduate_year: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  major: string | null;

  @Expose({ groups: ['admin'] })
  @Column({ type: 'varchar', length: 1, default: 'N' })
  account_stop_yn: string;

  @Expose({ groups: ['admin'] })
  @Column({ type: 'timestamp', nullable: true })
  create_dt: Date;

  @Expose({ groups: ['admin'] })
  @Column({ type: 'timestamp', nullable: true })
  update_dt: Date;

  // 관심 목록(교과, 학종, 논술)
  @OneToMany(() => MemberInterestsEntity, (interest) => interest.member)
  interests: MemberInterestsEntity[];

  // 정시 관심 목록(가, 나, 다 군)
  @OneToMany(() => MemberRegularInterestsEntity, (interest) => interest.member)
  regular_interests: MemberRegularInterestsEntity[];

  // 학생부 출결 데이터
  @OneToMany(
    () => SchoolRecordAttendanceDetailEntity,
    (attendanceDetail) => attendanceDetail.member,
  )
  attendanceDetails: SchoolRecordAttendanceDetailEntity[];

  // 학생부 선택과목 데이터
  @OneToMany(() => SchoolRecordSelectSubjectEntity, (selectSubject) => selectSubject.member)
  selectSubjects: SchoolRecordSelectSubjectEntity[];

  // 학생부 기본과목 성적 데이터
  @OneToMany(() => SchoolRecordSubjectLearningEntity, (subjectLearning) => subjectLearning.member)
  subjectLearnings: SchoolRecordSubjectLearningEntity[];

  // 학생부 봉사 데이터
  @OneToMany(() => SchoolRecordVolunteerEntity, (volunteer) => volunteer.member)
  volunteers: SchoolRecordVolunteerEntity[];

  // 학생부 체육&미술 데이터
  @OneToMany(
    () => SchoolrecordSportsArtEntity,
    (schoolrecordSportsArtEntity) => schoolrecordSportsArtEntity.member,
  )
  sportArts: SchoolrecordSportsArtEntity[];

  // 모의고사 표준점수(안씀)
  @OneToMany(() => MockexamScoreEntity, (mockexamMarks) => mockexamMarks.member)
  mockexam_scores: MockexamScoreEntity[];

  // 모의고사 원점수
  @OneToMany(() => MockexamRawScoreEntity, (mockexamRawScore) => mockexamRawScore.member)
  mockexam_row_scores: MockexamRawScoreEntity[];

  // 모의고사 표준점수
  @OneToMany(
    () => MockexamStandardScoreEntity,
    (mockexamStandardScore) => mockexamStandardScore.member,
  )
  mockexam_standard_scores: MockexamStandardScoreEntity[];

  @OneToMany(() => PostEntity, (post) => post.member)
  posts: PostEntity[];

  @OneToMany(() => CommentEntity, (comment) => comment.member)
  comments: CommentEntity[];

  @OneToMany(() => MemberRecruitmentUnitCombinationEntity, (combination) => combination.member)
  combinations: MemberRecruitmentUnitCombinationEntity[];
}
