import type { IdempotencyKey } from "@/domain/entities/idempotency-key";
import type { IdempotencyKeyRepository } from "@/domain/repositories/idempotency-key-repository";

export class InMemoryIdempotencyKeyRepository implements IdempotencyKeyRepository {
  public idempotencyKeys: IdempotencyKey[] = [];

  async findOne(idempotencyKey: string): Promise<IdempotencyKey | null> {
    return this.idempotencyKeys.find(ik => ik.key === idempotencyKey) ?? null;
  }
  async create(idempotencyKey: IdempotencyKey): Promise<void> {
    this.idempotencyKeys.push(idempotencyKey);
  }
}
