import type { BaseErrorResponseDto } from "@/infra/http/dtos/error-response.dto";
import { ConflictException as ConflictNest } from "@nestjs/common";

export class ConflictException extends ConflictNest {
  constructor(objectOrError: BaseErrorResponseDto) {
    super(objectOrError, { description: "Conflict Error" });
  }
}
