import { ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Request } from 'express';
import { JwtService } from 'src/common/jwt/jwt.service';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { STATUS_MESSAGES } from 'src/common/utils/error-messages';
import { FirebaseAdminService } from 'src/firebase/firebase-admin.service';
import { MembersService } from 'src/modules/members/services/members.service';

/**
 * 하이브리드 JWT/Firebase 인증 가드
 *
 * 인증 순서:
 * 1. Firebase ID Token 검증 시도 (firebase_uid로 회원 조회)
 * 2. 실패 시 기존 JWT 토큰 검증 시도
 *
 * jwt 인증 통과 시 request['memberId'] 값이 저장됨
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService<AllConfigType>,
    private firebaseAdminService: FirebaseAdminService,
    private membersService: MembersService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException(STATUS_MESSAGES.AUTH.UNAUTHORIZED);
    }

    // 1. Firebase ID Token 검증 시도
    const firebaseResult = await this.tryFirebaseAuth(token);
    if (firebaseResult.success) {
      request['memberId'] = firebaseResult.memberId;
      request['firebaseUid'] = firebaseResult.firebaseUid;
      return true;
    }

    // 2. 기존 JWT 토큰 검증 시도
    try {
      const memberId = this.jwtService.getMemberIdFromToken(
        token,
        this.configService.getOrThrow('auth', { infer: true }).secret,
      );
      request['memberId'] = memberId;
      return true;
    } catch {
      throw new UnauthorizedException(STATUS_MESSAGES.AUTH.UNAUTHORIZED);
    }
  }

  /**
   * Firebase ID Token 검증 시도
   */
  private async tryFirebaseAuth(token: string): Promise<{
    success: boolean;
    memberId?: string;
    firebaseUid?: string;
  }> {
    try {
      // Firebase ID Token 검증
      const decodedToken = await this.firebaseAdminService.verifyIdToken(token);

      // firebase_uid로 회원 조회
      const member = await this.membersService.findOneByFirebaseUid(decodedToken.uid);
      if (member) {
        return {
          success: true,
          memberId: String(member.id),
          firebaseUid: decodedToken.uid,
        };
      }

      // 이메일로 회원 조회 후 firebase_uid 연동
      if (decodedToken.email) {
        const memberByEmail = await this.membersService.findOneByEmail(decodedToken.email);
        if (memberByEmail) {
          // firebase_uid 자동 연동
          await this.membersService.linkFirebaseUid(memberByEmail.id, decodedToken.uid);
          this.logger.log(`Linked Firebase UID to member: ${memberByEmail.id}`);
          return {
            success: true,
            memberId: String(memberByEmail.id),
            firebaseUid: decodedToken.uid,
          };
        }
      }

      // 회원 없음 - Firebase 인증 실패 처리 (JWT로 폴백)
      return { success: false };
    } catch {
      // Firebase 토큰 검증 실패 (JWT 토큰일 수 있음)
      return { success: false };
    }
  }

  /**
   * Authorization 헤더 또는 쿠키에서 토큰 추출
   */
  private extractToken(request: Request): string | undefined {
    // 1. Authorization 헤더에서 추출 (우선)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. 쿠키에서 추출 (HttpOnly 쿠키 지원)
    return request.cookies?.access_token;
  }
}
