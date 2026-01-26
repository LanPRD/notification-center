import { Entity } from "@/core/entities/entity";
import type { UniqueEntityID } from "@/core/entities/unique-entity-id";

interface UserProps {
  email: string;
  phoneNumber?: string;
  pushToken?: string;
}

export class User extends Entity<UserProps> {
  public get email(): string {
    return this.props.email;
  }

  public get phoneNumber(): string | undefined {
    return this.props.phoneNumber;
  }

  public set phoneNumber(phoneNumber: string | undefined) {
    this.props.phoneNumber = phoneNumber;
  }

  public get pushToken(): string | undefined {
    return this.props.pushToken;
  }

  public set pushToken(pushToken: string | undefined) {
    this.props.pushToken = pushToken;
  }

  static create(props: UserProps, id?: UniqueEntityID): User {
    return new User(props, id);
  }
}
