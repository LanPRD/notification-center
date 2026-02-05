import { Entity } from "@/core/entities/entity";
import type { UniqueEntityID } from "@/core/entities/unique-entity-id";
import type { Optional } from "@/core/types/optional";
import type { NotificationLogStatus } from "../enums/notification-log-status";

interface NotificationLogProps {
  notificationId: UniqueEntityID;
  channel: string;
  status: NotificationLogStatus;
  errorMessage: string;
  sentAt: Date;
}

export class NotificationLog extends Entity<NotificationLogProps> {
  get notificationId(): UniqueEntityID {
    return this.props.notificationId;
  }

  get channel(): string {
    return this.props.channel;
  }

  get status(): NotificationLogStatus {
    return this.props.status;
  }

  get errorMessage(): string {
    return this.props.errorMessage;
  }

  get sentAt(): Date {
    return this.props.sentAt;
  }

  static create(
    props: Optional<NotificationLogProps, "sentAt">,
    id?: UniqueEntityID
  ): NotificationLog {
    return new NotificationLog({ ...props, sentAt: new Date() }, id);
  }
}
