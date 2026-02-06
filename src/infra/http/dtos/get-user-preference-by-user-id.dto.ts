import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const getUserPreferenceByUserIdParamSchema = z.object({
  userId: z.uuid("Invalid user ID format")
});

export class GetUserPreferenceByUserIdParamDto extends createZodDto(
  getUserPreferenceByUserIdParamSchema
) {}

export const getUserPreferenceByUserIdResponseSchema = z.object({
  userId: z.uuid(),
  allowEmail: z.boolean(),
  allowSMS: z.boolean(),
  allowPush: z.boolean()
});

export class GetUserPreferenceByUserIdResponseDto extends createZodDto(
  getUserPreferenceByUserIdResponseSchema
) {}
