import type { IdempotencyKey } from "@/domain/entities/idempotency-key";

export class IdempotencyKeyPresenter {
  static toHTTP(idempotencyKey: IdempotencyKey) {
    return {
      key: idempotencyKey.key,
      expiresAt: idempotencyKey.expiresAt.toISOString(),
      createdAt: idempotencyKey.createdAt?.toISOString(),
      responseBody: idempotencyKey.responseBody,
      responseStatus: idempotencyKey.responseStatus
    };
  }
}
