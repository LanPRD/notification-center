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
  public get content(): Record<string, any> {
    return this.props.content;
  }

  public get externalId(): string | null {
    return this.props.externalId;
  }

  public get userId(): string {
    return this.props.userId.toString();
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get templateName(): string {
    return this.props.templateName;
  }

  public get priority(): "LOW" | "MEDIUM" | "HIGH" {
    return this.props.priority;
  }

  public get status(): "PENDING" | "SENT" | "PARTIAL" | "FAILED" | "CANCELED" {
    return this.props.status;
  }

  static create(
    props: Optional<NotificationProps, "createdAt">,
    id?: UniqueEntityID
  ): Notification {
    return new Notification({ ...props, createdAt: new Date() }, id);
  }
}
