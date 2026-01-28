import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const errorResponseSchema = z.object({
  message: z.string(),
  statusCode: z.number()
});

export class ErrorResponseDto extends createZodDto(errorResponseSchema) {}

export const validationErrorResponseSchema = z.object({
  message: z.string(),
  issues: z.record(z.any(), z.any()).optional()
});

export class ValidationErrorResponseDto extends createZodDto(
  validationErrorResponseSchema
) {}
