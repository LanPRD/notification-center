import { Entity } from "@/core/entities/entity";
import type { UniqueEntityID } from "@/core/entities/unique-entity-id";

interface UserPreferenceProps {
  userId: UniqueEntityID;
  allowEmail: boolean;
  allowSMS: boolean;
  allowPush: boolean;
}

export class UserPreference extends Entity<UserPreferenceProps> {
  public get userId(): UniqueEntityID {
    return this.props.userId;
  }

  public get allowEmail(): boolean {
    return this.props.allowEmail;
  }

  public set allowEmail(allowEmail: boolean) {
    this.props.allowEmail = allowEmail;
  }

  public get allowSMS(): boolean {
    return this.props.allowSMS;
  }

  public set allowSMS(allowSMS: boolean) {
    this.props.allowSMS = allowSMS;
  }

  public get allowPush(): boolean {
    return this.props.allowPush;
  }

  public set allowPush(allowPush: boolean) {
    this.props.allowPush = allowPush;
  }
}
