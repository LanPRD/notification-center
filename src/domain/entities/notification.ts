import { Entity } from "@/core/entities/entity";
import type { UniqueEntityID } from "@/core/entities/unique-entity-id";
import type { Optional } from "@/core/types/optional";
import type { NotificationPriority } from "../enums/notification-priority";
import type { NotificationStatus } from "../enums/notification-status";
import type { TemplateName } from "@/domain/value-objects/template-name";

interface NotificationProps {
  content: any;
  userId: UniqueEntityID;
  externalId: string | null;
  templateName: TemplateName;
  priority: NotificationPriority;
  status: NotificationStatus;
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

  get templateName(): TemplateName {
    return this.props.templateName;
  }

  get priority(): NotificationPriority {
    return this.props.priority;
  }

  get status(): NotificationStatus {
    return this.props.status;
  }

  set status(status: NotificationStatus) {
    this.props.status = status;
  }

  static create(
    props: Optional<NotificationProps, "createdAt">,
    id?: UniqueEntityID
  ): Notification {
    return new Notification({ createdAt: new Date(), ...props }, id);
  }
}
