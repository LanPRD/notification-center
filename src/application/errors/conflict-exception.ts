export class ConflictException extends Error {
  constructor() {
    super("Resource already exists");
    this.name = "ConflictException";
  }
}
