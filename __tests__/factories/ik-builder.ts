import { IdempotencyKey } from "@/domain/entities/idempotency-key";
import type { Notification } from "@/domain/entities/notification";
import { faker } from "@faker-js/faker";

export class IkFactory {
  static build(
    key: string,
    responseBody?: Notification,
    responseStatus?: number
  ): IdempotencyKey {
    return IdempotencyKey.create({
      expiresAt: faker.date.future(),
      createdAt: new Date(),
      key,
      responseBody,
      responseStatus
    });
  }
}
