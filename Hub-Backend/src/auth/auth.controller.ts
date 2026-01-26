import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  SerializeOptions,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { loginWithEmailDto } from './dtos/login-with-email.dto';
import { LoginResponseType } from './types/login-response.type';
import { Public } from './decorators/public.decorator';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { LogoutDto } from './dtos/logout.dto';
import { LoginWithSocialDto } from './dtos/login-with-social.dto';
import { SmsService } from 'src/modules/sms/sms.service';
import { SendSignupCodeDto } from './dtos/send-signup-code.dto';
import { MembersService } from 'src/modules/members/services/members.service';
import { VerifyCodeDto } from './dtos/verify-code.dto';
import { RegisterWithEmailDto } from './dtos/register-with-email.dto';
import { RegisterWithSocialDto } from './dtos/register-with-social';
import { CurrentMemberId } from './decorators/current-member_id.decorator';
import { MemberEntity } from 'src/database/entities/member/member.entity';
import { CookieService } from './services/cookie.service';
import { VerifyTokenDto } from './dtos/verify-token.dto';
import { FirebaseLoginDto, FirebaseRegisterDto } from './dtos/firebase-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly smsService: SmsService,
    private readonly membersService: MembersService,
    private readonly cookieService: CookieService,
  ) {}

  @ApiOperation({
    summary: '내 정보 조회',
    description: '현재 로그인한 사용자의 상세 정보를 조회합니다. JWT 토큰 인증이 필요합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
    type: MemberEntity,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (JWT 토큰 없음 또는 유효하지 않음)',
  })
  @ApiBearerAuth('access-token')
  @SerializeOptions({
    groups: ['me'],
  })
  @Get('me')
  public getCurrentMember(@CurrentMemberId() memberId: string): Promise<MemberEntity> {
    return this.membersService.findMeById(Number(memberId));
  }

  @ApiOperation({
    summary: '활성화 중인 서비스 조회',
    description: '현재 로그인한 사용자가 구독 중인 활성화된 서비스 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '활성 서비스 목록 조회 성공',
    type: [String],
    example: ['수시_교과', '정시_표준점수'],
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (JWT 토큰 없음 또는 유효하지 않음)',
  })
  @ApiBearerAuth('access-token')
  @SerializeOptions({
    groups: ['me'],
  })
  @Get('me/active')
  public getCurrentMemberActiveService(@CurrentMemberId() memberId: string): Promise<string[]> {
    return this.membersService.findActiveServicesById(Number(memberId));
  }

  @ApiOperation({
    summary: '이메일로 로그인',
    description:
      '이메일과 비밀번호를 사용하여 로그인합니다. 성공 시 JWT 액세스 토큰과 리프레시 토큰을 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        tokenExpiry: 7200,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (이메일 형식 오류, 비밀번호 길이 오류)',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (이메일 또는 비밀번호 불일치)',
  })
  @SerializeOptions({
    groups: ['me'],
  })
  @Public()
  @Post('login/email')
  public async loginWithEmail(
    @Body() loginDto: loginWithEmailDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseType> {
    const result = await this.service.validateLogin(loginDto);

    // HttpOnly 쿠키로 토큰 설정 (XSS 공격 방지)
    this.cookieService.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      result.tokenExpiry * 1000, // 초 → 밀리초 변환
      60 * 24 * 60 * 60 * 1000, // 60일 (밀리초)
    );

    return result;
  }

  @ApiOperation({
    summary: '이메일로 회원가입',
    description:
      '이메일과 비밀번호를 사용하여 새 계정을 생성합니다. 회원가입 성공 시 자동 로그인되며 JWT 토큰을 반환합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        tokenExpiry: 7200,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (이메일 중복, 전화번호 중복, 필수 필드 누락)',
  })
  @SerializeOptions({
    groups: ['me'],
  })
  @Public()
  @Post('register/email')
  public async registerWithEmail(
    @Body() registerDto: RegisterWithEmailDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseType> {
    const result = await this.service.registerWithEmail(registerDto);

    // HttpOnly 쿠키로 토큰 설정 (XSS 공격 방지)
    this.cookieService.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      result.tokenExpiry * 1000,
      60 * 24 * 60 * 60 * 1000,
    );

    return result;
  }

  @ApiOperation({
    summary: '소셜 로그인',
    description:
      '네이버 또는 구글 소셜 로그인을 수행합니다. OAuth 제공자로부터 발급받은 액세스 토큰을 사용합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '소셜 로그인 성공',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        tokenExpiry: 7200,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (소셜 타입 오류, 액세스 토큰 없음)',
  })
  @ApiResponse({
    status: 401,
    description: '소셜 인증 실패 (유효하지 않은 액세스 토큰)',
  })
  @SerializeOptions({
    groups: ['me'],
  })
  @Public()
  @Post('login/social')
  public async socialLogin(
    @Body() body: LoginWithSocialDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseType> {
    const result = await this.service.validateSocialLogin(body);

    // HttpOnly 쿠키로 토큰 설정 (XSS 공격 방지)
    this.cookieService.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      result.tokenExpiry * 1000,
      60 * 24 * 60 * 60 * 1000,
    );

    return result;
  }

  @ApiOperation({
    summary: '소셜 회원가입',
    description:
      '네이버 또는 구글 소셜 로그인으로 새 계정을 생성합니다. 추가 정보 입력이 필요합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '소셜 회원가입 성공',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        tokenExpiry: 7200,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (전화번호 중복, 소셜 계정 이미 등록됨, 필수 필드 누락)',
  })
  @ApiResponse({
    status: 401,
    description: '소셜 인증 실패 (유효하지 않은 액세스 토큰)',
  })
  @SerializeOptions({
    groups: ['me'],
  })
  @Public()
  @Post('register/social')
  public async registerWithSocial(
    @Body() registerDto: RegisterWithSocialDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseType> {
    const result = await this.service.registerWithSocial(registerDto);

    // HttpOnly 쿠키로 토큰 설정 (XSS 공격 방지)
    this.cookieService.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      result.tokenExpiry * 1000,
      60 * 24 * 60 * 60 * 1000,
    );

    return result;
  }

  @ApiOperation({
    summary: 'JWT 토큰 리프레시',
    description:
      '만료된 액세스 토큰을 리프레시 토큰을 사용하여 갱신합니다. 새로운 액세스 토큰과 리프레시 토큰을 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        tokenExpiry: 7200,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '리프레시 토큰 유효하지 않음 또는 만료됨',
  })
  @Public()
  @Post('refresh')
  async refresh(
    @Body() refreshDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseType> {
    // 쿠키 또는 요청 바디에서 리프레시 토큰 추출
    const refreshToken = this.cookieService.extractRefreshToken(req) || refreshDto.refreshToken;

    const result = await this.service.refreshToken({
      refreshToken,
    });

    // HttpOnly 쿠키로 새 토큰 설정
    this.cookieService.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      result.tokenExpiry * 1000,
      60 * 24 * 60 * 60 * 1000,
    );

    return result;
  }

  @ApiOperation({
    summary: '로그아웃',
    description:
      '사용자를 로그아웃합니다. 리프레시 토큰을 블랙리스트에 추가하여 더 이상 사용할 수 없게 합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (JWT 토큰 없음 또는 유효하지 않음)',
  })
  @Public()
  @Post('logout')
  async logout(
    @Body() logoutDto: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    // 쿠키 또는 요청 바디에서 리프레시 토큰 추출
    const refreshToken = this.cookieService.extractRefreshToken(req) || logoutDto?.refreshToken;

    if (refreshToken) {
      await this.service.logout(refreshToken);
    }

    // 모든 인증 쿠키 삭제
    this.cookieService.clearAuthCookies(res);

    return null;
  }

  @ApiOperation({
    summary: '휴대폰 본인인증번호 발송',
    description:
      '회원가입 시 휴대폰 본인인증을 위한 6자리 인증번호를 SMS로 발송합니다. 이메일과 전화번호 중복을 체크합니다.',
  })
  @ApiQuery({
    name: 'branch',
    required: false,
    description: '지점 코드 (선택)',
    example: 'gangnam',
  })
  @ApiResponse({
    status: 200,
    description: '인증번호 발송 성공',
  })
  @ApiResponse({
    status: 400,
    description: '이미 사용 중인 이메일 또는 전화번호',
  })
  @Public()
  @Post('register/send-code')
  async sendSignupCode(@Body() body: SendSignupCodeDto, @Query('branch') branch?: string) {
    if (body.email && (await this.membersService.findOneByEmail(body.email))) {
      throw new BadRequestException('이미 사용중인 이메일입니다.');
    }
    if (await this.membersService.findOneByPhone(body.phone.replaceAll('-', ''))) {
      throw new BadRequestException('이미 사용중인 휴대폰입니다.');
    }

    await this.smsService.sendRegisterCode(body.phone, branch);

    return null;
  }

  @ApiOperation({
    summary: '인증코드 확인',
    description: 'SMS로 전송된 6자리 인증코드를 확인합니다. 회원가입 프로세스의 일부입니다.',
  })
  @ApiResponse({
    status: 200,
    description: '인증코드 확인 성공',
  })
  @ApiResponse({
    status: 502,
    description: '인증코드 불일치',
  })
  @Public()
  @Post('verify-code')
  async verifyCode(@Body() verifyDto: VerifyCodeDto) {
    const isValid = await this.smsService.verifyCode(verifyDto.phone, verifyDto.code);
    if (!isValid) {
      throw new BadGatewayException('인증코드가 일치하지 않습니다.');
    }

    return null;
  }

  @ApiOperation({
    summary: '비밀번호 재설정 인증번호 요청',
    description: '비밀번호 찾기를 위해 이메일과 전화번호를 확인하고 SMS 인증번호를 발송합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'student@example.com',
        },
        phone: { type: 'string', example: '010-1234-5678' },
      },
      required: ['email', 'phone'],
    },
  })
  @ApiQuery({
    name: 'branch',
    required: false,
    description: '지점 코드 (선택)',
    example: 'gangnam',
  })
  @ApiResponse({
    status: 200,
    description: '인증번호 발송 성공',
  })
  @ApiResponse({
    status: 400,
    description: '이메일과 전화번호가 일치하지 않음',
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
  })
  @Public()
  @Post('password-reset-request')
  async passwordResetRequest(
    @Body() body: { email: string; phone: string },
    @Query('branch') branch?: string,
  ) {
    return this.service.requestPasswordResetCode(body.email, body.phone, branch);
  }

  @ApiOperation({
    summary: '비밀번호 재설정 인증번호 확인 및 토큰 발급',
    description: 'SMS로 전송된 인증번호를 확인하고 비밀번호 재설정을 위한 임시 토큰을 발급합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', example: '010-1234-5678' },
        code: { type: 'string', example: '123456' },
      },
      required: ['phone', 'code'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '인증 성공, 비밀번호 재설정 토큰 발급',
    schema: {
      example: {
        resetToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '인증코드 불일치',
  })
  @Public()
  @Post('verify-reset-code')
  async verifyResetCode(@Body() body: { phone: string; code: string }) {
    return this.service.verifyResetCodeAndCreateToken(body.phone, body.code);
  }

  @ApiOperation({
    summary: '비밀번호 재설정',
    description: '비밀번호 재설정 토큰을 사용하여 새 비밀번호로 변경합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        newPassword: { type: 'string', example: 'newPassword123!' },
      },
      required: ['token', 'newPassword'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '비밀번호 재설정 성공',
  })
  @ApiResponse({
    status: 400,
    description: '유효하지 않거나 만료된 토큰',
  })
  @Public()
  @Post('password-reset')
  async passwordReset(@Body() body: { token: string; newPassword: string }) {
    return this.service.resetPassword(body.token, body.newPassword);
  }

  @ApiOperation({
    summary: 'SSO 토큰 검증',
    description:
      '다른 앱(Susi, StudyPlanner 등)에서 Hub가 발급한 JWT 토큰을 검증하기 위한 API입니다. ' +
      'SSO(Single Sign-On) 구현을 위해 사용됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '토큰 검증 성공',
    schema: {
      example: {
        valid: true,
        memberId: 123,
        email: 'user@example.com',
        name: '홍길동',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '토큰 검증 실패 (유효하지 않거나 만료됨)',
    schema: {
      example: {
        valid: false,
      },
    },
  })
  @Public()
  @Post('verify-token')
  async verifyToken(
    @Body() dto: VerifyTokenDto,
  ): Promise<{ valid: boolean; memberId?: number; email?: string; name?: string }> {
    return this.service.verifyToken(dto.accessToken);
  }

  @ApiOperation({
    summary: 'Firebase 로그인',
    description:
      'Firebase ID 토큰을 사용하여 로그인합니다. Firebase Auth에서 인증된 사용자의 토큰을 검증하고 Hub JWT 토큰을 발급합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'Firebase 로그인 성공',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        tokenExpiry: 7200,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Firebase 인증 실패',
  })
  @ApiResponse({
    status: 404,
    description: '회원 정보를 찾을 수 없음 (회원가입 필요)',
  })
  @SerializeOptions({
    groups: ['me'],
  })
  @Public()
  @Post('firebase/login')
  public async loginWithFirebase(
    @Body() dto: FirebaseLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseType> {
    const result = await this.service.loginWithFirebase(dto.idToken);

    // HttpOnly 쿠키로 토큰 설정 (XSS 공격 방지)
    this.cookieService.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      result.tokenExpiry * 1000,
      60 * 24 * 60 * 60 * 1000,
    );

    return result;
  }

  @ApiOperation({
    summary: 'Firebase 회원가입',
    description:
      'Firebase ID 토큰을 사용하여 새 계정을 생성합니다. Firebase Auth에서 인증된 사용자의 토큰을 검증하고 새 회원을 등록합니다.',
  })
  @ApiResponse({
    status: 201,
    description: 'Firebase 회원가입 성공',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        tokenExpiry: 7200,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '이미 가입된 Firebase 계정 또는 이메일',
  })
  @ApiResponse({
    status: 401,
    description: 'Firebase 인증 실패',
  })
  @SerializeOptions({
    groups: ['me'],
  })
  @Public()
  @Post('firebase/register')
  public async registerWithFirebase(
    @Body() dto: FirebaseRegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseType> {
    const result = await this.service.registerWithFirebase(dto.idToken);

    // HttpOnly 쿠키로 토큰 설정 (XSS 공격 방지)
    this.cookieService.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      result.tokenExpiry * 1000,
      60 * 24 * 60 * 60 * 1000,
    );

    return result;
  }
}
