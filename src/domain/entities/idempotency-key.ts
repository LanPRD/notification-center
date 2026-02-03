import type { Optional } from "@/core/types/optional";

interface IdempotencyKeyProps {
  key: string;
  expiresAt: Date;
  createdAt: Date | null;
  responseBody: any;
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

  get responseBody(): any {
    return this.props.responseBody;
  }

  set responseBody(value: any) {
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
      ...props,
      createdAt: new Date(),
      responseBody: null,
      responseStatus: null
    });
  }
}
