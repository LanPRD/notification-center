import type { Optional } from "@/core/types/optional";

interface IdempotencyKeyProps {
  key: string;
  expiresAt: Date;
  createdAt?: Date | null;
  responseBody: Record<string, unknown> | null;
  responseStatus: number;
}

export class IdempotencyKey {
  key: string;
  expiresAt: Date;
  createdAt?: Date | null;
  responseBody: Record<string, unknown> | null;
  responseStatus: number;

  constructor(data: IdempotencyKeyProps) {
    this.key = data.key;
    this.expiresAt = data.expiresAt;
    this.createdAt = data.createdAt;
    this.responseBody = data.responseBody;
    this.responseStatus = data.responseStatus;
  }

  static create(
    props: Optional<IdempotencyKeyProps, "createdAt">
  ): IdempotencyKey {
    return new IdempotencyKey({ ...props, createdAt: new Date() });
  }
}
