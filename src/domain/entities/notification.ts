import { Entity } from "@/core/entities/entity";
import type { UniqueEntityID } from "@/core/entities/unique-entity-id";
import type { Optional } from "@/core/types/optional";

interface NotificationProps {
  content: any;
  userId: UniqueEntityID;
  externalId: string;
  templateName: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "SENT" | "PARTIAL" | "FAILED" | "CANCELED";
  createdAt: Date;
}

export class Notification extends Entity<NotificationProps> {
  public get content(): Record<string, any> {
    return this.props.content;
  }

  public get externalId(): string {
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

  public get priority(): string {
    return this.props.priority;
  }

  public get status(): string {
    return this.props.status.toString();
  }

  static create(
    props: Optional<NotificationProps, "createdAt">,
    id?: UniqueEntityID
  ): Notification {
    return new Notification({ ...props, createdAt: new Date() }, id);
  }
}
