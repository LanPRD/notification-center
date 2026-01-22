import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email(),
  phoneNumber: z.string().optional(),
  pushToken: z.string().optional()
});

export class CreateUserDto extends createZodDto(createUserSchema) {}
