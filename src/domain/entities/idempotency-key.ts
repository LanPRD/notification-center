import type { Optional } from "@/core/types/optional";

interface IdempotencyKeyProps {
  key: string;
  expiresAt: Date;
  createdAt: Date;
  responseBody: Record<string, unknown> | null;
  responseStatus: number;
}

export class IdempotencyKey {
  key: string;
  expiresAt: Date;

  constructor(data: IdempotencyKeyProps) {
    this.key = data.key;
    this.expiresAt = data.expiresAt;
  }

  static create(
    props: Optional<IdempotencyKeyProps, "createdAt">
  ): IdempotencyKey {
    return new IdempotencyKey({ ...props, createdAt: new Date() });
  }
}
