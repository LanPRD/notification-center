import type { IdempotencyKey } from "../entities/idempotency-key";
import type { Notification } from "../entities/notification";

export abstract class IdempotencyKeyRepository {
  abstract findByKey(
    idempotencyKey: string,
    tx?: unknown
  ): Promise<IdempotencyKey | null>;
  abstract create(
    idempotencyKey: IdempotencyKey,
    tx?: unknown
  ): Promise<IdempotencyKey>;
  abstract update(
    key: string,
    data: { responseStatus: number; responseBody: Notification },
    tx?: unknown
  ): Promise<void>;
}
