import { type Either, left, right } from "@/core/either";

export class InvalidTemplateNameError extends Error {
  constructor(templateName: string) {
    super(
      `Invalid template name: "${templateName}". Must be a valid slug (lowercase letters, numbers, and hyphens only).`
    );
    this.name = "InvalidTemplateNameError";
  }
}

/**
 * Defines the TemplateName entity.
 */
export class TemplateName {
  /**
   * The value of the TemplateName.
   */
  public value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Creates a new TemplateName from a lowercase template name.
   *
   * @param templateName The template name to create an instance of TemplateName from a string.
   * @returns Either an error or a new instance of TemplateName.
   */
  static create(
    templateName: string
  ): Either<InvalidTemplateNameError, TemplateName> {
    const normalized = templateName.split(" ").join("-").toLowerCase();

    if (!TemplateName.isValid(normalized)) {
      return left(new InvalidTemplateNameError(templateName));
    }

    return right(new TemplateName(normalized));
  }

  /**
   * Checks if the template name is a valid slug.
   *
   * @param templateName The template name to validate
   * @returns true if the template name is a valid slug, false otherwise.
   */
  static isValid(templateName: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(templateName);
  }

  /**
   * Checks if two TemplateNames are equal.
   *
   * @param other The TemplateName to compare with this TemplateName.
   * @returns true if the TemplateNames are equal, false otherwise.
   */
  equals(other: TemplateName): boolean {
    return this.value === other.value;
  }
}
