import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { AllConfigType } from 'src/config/config.type';
import { PermissionsPayload } from 'src/auth/types/jwt-payload.type';

@Injectable()
export class JwtService {
  private readonly HASH_ALGORITHM: jwt.Algorithm = 'HS512'; // 스프링과 일치
  private readonly SECRET_KEY: string;
  private readonly REFRESH_SECRET_KEY: string;
  private readonly TOKEN_VALIDATION_MS: number;
  private readonly REFRESH_TOKEN_VALIDATION_MS: number;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.SECRET_KEY = this.configService.getOrThrow('auth', {
      infer: true,
    }).secret;
    this.REFRESH_SECRET_KEY = this.configService.getOrThrow('auth', {
      infer: true,
    }).refreshSecret;
    this.TOKEN_VALIDATION_MS = this.configService.getOrThrow('auth', {
      infer: true,
    }).expires;
    this.REFRESH_TOKEN_VALIDATION_MS = this.configService.getOrThrow('auth', {
      infer: true,
    }).refreshExpires;
  }

  private getSigningKey(secretKey: string): Buffer {
    return Buffer.from(secretKey, 'base64'); // 스프링에서는 시크릿키를 base64 인코딩처리를 하여 사용하기 때문에 맞춰줘야함
  }

  /**
   * Access Token 생성
   * @param memberId 사용자 ID
   * @param permissions 앱별 권한 정보 (선택적)
   */
  createAccessToken(memberId: number, permissions?: PermissionsPayload): string {
    const payload: Record<string, any> = {
      sub: 'ATK',
      jti: memberId,
    };

    // permissions가 제공되면 토큰에 포함
    if (permissions && Object.keys(permissions).length > 0) {
      payload.permissions = permissions;
    }

    return jwt.sign(payload, this.getSigningKey(this.SECRET_KEY), {
      expiresIn: this.TOKEN_VALIDATION_MS / 1000,
      algorithm: this.HASH_ALGORITHM,
    });
  }

  createRefreshToken(memberId: number): string {
    const payload = {
      sub: 'RTK',
      jti: memberId,
    };
    return jwt.sign(payload, this.getSigningKey(this.REFRESH_SECRET_KEY), {
      expiresIn: this.REFRESH_TOKEN_VALIDATION_MS / 1000,
      algorithm: this.HASH_ALGORITHM,
    });
  }

  getTokenExpiryTime(): number {
    return Math.floor(Date.now() / 1000) + this.TOKEN_VALIDATION_MS / 1000;
  }

  validateToken(token: string, secret: string): boolean {
    try {
      jwt.verify(token, this.getSigningKey(secret), {
        algorithms: [this.HASH_ALGORITHM],
      });
      return true;
    } catch (error) {
      console.error('Invalid JWT token:', error.message);
      return false;
    }
  }

  getMemberIdFromToken(token: string, secret: string): string {
    const claims = jwt.verify(token, this.getSigningKey(secret), {
      algorithms: [this.HASH_ALGORITHM],
    }) as jwt.JwtPayload;
    return claims.jti as string;
  }

  extractAllClaims(token: string, secret: string): jwt.JwtPayload {
    return jwt.verify(token, this.getSigningKey(secret), {
      algorithms: [this.HASH_ALGORITHM],
    }) as jwt.JwtPayload;
  }
}
