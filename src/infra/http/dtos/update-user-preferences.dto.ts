import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const updateUserPrefsParamSchema = z.object({
  userId: z.uuid("Invalid user ID format")
});

export class UpdateUserPrefsParamDto extends createZodDto(
  updateUserPrefsParamSchema
) {}

export const updateUserPrefsBodySchema = z.object({
  allowEmail: z.boolean(),
  allowSMS: z.boolean(),
  allowPush: z.boolean()
});

export class UpdateUserPrefsBodyDto extends createZodDto(
  updateUserPrefsBodySchema
) {}
