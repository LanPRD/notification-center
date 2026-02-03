import type { IdempotencyKey } from "@/domain/entities/idempotency-key";
import type { IdempotencyKeyRepository } from "@/domain/repositories/idempotency-key-repository";

export class InMemoryIdempotencyKeyRepository implements IdempotencyKeyRepository {
  public idempotencyKeys: IdempotencyKey[] = [];

  async update(
    key: string,
    data: { responseStatus: number; responseBody: any },
    tx?: unknown
  ): Promise<void> {
    const existingKey = this.idempotencyKeys.find(ik => ik.key === key);

    if (existingKey) {
      const index = this.idempotencyKeys.indexOf(existingKey);

      this.idempotencyKeys[index] = existingKey;
      this.idempotencyKeys[index].responseStatus = data.responseStatus;
      this.idempotencyKeys[index].responseBody = data.responseBody;
    }
  }

  snapshot() {
    return [...this.idempotencyKeys];
  }

  restore(s: IdempotencyKey[]) {
    this.idempotencyKeys = [...s];
  }

  async findByKey(idempotencyKey: string): Promise<IdempotencyKey | null> {
    return this.idempotencyKeys.find(ik => ik.key === idempotencyKey) ?? null;
  }

  async create(
    idempotencyKey: IdempotencyKey,
    tx?: unknown
  ): Promise<IdempotencyKey> {
    this.idempotencyKeys.push(idempotencyKey);
    return idempotencyKey;
  }
}
