import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const baseErrorResponseSchema = z.object({
  message: z.string(),
  issues: z.record(z.any(), z.any()).optional()
});

export class BaseErrorResponseDto extends createZodDto(
  baseErrorResponseSchema
) {}
