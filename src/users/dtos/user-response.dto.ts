import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const userResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  phoneNumber: z.string().nullable().optional(),
  pushToken: z.string().nullable().optional()
});

export class UserResponseDto extends createZodDto(userResponseSchema) {}
