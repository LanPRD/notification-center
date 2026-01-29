import type { BaseErrorResponseDto } from "@/infra/http/dtos/error-response.dto";
import { NotFoundException as NotFoundNest } from "@nestjs/common";

export class NotFoundException extends NotFoundNest {
  constructor(objectOrError: BaseErrorResponseDto) {
    super(objectOrError, { description: "Not Found Error" });
  }
}
