import type { BaseErrorResponseDto } from "@/infra/http/dtos/error-response.dto";
import { InternalServerErrorException as InternalNest } from "@nestjs/common";

export class InternalException extends InternalNest {
  constructor(objectOrError: BaseErrorResponseDto) {
    super(objectOrError, { description: "Internal Server Error" });
  }
}
