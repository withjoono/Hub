import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppEntity } from 'src/database/entities/subscription/app.entity';
import { AppSubscriptionEntity } from 'src/database/entities/subscription/app-subscription.entity';
import { ProductPermissionMappingEntity } from 'src/database/entities/subscription/product-permission-mapping.entity';
import { AppPermissionDto, LicenseCheckResponseDto, PermissionsDto } from './dto/app-permission.dto';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/create-subscription.dto';
import { CreateProductMappingDto, UpdateProductMappingDto } from './dto/product-mapping.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(AppEntity)
    private readonly appRepository: Repository<AppEntity>,
    @InjectRepository(AppSubscriptionEntity)
    private readonly subscriptionRepository: Repository<AppSubscriptionEntity>,
    @InjectRepository(ProductPermissionMappingEntity)
    private readonly productMappingRepository: Repository<ProductPermissionMappingEntity>,
  ) {}

  // ==================== 앱 관리 ====================

  /**
   * 모든 앱 목록 조회
   */
  async getAllApps(): Promise<AppEntity[]> {
    return this.appRepository.find({
      where: { is_active: true },
      order: { sort_order: 'ASC' },
    });
  }

  /**
   * 앱 정보 조회
   */
  async getAppById(appId: string): Promise<AppEntity> {
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) {
      throw new NotFoundException(`앱을 찾을 수 없습니다: ${appId}`);
    }
    return app;
  }

  /**
   * 앱 생성 (관리자용)
   */
  async createApp(appData: Partial<AppEntity>): Promise<AppEntity> {
    const existing = await this.appRepository.findOne({ where: { id: appData.id } });
    if (existing) {
      throw new ConflictException(`이미 존재하는 앱 ID입니다: ${appData.id}`);
    }
    const app = this.appRepository.create(appData);
    return this.appRepository.save(app);
  }

  // ==================== 구독 관리 ====================

  /**
   * 사용자의 모든 구독 정보 조회
   */
  async getMemberSubscriptions(memberId: number): Promise<AppSubscriptionEntity[]> {
    return this.subscriptionRepository.find({
      where: { member_id: memberId },
      relations: ['app'],
    });
  }

  /**
   * 특정 앱에 대한 사용자 구독 정보 조회
   */
  async getMemberAppSubscription(memberId: number, appId: string): Promise<AppSubscriptionEntity | null> {
    return this.subscriptionRepository.findOne({
      where: { member_id: memberId, app_id: appId },
      relations: ['app'],
    });
  }

  /**
   * 구독 생성/갱신
   */
  async createOrUpdateSubscription(dto: CreateSubscriptionDto): Promise<AppSubscriptionEntity> {
    // 앱 존재 확인
    await this.getAppById(dto.appId);

    let subscription = await this.subscriptionRepository.findOne({
      where: { member_id: dto.memberId, app_id: dto.appId },
    });

    if (subscription) {
      // 기존 구독 업데이트
      subscription.plan = dto.plan;
      subscription.status = 'active';
      subscription.started_at = new Date();
      subscription.expires_at = dto.expiresAt ? new Date(dto.expiresAt) : null;
      subscription.payment_order_id = dto.paymentOrderId;
      subscription.features = dto.features;
      subscription.usage_limit = dto.usageLimit;
      subscription.usage_count = 0; // 갱신 시 리셋
      subscription.auto_renew = dto.autoRenew ?? false;
    } else {
      // 새 구독 생성
      subscription = this.subscriptionRepository.create({
        member_id: dto.memberId,
        app_id: dto.appId,
        plan: dto.plan,
        status: 'active',
        started_at: new Date(),
        expires_at: dto.expiresAt ? new Date(dto.expiresAt) : null,
        payment_order_id: dto.paymentOrderId,
        features: dto.features,
        usage_limit: dto.usageLimit,
        usage_count: 0,
        auto_renew: dto.autoRenew ?? false,
      });
    }

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * 구독 상태 업데이트
   */
  async updateSubscription(memberId: number, appId: string, dto: UpdateSubscriptionDto): Promise<AppSubscriptionEntity> {
    const subscription = await this.getMemberAppSubscription(memberId, appId);
    if (!subscription) {
      throw new NotFoundException(`구독 정보를 찾을 수 없습니다`);
    }

    if (dto.plan) subscription.plan = dto.plan;
    if (dto.status) subscription.status = dto.status;
    if (dto.expiresAt) subscription.expires_at = new Date(dto.expiresAt);
    if (dto.features) subscription.features = dto.features;
    if (dto.autoRenew !== undefined) subscription.auto_renew = dto.autoRenew;

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * 구독 취소
   */
  async cancelSubscription(memberId: number, appId: string): Promise<AppSubscriptionEntity> {
    return this.updateSubscription(memberId, appId, { status: 'cancelled' });
  }

  // ==================== JWT 권한 정보 ====================

  /**
   * JWT 토큰에 포함할 권한 정보 생성
   * 모든 앱에 대한 사용자의 구독 상태를 반환
   */
  async getMemberPermissions(memberId: number): Promise<PermissionsDto> {
    const subscriptions = await this.getMemberSubscriptions(memberId);
    const apps = await this.getAllApps();

    const permissions: PermissionsDto = {};

    // 모든 활성 앱에 대해 권한 정보 생성
    for (const app of apps) {
      const subscription = subscriptions.find(s => s.app_id === app.id);

      if (subscription && subscription.isValid()) {
        permissions[app.id] = {
          plan: subscription.plan,
          expires: subscription.expires_at?.toISOString(),
          features: subscription.features || app.features?.[subscription.plan] || [],
        };
      } else {
        // 구독이 없거나 만료된 경우 free 또는 none
        permissions[app.id] = {
          plan: app.features?.free ? 'free' : 'none',
          features: app.features?.free || [],
        };
      }
    }

    return permissions;
  }

  // ==================== 라이선스 확인 API (각 앱용) ====================

  /**
   * 특정 앱에 대한 라이선스 확인
   * 각 독립 앱에서 호출하여 사용자 권한 확인
   */
  async checkLicense(memberId: number, appId: string): Promise<LicenseCheckResponseDto> {
    const subscription = await this.getMemberAppSubscription(memberId, appId);
    const app = await this.getAppById(appId);

    if (!subscription || !subscription.isValid()) {
      // 무료 플랜 또는 접근 불가
      const hasFreeAccess = app.features?.free && app.features.free.length > 0;
      return {
        hasAccess: hasFreeAccess,
        plan: hasFreeAccess ? 'free' : 'none',
        features: app.features?.free || [],
      };
    }

    const response: LicenseCheckResponseDto = {
      hasAccess: true,
      plan: subscription.plan,
      features: subscription.features || app.features?.[subscription.plan] || [],
      expiresAt: subscription.expires_at?.toISOString(),
    };

    // 티켓제인 경우 남은 사용 횟수 포함
    if (subscription.usage_limit) {
      response.remainingUsage = subscription.usage_limit - subscription.usage_count;
    }

    return response;
  }

  /**
   * 사용 횟수 증가 (티켓제)
   */
  async incrementUsage(memberId: number, appId: string): Promise<boolean> {
    const subscription = await this.getMemberAppSubscription(memberId, appId);
    if (!subscription || !subscription.isValid()) {
      return false;
    }

    if (subscription.usage_limit && subscription.usage_count >= subscription.usage_limit) {
      return false;
    }

    subscription.usage_count += 1;
    await this.subscriptionRepository.save(subscription);
    return true;
  }

  // ==================== 만료 처리 ====================

  /**
   * 만료된 구독 상태 업데이트 (스케줄러에서 호출)
   */
  async processExpiredSubscriptions(): Promise<number> {
    const result = await this.subscriptionRepository
      .createQueryBuilder()
      .update(AppSubscriptionEntity)
      .set({ status: 'expired' })
      .where('status = :status', { status: 'active' })
      .andWhere('expires_at < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }

  // ==================== 상품-권한 매핑 관리 (관리자용) ====================

  /**
   * 모든 상품-권한 매핑 조회
   */
  async getAllProductMappings(appId?: string): Promise<ProductPermissionMappingEntity[]> {
    const query = this.productMappingRepository.createQueryBuilder('mapping');

    if (appId) {
      query.where('mapping.app_id = :appId', { appId });
    }

    return query.orderBy('mapping.created_at', 'DESC').getMany();
  }

  /**
   * 특정 상품-권한 매핑 조회
   */
  async getProductMappingById(id: number): Promise<ProductPermissionMappingEntity> {
    const mapping = await this.productMappingRepository.findOne({ where: { id } });
    if (!mapping) {
      throw new NotFoundException(`상품-권한 매핑을 찾을 수 없습니다: ID ${id}`);
    }
    return mapping;
  }

  /**
   * 외부 상품 ID로 매핑 조회 (Webhook에서 사용)
   */
  async getProductMappingByExternalId(
    appId: string,
    externalProductId: string,
  ): Promise<ProductPermissionMappingEntity | null> {
    return this.productMappingRepository.findOne({
      where: {
        app_id: appId,
        external_product_id: externalProductId,
        is_active: true,
      },
    });
  }

  /**
   * 상품-권한 매핑 생성
   */
  async createProductMapping(dto: CreateProductMappingDto): Promise<ProductPermissionMappingEntity> {
    // 앱 존재 확인
    await this.getAppById(dto.appId);

    // 중복 확인
    const existing = await this.productMappingRepository.findOne({
      where: {
        app_id: dto.appId,
        external_product_id: dto.externalProductId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `이미 존재하는 상품 매핑입니다: ${dto.appId}/${dto.externalProductId}`
      );
    }

    const mapping = this.productMappingRepository.create({
      app_id: dto.appId,
      external_product_id: dto.externalProductId,
      product_name: dto.productName,
      plan: dto.plan,
      features: dto.features,
      duration_days: dto.durationDays,
      usage_limit: dto.usageLimit,
      is_active: dto.isActive ?? true,
      memo: dto.memo,
    });

    return this.productMappingRepository.save(mapping);
  }

  /**
   * 상품-권한 매핑 수정
   */
  async updateProductMapping(
    id: number,
    dto: UpdateProductMappingDto,
  ): Promise<ProductPermissionMappingEntity> {
    const mapping = await this.getProductMappingById(id);

    if (dto.productName) mapping.product_name = dto.productName;
    if (dto.plan) mapping.plan = dto.plan;
    if (dto.features) mapping.features = dto.features;
    if (dto.durationDays !== undefined) mapping.duration_days = dto.durationDays;
    if (dto.usageLimit !== undefined) mapping.usage_limit = dto.usageLimit;
    if (dto.isActive !== undefined) mapping.is_active = dto.isActive;
    if (dto.memo !== undefined) mapping.memo = dto.memo;

    return this.productMappingRepository.save(mapping);
  }

  /**
   * 상품-권한 매핑 삭제
   */
  async deleteProductMapping(id: number): Promise<void> {
    const mapping = await this.getProductMappingById(id);
    await this.productMappingRepository.remove(mapping);
  }
}
