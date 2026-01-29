import type { BaseErrorResponseDto } from "@/infra/http/dtos/error-response.dto";
import { BadRequestException as BadRequestNest } from "@nestjs/common";

export class BadRequestException extends BadRequestNest {
  constructor(objectOrError: BaseErrorResponseDto) {
    super(objectOrError, { description: "Bad Request Error" });
  }
}
