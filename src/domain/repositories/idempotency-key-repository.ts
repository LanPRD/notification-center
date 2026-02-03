import type { IdempotencyKey } from "../entities/idempotency-key";

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
    data: { responseStatus: number; responseBody: any },
    tx?: unknown
  ): Promise<void>;
}
