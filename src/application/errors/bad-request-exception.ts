import type { ValidationErrorResponseDto } from "@/infra/http/dtos/error-response.dto";
import { BadRequestException as BadRequestNest } from "@nestjs/common";

export class BadRequestException extends BadRequestNest {
  constructor(objectOrError: ValidationErrorResponseDto) {
    super(objectOrError);
  }
}
