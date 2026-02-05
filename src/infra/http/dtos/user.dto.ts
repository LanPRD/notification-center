import { createZodDto } from "nestjs-zod";
import { z } from "zod";

// Request
export const createUserBodySchema = z.object({
  email: z.email(),
  phoneNumber: z.string().optional(),
  pushToken: z.string().optional()
});

export class CreateUserBodyDto extends createZodDto(createUserBodySchema) {}

// Response
export const userResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  phoneNumber: z.string().nullable(),
  pushToken: z.string().nullable(),
  allowEmail: z.boolean(),
  allowSMS: z.boolean(),
  allowPush: z.boolean()
});

export class UserResponseDto extends createZodDto(userResponseSchema) {}
