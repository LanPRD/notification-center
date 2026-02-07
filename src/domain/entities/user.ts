import { Entity } from "@/core/entities/entity";
import type { UniqueEntityID } from "@/core/entities/unique-entity-id";
import type { PhoneNumber } from "@/domain/value-objects/phone-number";

export interface UserProps {
  email: string;
  phoneNumber?: PhoneNumber | null;
  pushToken?: string | null;
}

export class User extends Entity<UserProps> {
  get email(): string {
    return this.props.email;
  }

  get phoneNumber(): PhoneNumber | null {
    return this.props.phoneNumber ?? null;
  }

  set phoneNumber(phoneNumber: PhoneNumber | null) {
    this.props.phoneNumber = phoneNumber;
  }

  get pushToken(): string | null {
    return this.props.pushToken ?? null;
  }

  set pushToken(pushToken: string | null) {
    this.props.pushToken = pushToken;
  }

  static create(props: UserProps, id?: UniqueEntityID): User {
    return new User(props, id);
  }
}
