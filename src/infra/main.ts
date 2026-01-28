import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { EnvService } from "./env/env.service";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("Notification center API")
    .setDescription("API for managing notifications")
    .setVersion("1.0")
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("api", app, documentFactory);

  const configService = app.get(EnvService);
  const port = configService.get("PORT");

  await app.listen(port);
}

bootstrap();
