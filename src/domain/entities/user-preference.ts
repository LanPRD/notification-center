import type { UniqueEntityID } from "@/core/entities/unique-entity-id";

export interface UserPreferenceProps {
  userId: UniqueEntityID;
  allowEmail: boolean;
  allowSMS: boolean;
  allowPush: boolean;
}

export class UserPreference {
  private props: UserPreferenceProps;

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get allowEmail(): boolean {
    return this.props.allowEmail;
  }

  set allowEmail(allowEmail: boolean) {
    this.props.allowEmail = allowEmail;
  }

  get allowSMS(): boolean {
    return this.props.allowSMS;
  }

  set allowSMS(allowSMS: boolean) {
    this.props.allowSMS = allowSMS;
  }

  get allowPush(): boolean {
    return this.props.allowPush;
  }

  set allowPush(allowPush: boolean) {
    this.props.allowPush = allowPush;
  }

  private constructor(props: UserPreferenceProps) {
    this.props = props;
  }

  static create(props: UserPreferenceProps): UserPreference {
    return new UserPreference(props);
  }
}
