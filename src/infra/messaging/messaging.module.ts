import { OnNotificationCreated } from "@/application/events/on-notification-created";
import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { EnvModule } from "../env/env.module";
import { EnvService } from "../env/env.service";
import { EventsService } from "./publishers";
import { NotificationWorker } from "./workers";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: "RABBITMQ_HIGH_PRIORITY",
        imports: [EnvModule],
        inject: [EnvService],
        useFactory: (envService: EnvService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [envService.get("RABBITMQ_URL")],
            queue: envService.get("RABBITMQ_QUEUE_HIGH"),
            queueOptions: {
              durable: true
            }
          }
        })
      },
      {
        name: "RABBITMQ_MEDIUM_PRIORITY",
        imports: [EnvModule],
        inject: [EnvService],
        useFactory: (envService: EnvService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [envService.get("RABBITMQ_URL")],
            queue: envService.get("RABBITMQ_QUEUE_MEDIUM"),
            queueOptions: {
              durable: true
            }
          }
        })
      },
      {
        name: "RABBITMQ_LOW_PRIORITY",
        imports: [EnvModule],
        inject: [EnvService],
        useFactory: (envService: EnvService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [envService.get("RABBITMQ_URL")],
            queue: envService.get("RABBITMQ_QUEUE_LOW"),
            queueOptions: {
              durable: true
            }
          }
        })
      }
    ])
  ],
  controllers: [NotificationWorker],
  providers: [EventsService, OnNotificationCreated],
  exports: [EventsService]
})
export class MessagingModule {}
