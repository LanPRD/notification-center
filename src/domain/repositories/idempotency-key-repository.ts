import type { IdempotencyKey } from "../entities/idempotency-key";

export abstract class IdempotencyKeyRepository {
  abstract findByKey(idempotencyKey: string): Promise<IdempotencyKey | null>;
  abstract create(idempotencyKey: IdempotencyKey, tx?: unknown): Promise<void>;
}
