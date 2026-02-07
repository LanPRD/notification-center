import { type Either, left, right } from "@/core/either";

export class InvalidPhoneNumberError extends Error {
  constructor(phone: string) {
    super(
      `Invalid phone number: "${phone}". Must have DDI (e.g., +55) followed by at least 8 digits.`
    );
    this.name = "InvalidPhoneNumberError";
  }
}

/**
 * PhoneNumber class represents a phone number with validation and equality checks.
 */
export class PhoneNumber {
  /**
   * The phone number value.
   */
  public value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Creates a new instance of the PhoneNumber class with the given phone number.
   *
   * @param phone The phone number to be created.
   * @returns Either an error or a new instance of the PhoneNumber class.
   */
  static create(phone: string): Either<InvalidPhoneNumberError, PhoneNumber> {
    if (!PhoneNumber.isValid(phone)) {
      return left(new InvalidPhoneNumberError(phone));
    }

    return right(new PhoneNumber(phone));
  }

  /**
   * Checks if the given phone number is valid.
   * @param phone The phone number to be checked.
   * @returns true if the phone number is valid, false otherwise.
   */
  static isValid(phone: string): boolean {
    const phoneRegex = /^\+\d{1,3}\d{8,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Checks if the given phone numbers are equal.
   *
   * @param other The other phone number to compare with.
   * @returns true if the phone numbers are equal, false otherwise.
   */
  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }
}
