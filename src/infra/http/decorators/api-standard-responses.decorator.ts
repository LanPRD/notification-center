import { applyDecorators } from "@nestjs/common";

export function ApiStandardResponses() {
  return applyDecorators();
  // ApiBadRequestResponse({ type: ValidationErrorResponseDto }),
  // ApiInternalServerErrorResponse({ type: ErrorResponseDto })
}
