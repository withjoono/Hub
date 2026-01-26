import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterWithEmailDto } from 'src/auth/dtos/register-with-email.dto';
import { RegisterWithSocialDto } from 'src/auth/dtos/register-with-social';
import { SocialUser } from 'src/auth/types/social-user.type';
import { BcryptService } from 'src/common/bcrypt/bcrypt.service';
import { MemberEntity } from 'src/database/entities/member/member.entity';
import { DataSource, Repository } from 'typeorm';
import { EditProfileDto } from '../dtos/edit-profile.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(MemberEntity)
    private membersRepository: Repository<MemberEntity>,
    private readonly dataSource: DataSource,
    private bcryptService: BcryptService,
  ) {}

  findOneByEmail(email: string): Promise<MemberEntity | null> {
    return this.membersRepository.findOneBy({
      email,
    });
  }

  findOneByEmailAndProviderType(
    email: string,
    providerType: 'local' | 'google' | 'naver',
  ): Promise<MemberEntity | null> {
    return this.membersRepository.findOneBy({
      email,
      provider_type: providerType,
    });
  }

  findOneById(id: number): Promise<MemberEntity | null> {
    return this.membersRepository.findOneBy({
      id,
    });
  }

  findMeById(id: number): Promise<MemberEntity | null> {
    return this.membersRepository.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        role_type: true,
        phone: true,
        ck_sms_agree: true,
        nickname: true,
        s_type_id: true,
        hst_type_id: true,
        g_type_id: true,
        graduate_year: true,
        major: true,
        member_type: true,
      },
    });
  }

  async findActiveServicesById(memberId: number): Promise<string[]> {
    // 테스트 계정은 모든 서비스 이용 가능
    const testAccountEmails = ['test@test.com', 'admin@test.com'];
    const member = await this.membersRepository.findOne({
      where: { id: memberId },
      select: ['email'],
    });

    if (member && testAccountEmails.includes(member.email)) {
      return ['S', 'J', 'T']; // 수시, 정시, 티켓 모두 활성화
    }

    const query = `
      SELECT ps.service_range_code
      FROM payment_contract pc
      JOIN payment_order po ON pc.order_id = po.id
      JOIN payment_service ps ON po.pay_service_id = ps.id
      WHERE pc.member_id = $1
        AND pc.contract_period_end_dt > NOW()
        AND pc.contract_use = 1
    `;
    const results = await this.dataSource.query(query, [memberId]);

    return results.map((result) => result.service_range_code);
  }

  findOneByOAuthId(oauthId: string): Promise<MemberEntity | null> {
    return this.membersRepository.findOneBy({
      oauth_id: oauthId,
    });
  }

  findOneByPhone(phone: string): Promise<MemberEntity | null> {
    return this.membersRepository.findOneBy({
      phone: phone.replaceAll('-', ''),
    });
  }

  async saveMemberByEmail(data: RegisterWithEmailDto): Promise<MemberEntity | null> {
    const hashedPassword = await this.bcryptService.hashPassword(data.password);
    const member = this.membersRepository.create({
      nickname: data.nickname,
      email: data.email,
      password: hashedPassword,
      role_type: 'ROLE_USER',
      phone: data.phone?.replaceAll('-', '') || '', // [임시] phone 선택적 처리
      ck_sms: true,
      ck_sms_agree: data.ckSmsAgree,
      graduate_year: data.graduateYear,
      hst_type_id: data.hstTypeId,
      major: data.isMajor === '0' ? 'LiberalArts' : 'NaturalSciences',
      account_stop_yn: 'N',
      provider_type: 'local',
      member_type: data.memberType || 'student',
      create_dt: new Date(),
      update_dt: new Date(),
    });

    return this.membersRepository.save(member);
  }

  async saveMemberBySocial(
    data: RegisterWithSocialDto,
    socialUser: SocialUser,
  ): Promise<MemberEntity | null> {
    const member = this.membersRepository.create({
      nickname: data.nickname,
      email: socialUser.email,
      profile_image_url: socialUser.profile_image,
      oauth_id: socialUser.id,
      role_type: 'ROLE_USER',
      phone: data.phone?.replaceAll('-', '') || '', // [임시] phone 선택적 처리
      ck_sms: true,
      ck_sms_agree: data.ckSmsAgree,
      graduate_year: data.graduateYear,
      hst_type_id: data.hstTypeId,
      major: data.isMajor === '0' ? 'LiberalArts' : 'NaturalSciences',
      account_stop_yn: 'N',
      member_type: data.memberType || 'student',
      provider_type: data.socialType,
      create_dt: new Date(),
      update_dt: new Date(),
    });

    return this.membersRepository.save(member);
  }

  async editProfile(memberId: string, updateData: EditProfileDto): Promise<MemberEntity> {
    const member = await this.findOneById(Number(memberId));
    if (!member) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }
    if (updateData.major !== undefined) {
      if (updateData.major === 0) {
        member.major = 'LiberalArts';
      } else {
        member.major = 'NaturalSciences';
      }
    }

    if (updateData.ck_sms_agree !== undefined) {
      member.ck_sms_agree = updateData.ck_sms_agree;
    }

    if (updateData.graduate_year !== undefined) {
      member.graduate_year = updateData.graduate_year;
    }

    if (updateData.hst_type_id !== undefined) {
      member.hst_type_id = updateData.hst_type_id;
    }

    member.update_dt = new Date();

    return this.membersRepository.save(member);
  }

  findOneByEmailAndPhone(email: string, phone: string): Promise<MemberEntity | null> {
    return this.membersRepository.findOne({
      where: { email, phone: phone.replaceAll('-', '') },
    });
  }

  async updatePassword(memberId: number, newPassword: string): Promise<void> {
    await this.membersRepository.update(memberId, {
      password: newPassword,
      provider_type: 'local',
    });
  }

  // ============================================
  // Firebase Auth 관련 메서드
  // ============================================

  /**
   * Firebase UID로 회원 조회
   */
  findOneByFirebaseUid(firebaseUid: string): Promise<MemberEntity | null> {
    return this.membersRepository.findOneBy({
      firebase_uid: firebaseUid,
    });
  }

  /**
   * 기존 회원에 Firebase UID 연결
   */
  async linkFirebaseUid(memberId: number, firebaseUid: string): Promise<void> {
    await this.membersRepository.update(memberId, {
      firebase_uid: firebaseUid,
      update_dt: new Date(),
    });
  }

  /**
   * Firebase로 회원가입
   */
  async saveMemberByFirebase(data: {
    firebaseUid: string;
    email?: string;
    name: string;
    photoUrl?: string;
    provider: string;
  }): Promise<MemberEntity> {
    const member = this.membersRepository.create({
      email: data.email || `${data.firebaseUid}@firebase.local`,
      nickname: data.name,
      firebase_uid: data.firebaseUid,
      profile_image_url: data.photoUrl || null,
      role_type: 'ROLE_USER',
      phone: '', // Firebase 인증에서는 phone 없이 가입 허용
      ck_sms: false,
      ck_sms_agree: false,
      account_stop_yn: 'N',
      provider_type: data.provider === 'google.com' ? 'google' : 'firebase',
      member_type: 'student',
      create_dt: new Date(),
      update_dt: new Date(),
    });

    return this.membersRepository.save(member);
  }
}
