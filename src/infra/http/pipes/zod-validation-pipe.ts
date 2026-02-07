import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform
} from "@nestjs/common";
import { z } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodTypeAny) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException({
          message: "Validation failed",
          issues: z.treeifyError(error)
        });
      }

      console.log("Unexpected error during zod validation:", error);

      throw new BadRequestException("Validation failed");
    }
  }
}
