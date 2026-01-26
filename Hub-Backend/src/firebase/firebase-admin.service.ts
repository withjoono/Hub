import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { App } from 'firebase-admin/app';
import { Auth, DecodedIdToken } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: App;
  private auth: Auth;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // 이미 초기화된 앱이 있는지 확인
      if (admin.apps.length > 0) {
        this.app = admin.apps[0]!;
        this.auth = admin.auth(this.app);
        this.logger.log('Firebase Admin SDK already initialized');
        return;
      }

      // 서비스 계정 JSON 파일 경로 또는 환경변수에서 가져오기
      const serviceAccountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
      const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');

      if (serviceAccountPath) {
        // 파일 경로로 초기화
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const serviceAccount = require(serviceAccountPath);
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else if (serviceAccountJson) {
        // JSON 문자열로 초기화
        const serviceAccount = JSON.parse(serviceAccountJson);
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        // 기본 credentials 사용 (Google Cloud 환경)
        this.app = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }

      this.auth = admin.auth(this.app);
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
      throw error;
    }
  }

  /**
   * Firebase ID 토큰 검증
   */
  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    try {
      return await this.auth.verifyIdToken(idToken);
    } catch (error) {
      this.logger.error('Failed to verify Firebase ID token', error);
      throw error;
    }
  }

  /**
   * Firebase 사용자 생성
   */
  async createUser(properties: admin.auth.CreateRequest) {
    try {
      return await this.auth.createUser(properties);
    } catch (error) {
      this.logger.error('Failed to create Firebase user', error);
      throw error;
    }
  }

  /**
   * Firebase 사용자 조회 (UID)
   */
  async getUserByUid(uid: string) {
    try {
      return await this.auth.getUser(uid);
    } catch (error) {
      this.logger.error(`Failed to get user by UID: ${uid}`, error);
      throw error;
    }
  }

  /**
   * Firebase 사용자 조회 (이메일)
   */
  async getUserByEmail(email: string) {
    try {
      return await this.auth.getUserByEmail(email);
    } catch (error) {
      if ((error as { code?: string }).code === 'auth/user-not-found') {
        return null;
      }
      this.logger.error(`Failed to get user by email: ${email}`, error);
      throw error;
    }
  }

  /**
   * Firebase 사용자 업데이트
   */
  async updateUser(uid: string, properties: admin.auth.UpdateRequest) {
    try {
      return await this.auth.updateUser(uid, properties);
    } catch (error) {
      this.logger.error(`Failed to update user: ${uid}`, error);
      throw error;
    }
  }

  /**
   * Firebase 사용자 삭제
   */
  async deleteUser(uid: string) {
    try {
      await this.auth.deleteUser(uid);
      this.logger.log(`Deleted Firebase user: ${uid}`);
    } catch (error) {
      this.logger.error(`Failed to delete user: ${uid}`, error);
      throw error;
    }
  }

  /**
   * 커스텀 토큰 생성 (서버에서 인증용)
   */
  async createCustomToken(uid: string, claims?: object) {
    try {
      return await this.auth.createCustomToken(uid, claims);
    } catch (error) {
      this.logger.error(`Failed to create custom token for: ${uid}`, error);
      throw error;
    }
  }

  /**
   * 커스텀 클레임 설정
   */
  async setCustomUserClaims(uid: string, claims: object) {
    try {
      await this.auth.setCustomUserClaims(uid, claims);
      this.logger.log(`Set custom claims for user: ${uid}`);
    } catch (error) {
      this.logger.error(`Failed to set custom claims for: ${uid}`, error);
      throw error;
    }
  }

  /**
   * 이메일로 비밀번호 재설정 링크 생성
   */
  async generatePasswordResetLink(email: string) {
    try {
      return await this.auth.generatePasswordResetLink(email);
    } catch (error) {
      this.logger.error(`Failed to generate password reset link for: ${email}`, error);
      throw error;
    }
  }

  /**
   * 이메일 인증 링크 생성
   */
  async generateEmailVerificationLink(email: string) {
    try {
      return await this.auth.generateEmailVerificationLink(email);
    } catch (error) {
      this.logger.error(`Failed to generate email verification link for: ${email}`, error);
      throw error;
    }
  }
}
