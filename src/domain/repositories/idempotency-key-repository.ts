import type { IdempotencyKey } from "../entities/idempotency-key";

export interface IdempotencyKeyRepository {
  findOne(idempotencyKey: string): Promise<IdempotencyKey | null>;
  create(idempotencyKey: IdempotencyKey, tx?: unknown): Promise<void>;
}
