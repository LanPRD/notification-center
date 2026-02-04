import { Entity } from "@/core/entities/entity";
import type { UniqueEntityID } from "@/core/entities/unique-entity-id";
import type { Optional } from "@/core/types/optional";

interface NotificationProps {
  content: any;
  userId: UniqueEntityID;
  externalId: string | null;
  templateName: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "SENT" | "PARTIAL" | "FAILED" | "CANCELED";
  createdAt: Date;
}

export class Notification extends Entity<NotificationProps> {
  get content(): Record<string, any> {
    return this.props.content;
  }

  get externalId(): string | null {
    return this.props.externalId;
  }

  get userId(): string {
    return this.props.userId.toString();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get templateName(): string {
    return this.props.templateName;
  }

  get priority(): "LOW" | "MEDIUM" | "HIGH" {
    return this.props.priority;
  }

  get status(): "PENDING" | "SENT" | "PARTIAL" | "FAILED" | "CANCELED" {
    return this.props.status;
  }

  set status(status: "PENDING" | "SENT" | "PARTIAL" | "FAILED" | "CANCELED") {
    this.props.status = status;
  }

  static create(
    props: Optional<NotificationProps, "createdAt">,
    id?: UniqueEntityID
  ): Notification {
    return new Notification({ ...props, createdAt: new Date() }, id);
  }
}
