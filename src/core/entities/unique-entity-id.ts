import { randomUUID } from "crypto";

export class UniqueEntityID {
  private _value: string;

  constructor(value?: string) {
    this._value = value ?? randomUUID();
  }

  toString(): string {
    return this._value;
  }
}
