import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
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
    new FastifyAdapter(),
    { rawBody: true }
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
  const rabbitmqUrl = configService.get("RABBITMQ_URL");

  // HIGH PRIORITY - Processa imediatamente, pega mais mensagens por vez
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: configService.get("RABBITMQ_QUEUE_HIGH"),
      queueOptions: {
        durable: true
      },
      noAck: false,
      prefetchCount: 10
    }
  });

  // MEDIUM PRIORITY - Processa normalmente
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: configService.get("RABBITMQ_QUEUE_MEDIUM"),
      queueOptions: {
        durable: true
      },
      noAck: false,
      prefetchCount: 3
    }
  });

  // LOW PRIORITY - Processa quando houver capacidade
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: configService.get("RABBITMQ_QUEUE_LOW"),
      queueOptions: {
        durable: true
      },
      noAck: false,
      prefetchCount: 1
    }
  });

  await app.startAllMicroservices();
  await app.listen(port);
}

bootstrap();
