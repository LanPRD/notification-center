import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse
} from "@nestjs/swagger";
import {
  ErrorResponseDto,
  ValidationErrorResponseDto
} from "src/common/dtos/error-response.dto";

export function ApiStandardResponses() {
  return applyDecorators(
    ApiBadRequestResponse({ type: ValidationErrorResponseDto }),
    ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  );
}
