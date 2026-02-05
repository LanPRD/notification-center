import type { Optional } from "@/core/types/optional";
import type { Notification } from "./notification";

interface IdempotencyKeyProps {
  key: string;
  expiresAt: Date;
  createdAt: Date | null;
  responseBody: Notification | null;
  responseStatus: number | null;
}

export class IdempotencyKey {
  private props: IdempotencyKeyProps;

  get key(): string {
    return this.props.key;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  set expiresAt(value: Date) {
    this.props.expiresAt = value;
  }

  get createdAt(): Date | null {
    return this.props.createdAt;
  }

  set createdAt(value: Date | null) {
    this.props.createdAt = value;
  }

  get responseBody(): Notification | null {
    return this.props.responseBody;
  }

  set responseBody(value: Notification | null) {
    this.props.responseBody = value;
  }

  get responseStatus(): number | null {
    return this.props.responseStatus;
  }

  set responseStatus(value: number | null) {
    this.props.responseStatus = value;
  }

  private constructor(data: IdempotencyKeyProps) {
    this.props = data;
  }

  static create(
    props: Optional<
      IdempotencyKeyProps,
      "createdAt" | "responseBody" | "responseStatus"
    >
  ): IdempotencyKey {
    return new IdempotencyKey({
      responseBody: null,
      responseStatus: null,
      ...props,
      createdAt: new Date()
    });
  }
}
