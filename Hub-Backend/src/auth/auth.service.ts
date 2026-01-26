import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LoginResponseType } from './types/login-response.type';
import { AuthProviderEnum } from 'src/modules/members/enums/auth-provider.enum';
import { JwtService } from 'src/common/jwt/jwt.service';
import { BcryptService } from 'src/common/bcrypt/bcrypt.service';
import { MembersService } from 'src/modules/members/services/members.service';
import { STATUS_MESSAGES } from 'src/common/utils/error-messages';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { LoginWithSocialDto } from './dtos/login-with-social.dto';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { SocialUser } from './types/social-user.type';
import { RegisterWithEmailDto } from './dtos/register-with-email.dto';
import { loginWithEmailDto } from './dtos/login-with-email.dto';
import { RegisterWithSocialDto } from './dtos/register-with-social';
import { SmsService } from 'src/modules/sms/sms.service';
import { MentoringService } from 'src/modules/mentoring/mentoring.service';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SubscriptionService } from 'src/modules/subscription/subscription.service';
import { PermissionsPayload } from './types/jwt-payload.type';
import { FirebaseAdminService } from 'src/firebase/firebase-admin.service';

// 토큰 블랙리스트 캐시 키 접두사
const TOKEN_BLACKLIST_PREFIX = 'token_blacklist:';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private membersService: MembersService,
    private bcryptService: BcryptService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly httpService: HttpService,
    private readonly smsService: SmsService,
    private readonly mentoringService: MentoringService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Optional() private readonly subscriptionService?: SubscriptionService,
    @Optional() private readonly firebaseAdminService?: FirebaseAdminService,
  ) {}

  /**
   * 사용자의 앱별 권한 정보를 가져옵니다.
   * SubscriptionService가 없으면 빈 객체 반환
   */
  private async getMemberPermissions(memberId: number): Promise<PermissionsPayload | undefined> {
    if (!this.subscriptionService) {
      return undefined;
    }
    try {
      const permissions = await this.subscriptionService.getMemberPermissions(memberId);
      // PermissionsDto를 PermissionsPayload로 변환
      const payload: PermissionsPayload = {};
      for (const [appId, permission] of Object.entries(permissions)) {
        if (permission) {
          payload[appId] = {
            plan: permission.plan,
            expires: permission.expires,
            features: permission.features,
          };
        }
      }
      return Object.keys(payload).length > 0 ? payload : undefined;
    } catch (error) {
      this.logger.warn(`[권한 조회 실패] memberId=${memberId}: ${error.message}`);
      return undefined;
    }
  }
  // 이메일 로그인
  async validateLogin(dto: loginWithEmailDto): Promise<LoginResponseType> {
    const member = await this.membersService.findOneByEmail(dto.email);

    if (!member) {
      throw new NotFoundException(STATUS_MESSAGES.MEMBER.ACCOUNT_NOT_FOUND);
    }
    // hub와 local(email) provider만 이메일/비밀번호 로그인 허용
    const allowedProviders = [AuthProviderEnum.email, AuthProviderEnum.hub];
    if (
      member.provider_type !== null &&
      !allowedProviders.includes(member.provider_type as AuthProviderEnum)
    ) {
      throw new BadRequestException(STATUS_MESSAGES.MEMBER.PROVIDER_MISMATCH);
    }
    if (!member.password) {
      throw new UnauthorizedException(STATUS_MESSAGES.MEMBER.NO_PASSWORD);
    }
    const isValidPassword = await this.bcryptService.comparePassword(dto.password, member.password);
    if (!isValidPassword) {
      throw new UnauthorizedException(STATUS_MESSAGES.MEMBER.PASSWORD_MISMATCH);
    }

    // 앱별 권한 정보 조회
    const permissions = await this.getMemberPermissions(member.id);

    const accessToken = this.jwtService.createAccessToken(member.id, permissions);
    const refreshToken = this.jwtService.createRefreshToken(member.id);
    const tokenExpiry = this.jwtService.getTokenExpiryTime();
    const activeServices = await this.membersService.findActiveServicesById(member.id);

    return {
      accessToken,
      refreshToken,
      tokenExpiry,
      activeServices,
    };
  }

  // 이메일로 회원가입
  async registerWithEmail(dto: RegisterWithEmailDto): Promise<LoginResponseType> {
    const existMember = await this.membersService.findOneByEmail(dto.email);

    if (existMember) {
      throw new BadRequestException('이미 가입된 이메일입니다.');
    }

    const member = await this.membersService.saveMemberByEmail(dto);

    // 초대 코드가 있으면 처리
    if (dto.inviteCode) {
      try {
        const result = await this.mentoringService.processInviteAfterRegister(
          member.id,
          dto.inviteCode,
        );
        if (result.success) {
          this.logger.info(
            `[회원가입] 초대 코드 처리 성공: memberId=${member.id}, inviteCode=${dto.inviteCode}`,
          );
        } else {
          this.logger.warn(
            `[회원가입] 초대 코드 처리 실패: memberId=${member.id}, message=${result.message}`,
          );
        }
      } catch (error) {
        // 초대 코드 처리 실패해도 회원가입은 성공 처리
        this.logger.error(
          `[회원가입] 초대 코드 처리 오류: memberId=${member.id}, error=${error.message}`,
        );
      }
    }

    // 앱별 권한 정보 조회 (신규 가입이므로 기본값)
    const permissions = await this.getMemberPermissions(member.id);

    const accessToken = this.jwtService.createAccessToken(member.id, permissions);
    const refreshToken = this.jwtService.createRefreshToken(member.id);
    const tokenExpiry = this.jwtService.getTokenExpiryTime();
    const activeServices = await this.membersService.findActiveServicesById(member.id);

    return {
      accessToken,
      refreshToken,
      tokenExpiry,
      activeServices,
    };
  }

  // 소셜 회원가입
  async registerWithSocial(dto: RegisterWithSocialDto): Promise<LoginResponseType> {
    let profile: SocialUser | null;
    if (dto.socialType === 'naver') {
      profile = await this.getProfileWithNaver(dto.accessToken);
    } else if (dto.socialType === 'google') {
      profile = await this.getProfileWithGoogle(dto.accessToken);
    }
    if (profile.id) {
      const member = await this.membersService.findOneByOAuthId(profile.id);
      if (member) {
        this.logger.warn('[소셜 회원가입] 이미 가입된 이메일입니다. ', member.email);
        throw new BadRequestException('이미 가입된 소셜 계정이 존재합니다.');
      }
    }
    if (profile.email) {
      const member = await this.membersService.findOneByEmail(profile.email);
      if (member) {
        throw new BadRequestException('이미 사용중인 이메일입니다.');
      }
    }

    const member = await this.membersService.saveMemberBySocial(dto, profile);

    // 초대 코드가 있으면 처리
    if (dto.inviteCode) {
      try {
        const result = await this.mentoringService.processInviteAfterRegister(
          member.id,
          dto.inviteCode,
        );
        if (result.success) {
          this.logger.info(
            `[소셜 회원가입] 초대 코드 처리 성공: memberId=${member.id}, inviteCode=${dto.inviteCode}`,
          );
        } else {
          this.logger.warn(
            `[소셜 회원가입] 초대 코드 처리 실패: memberId=${member.id}, message=${result.message}`,
          );
        }
      } catch (error) {
        // 초대 코드 처리 실패해도 회원가입은 성공 처리
        this.logger.error(
          `[소셜 회원가입] 초대 코드 처리 오류: memberId=${member.id}, error=${error.message}`,
        );
      }
    }

    // 앱별 권한 정보 조회 (신규 가입이므로 기본값)
    const permissions = await this.getMemberPermissions(member.id);

    const accessToken = this.jwtService.createAccessToken(member.id, permissions);
    const refreshToken = this.jwtService.createRefreshToken(member.id);
    const tokenExpiry = this.jwtService.getTokenExpiryTime();
    const activeServices = await this.membersService.findActiveServicesById(member.id);

    return {
      accessToken,
      refreshToken,
      tokenExpiry,
      activeServices,
    };
  }

  // 소셜 로그인
  async validateSocialLogin(dto: LoginWithSocialDto): Promise<LoginResponseType> {
    let profile: SocialUser | null;
    if (dto.socialType === 'naver') {
      profile = await this.getProfileWithNaver(dto.accessToken);
    } else if (dto.socialType === 'google') {
      profile = await this.getProfileWithGoogle(dto.accessToken);
    }

    if (profile.email) {
      const member = await this.membersService.findOneByEmailAndProviderType(
        profile.email,
        'local',
      );
      if (member) {
        this.logger.warn('[소셜 로그인] 이미 가입된 이메일입니다. ', member.email);
        throw new BadRequestException('이미 이메일/패스워드로 가입된 계정입니다. ');
      }
    }

    const member = await this.membersService.findOneByOAuthId(profile.id);
    if (!member) {
      throw new NotFoundException('소셜 계정이 존재하지 않습니다. 회원가입을 진행해주세요!');
    }

    // 앱별 권한 정보 조회
    const permissions = await this.getMemberPermissions(member.id);

    const accessToken = this.jwtService.createAccessToken(member.id, permissions);
    const refreshToken = this.jwtService.createRefreshToken(member.id);
    const tokenExpiry = this.jwtService.getTokenExpiryTime();
    const activeServices = await this.membersService.findActiveServicesById(member.id);

    return {
      accessToken,
      refreshToken,
      tokenExpiry,
      activeServices,
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<LoginResponseType> {
    try {
      // 블랙리스트 체크
      const isBlacklisted = await this.isTokenBlacklisted(dto.refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('로그아웃된 토큰입니다.');
      }

      const memberId = this.jwtService.getMemberIdFromToken(
        dto.refreshToken,
        this.configService.getOrThrow('auth', { infer: true }).refreshSecret,
      );
      const member = await this.membersService.findOneById(Number(memberId));

      if (!member) {
        throw new NotFoundException(STATUS_MESSAGES.MEMBER.ACCOUNT_NOT_FOUND);
      }

      // 앱별 권한 정보 조회 (토큰 갱신 시에도 최신 권한 반영)
      const permissions = await this.getMemberPermissions(member.id);

      const accessToken = this.jwtService.createAccessToken(member.id, permissions);
      const refreshToken = this.jwtService.createRefreshToken(member.id);
      const tokenExpiry = this.jwtService.getTokenExpiryTime();
      const activeServices = await this.membersService.findActiveServicesById(member.id);

      return {
        accessToken,
        refreshToken,
        tokenExpiry,
        activeServices,
      };
    } catch (e) {
      throw new UnauthorizedException(STATUS_MESSAGES.AUTH.INVALID_TOKEN);
    }
  }

  /**
   * 로그아웃 - Refresh Token을 블랙리스트에 추가
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      // 토큰 유효성 검증 및 만료 시간 추출
      const claims = this.jwtService.extractAllClaims(
        refreshToken,
        this.configService.getOrThrow('auth', { infer: true }).refreshSecret,
      );

      // 토큰의 남은 유효 시간 계산 (초 단위)
      const expiresAt = claims.exp;
      const now = Math.floor(Date.now() / 1000);
      const ttl = expiresAt - now;

      if (ttl > 0) {
        // 블랙리스트에 토큰 추가 (토큰 만료 시까지만 유지)
        await this.cacheManager.set(
          `${TOKEN_BLACKLIST_PREFIX}${refreshToken}`,
          'blacklisted',
          ttl * 1000, // cache-manager는 밀리초 단위
        );
        this.logger.info(`[로그아웃] 토큰이 블랙리스트에 추가되었습니다.`);
      }
    } catch (error) {
      // 이미 만료된 토큰이거나 유효하지 않은 토큰이어도 로그아웃은 성공 처리
      this.logger.warn(`[로그아웃] 토큰 처리 중 오류 발생: ${error.message}`);
    }
  }

  /**
   * 토큰이 블랙리스트에 있는지 확인
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.cacheManager.get(`${TOKEN_BLACKLIST_PREFIX}${token}`);
    return result !== null && result !== undefined;
  }

  async getProfileWithNaver(accessToken: string): Promise<SocialUser> {
    const TIMEOUT_MS = 10000; // 10초 타임아웃

    try {
      const response = await firstValueFrom(
        this.httpService
          .get('https://openapi.naver.com/v1/nid/me', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            timeout: TIMEOUT_MS,
          })
          .pipe(
            catchError((error: AxiosError) => {
              if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                this.logger.error(`[Naver 로그인] 타임아웃 발생: ${TIMEOUT_MS}ms 초과`);
                throw new Error('네이버 서버 응답 시간 초과');
              }
              this.logger.error(`[Naver 로그인] API 에러: ${error.message}`);
              throw new Error(`네이버 프로필 정보 가져오기 실패: ${error.message}`);
            }),
          ),
      );

      const { id, name, email, profile_image } = response.data.response;

      return {
        id,
        name,
        email,
        profile_image,
      };
    } catch (err) {
      this.logger.error(`[Naver 로그인] 프로필 조회 실패: ${err.message}`);
      throw new Error(`네이버 프로필 조회 실패: ${err.message}`);
    }
  }

  async getProfileWithGoogle(accessToken: string): Promise<SocialUser> {
    const TIMEOUT_MS = 10000; // 10초 타임아웃

    try {
      const response = await firstValueFrom(
        this.httpService
          .get(`https://oauth2.googleapis.com/tokeninfo?id_token=${accessToken}`, {
            timeout: TIMEOUT_MS,
          })
          .pipe(
            catchError((error: AxiosError) => {
              if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                this.logger.error(`[Google 로그인] 타임아웃 발생: ${TIMEOUT_MS}ms 초과`);
                throw new Error('구글 서버 응답 시간 초과');
              }
              this.logger.error(`[Google 로그인] API 에러: ${error.message}`);
              throw new Error(`구글 프로필 정보 가져오기 실패: ${error.message}`);
            }),
          ),
      );

      const { sub, name, email, picture } = response.data;

      return {
        id: sub,
        name,
        email,
        profile_image: picture,
      };
    } catch (err) {
      this.logger.error(`[Google 로그인] 프로필 조회 실패: ${err.message}`);
      throw new Error(`구글 프로필 조회 실패: ${err.message}`);
    }
  }

  async requestPasswordResetCode(email: string, phone: string, branch?: string): Promise<void> {
    const member = await this.membersService.findOneByEmailAndPhone(email, phone);
    if (!member) {
      throw new NotFoundException('일치하는 회원 정보가 없습니다.');
    }

    await this.smsService.sendRegisterCode(phone.replaceAll('-', ''), branch);
    return null;
  }

  async verifyResetCodeAndCreateToken(phone: string, code: string): Promise<{ token: string }> {
    const isValid = await this.smsService.verifyCode(phone.replaceAll('-', ''), code);
    if (!isValid) {
      throw new BadRequestException('유효하지 않은 인증번호입니다.');
    }

    const member = await this.membersService.findOneByPhone(phone.replaceAll('-', ''));
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }
    const token = this.jwtService.createAccessToken(member.id);
    return { token };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const memberId = this.jwtService.getMemberIdFromToken(
        token,
        this.configService.getOrThrow('auth', { infer: true }).secret,
      );

      const member = await this.membersService.findOneById(Number(memberId));
      if (!member) {
        throw new NotFoundException('회원을 찾을 수 없습니다.');
      }

      const hashedPassword = await this.bcryptService.hashPassword(newPassword);
      await this.membersService.updatePassword(member.id, hashedPassword);
      return null;
    } catch (error) {
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰입니다.');
    }
  }

  /**
   * SSO 토큰 검증
   * 다른 앱에서 Hub가 발급한 토큰의 유효성을 검증합니다.
   */
  async verifyToken(
    accessToken: string,
  ): Promise<{ valid: boolean; memberId?: number; email?: string; name?: string }> {
    try {
      // 토큰 블랙리스트 체크
      const isBlacklisted = await this.isTokenBlacklisted(accessToken);
      if (isBlacklisted) {
        return { valid: false };
      }

      // 토큰에서 memberId 추출
      const memberId = this.jwtService.getMemberIdFromToken(
        accessToken,
        this.configService.getOrThrow('auth', { infer: true }).secret,
      );

      // 사용자 정보 조회
      const member = await this.membersService.findOneById(Number(memberId));

      if (!member) {
        return { valid: false };
      }

      // 검증 성공
      return {
        valid: true,
        memberId: member.id,
        email: member.email,
        name: member.nickname,
      };
    } catch (error) {
      // 토큰이 유효하지 않거나 만료된 경우
      this.logger.warn(`[토큰 검증 실패] ${error.message}`);
      return { valid: false };
    }
  }

  /**
   * Firebase ID 토큰으로 로그인
   * Firebase Auth에서 인증된 사용자의 ID 토큰을 검증하고 Hub JWT 토큰을 발급합니다.
   */
  async loginWithFirebase(idToken: string): Promise<LoginResponseType> {
    if (!this.firebaseAdminService) {
      throw new BadRequestException('Firebase 인증이 설정되지 않았습니다.');
    }

    try {
      // Firebase ID 토큰 검증
      const decodedToken = await this.firebaseAdminService.verifyIdToken(idToken);

      // Firebase UID로 사용자 조회
      let member = await this.membersService.findOneByFirebaseUid(decodedToken.uid);

      if (!member) {
        // 이메일로 사용자 조회 (기존 사용자가 Firebase로 전환하는 경우)
        if (decodedToken.email) {
          member = await this.membersService.findOneByEmail(decodedToken.email);
          if (member) {
            // 기존 사용자에 Firebase UID 연결
            await this.membersService.linkFirebaseUid(member.id, decodedToken.uid);
          }
        }
      }

      if (!member) {
        throw new NotFoundException('회원 정보를 찾을 수 없습니다. 먼저 회원가입해 주세요.');
      }

      // 앱별 권한 정보 조회
      const permissions = await this.getMemberPermissions(member.id);

      const accessToken = this.jwtService.createAccessToken(member.id, permissions);
      const refreshToken = this.jwtService.createRefreshToken(member.id);
      const tokenExpiry = this.jwtService.getTokenExpiryTime();
      const activeServices = await this.membersService.findActiveServicesById(member.id);

      this.logger.info(`[Firebase 로그인] memberId=${member.id}, email=${member.email}`);

      return {
        accessToken,
        refreshToken,
        tokenExpiry,
        activeServices,
      };
    } catch (error) {
      this.logger.error(`[Firebase 로그인 실패] ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new UnauthorizedException('Firebase 인증에 실패했습니다.');
    }
  }

  /**
   * Firebase ID 토큰으로 회원가입
   * Firebase Auth에서 인증된 사용자의 ID 토큰을 검증하고 새 회원을 생성합니다.
   */
  async registerWithFirebase(idToken: string): Promise<LoginResponseType> {
    if (!this.firebaseAdminService) {
      throw new BadRequestException('Firebase 인증이 설정되지 않았습니다.');
    }

    try {
      // Firebase ID 토큰 검증
      const decodedToken = await this.firebaseAdminService.verifyIdToken(idToken);

      // 이미 가입된 사용자인지 확인
      const existingByUid = await this.membersService.findOneByFirebaseUid(decodedToken.uid);
      if (existingByUid) {
        throw new BadRequestException('이미 가입된 Firebase 계정입니다.');
      }

      if (decodedToken.email) {
        const existingByEmail = await this.membersService.findOneByEmail(decodedToken.email);
        if (existingByEmail) {
          throw new BadRequestException('이미 사용 중인 이메일입니다.');
        }
      }

      // 새 회원 생성
      const member = await this.membersService.saveMemberByFirebase({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        photoUrl: decodedToken.picture,
        provider: decodedToken.firebase?.sign_in_provider || 'firebase',
      });

      // 앱별 권한 정보 조회
      const permissions = await this.getMemberPermissions(member.id);

      const accessToken = this.jwtService.createAccessToken(member.id, permissions);
      const refreshToken = this.jwtService.createRefreshToken(member.id);
      const tokenExpiry = this.jwtService.getTokenExpiryTime();
      const activeServices = await this.membersService.findActiveServicesById(member.id);

      this.logger.info(`[Firebase 회원가입] memberId=${member.id}, email=${member.email}`);

      return {
        accessToken,
        refreshToken,
        tokenExpiry,
        activeServices,
      };
    } catch (error) {
      this.logger.error(`[Firebase 회원가입 실패] ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Firebase 인증에 실패했습니다.');
    }
  }
}
