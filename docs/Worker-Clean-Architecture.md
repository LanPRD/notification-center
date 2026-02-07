# Worker e Clean Architecture - Como Acessar o Banco de Dados

## 🤔 A Dúvida

> "O notification.worker.ts deverá atualizar coisas no DB, então ele terá que
> chamar coisas de infra. Isso pode? Ou eu crio algo na camada de domain e
> depois injeto no notification.worker?"

## ✅ Resposta Curta

**SIM, pode!** O Worker está na camada de **Infrastructure**, então ele **PODE**
chamar:

- ✅ Repositories (Domain/Infra)
- ✅ Use Cases (Application)
- ✅ Services da infra
- ❌ **NÃO** deve acessar Prisma/TypeORM diretamente

## 📐 Entendendo as Camadas

```
┌─────────────────────────────────────────────────────┐
│ PRESENTATION (Infra)                                │
│ - Controllers HTTP                                  │
│ - Workers (RabbitMQ)        ← NotificationWorker   │
│ - GraphQL Resolvers                                 │
└─────────────────┬───────────────────────────────────┘
                  │ chama
                  ▼
┌─────────────────────────────────────────────────────┐
│ APPLICATION                                         │
│ - Use Cases                 ← Recomendado!         │
│ - DTOs                                              │
└─────────────────┬───────────────────────────────────┘
                  │ chama
                  ▼
┌─────────────────────────────────────────────────────┐
│ DOMAIN                                              │
│ - Entities                                          │
│ - Repository Interfaces     ← Contratos            │
│ - Value Objects                                     │
└─────────────────┬───────────────────────────────────┘
                  │ implementado por
                  ▼
┌─────────────────────────────────────────────────────┐
│ INFRASTRUCTURE                                      │
│ - Repository Implementations ← Prisma aqui         │
│ - Database                                          │
│ - External Services                                 │
└─────────────────────────────────────────────────────┘
```

## 🎯 Abordagens Recomendadas

### ✅ Opção 1: Worker → Use Case (MAIS RECOMENDADO)

**Quando usar:** Quando a lógica é complexa ou pode ser reutilizada

```typescript
// src/application/use-cases/notifications/process-notification.ts
import { Injectable } from "@nestjs/common";
import { NotificationRepository } from "@/domain/repositories/notification-repository";

interface ProcessNotificationInput {
  notificationId: string;
}

@Injectable()
export class ProcessNotificationUseCase {
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly emailService: EmailService,
    private readonly smsService: SMSService
  ) {}

  async execute(input: ProcessNotificationInput): Promise<void> {
    // 1. Buscar notificação
    const notification = await this.notificationRepo.findById(
      input.notificationId
    );

    if (!notification) {
      throw new Error("Notification not found");
    }

    // 2. Validar status
    if (notification.status !== "PENDING") {
      console.log(`Notification ${notification.id} already processed`);
      return;
    }

    // 3. Processar baseado no canal
    try {
      if (notification.channel === "EMAIL") {
        await this.emailService.send({
          to: notification.recipientEmail,
          subject: notification.subject,
          body: notification.content
        });
      } else if (notification.channel === "SMS") {
        await this.smsService.send({
          to: notification.recipientPhone,
          message: notification.content
        });
      }

      // 4. Atualizar status para SENT
      notification.markAsSent();
      await this.notificationRepo.save(notification);
    } catch (error) {
      // 5. Se falhar, marcar como FAILED
      notification.markAsFailed(error.message);
      await this.notificationRepo.save(notification);
      throw error;
    }
  }
}
```

**Worker usando o Use Case:**

```typescript
// src/infra/messaging/workers/notification.worker.ts
import { Controller, Logger } from "@nestjs/common";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext
} from "@nestjs/microservices";
import { ProcessNotificationUseCase } from "@/application/use-cases/notifications/process-notification";
import { MESSAGE_PATTERNS } from "../constants";

@Controller()
export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(
    private readonly processNotificationUseCase: ProcessNotificationUseCase
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION_PENDING)
  async handleNotificationPending(
    @Payload() data: { notificationId: string },
    @Ctx() context: RmqContext
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(`Processing notification: ${data.notificationId}`);

      // Chama o Use Case - toda lógica está lá!
      await this.processNotificationUseCase.execute({
        notificationId: data.notificationId
      });

      channel.ack(originalMsg);
      this.logger.log(`Notification ${data.notificationId} processed`);
    } catch (error) {
      this.logger.error(`Error processing notification`, error);

      // Verifica se deve tentar novamente
      const shouldRetry = this.isRetryableError(error);
      channel.nack(originalMsg, false, shouldRetry);
    }
  }

  private isRetryableError(error: any): boolean {
    // Erros temporários = tentar novamente
    return error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT";
  }
}
```

**Configurar no Module:**

```typescript
// src/infra/messaging/messaging.module.ts
import { Module } from "@nestjs/common";
import { ProcessNotificationUseCase } from "@/application/use-cases/notifications/process-notification";
import { DatabaseModule } from "../database/database.module";
import { NotificationWorker } from "./workers";

@Module({
  imports: [
    // ... ClientsModule config
    DatabaseModule // ← Importa para ter acesso aos repositories
  ],
  controllers: [NotificationWorker],
  providers: [
    ProcessNotificationUseCase, // ← Adiciona o Use Case
    EventsService
  ],
  exports: [EventsService]
})
export class MessagingModule {}
```

**Vantagens:**

- ✅ Lógica reutilizável (pode chamar de outro lugar)
- ✅ Testável isoladamente
- ✅ Separação de responsabilidades clara
- ✅ Worker fica simples e focado em RabbitMQ

---

### ✅ Opção 2: Worker → Repository Direto (ACEITÁVEL)

**Quando usar:** Quando a lógica é muito simples e específica do worker

```typescript
// src/infra/messaging/workers/notification.worker.ts
import { Controller, Logger } from "@nestjs/common";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext
} from "@nestjs/microservices";
import { NotificationRepository } from "@/domain/repositories/notification-repository";
import { MESSAGE_PATTERNS } from "../constants";

@Controller()
export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(private readonly notificationRepo: NotificationRepository) {}

  @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION_SENT)
  async handleNotificationSent(
    @Payload() data: { notificationId: string },
    @Ctx() context: RmqContext
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      // Busca notificação
      const notification = await this.notificationRepo.findById(
        data.notificationId
      );

      if (!notification) {
        this.logger.warn(`Notification ${data.notificationId} not found`);
        channel.ack(originalMsg); // ACK mesmo assim (não existe mais)
        return;
      }

      // Lógica simples: só atualizar timestamp
      notification.markAsDelivered();
      await this.notificationRepo.save(notification);

      channel.ack(originalMsg);
      this.logger.log(
        `Notification ${data.notificationId} marked as delivered`
      );
    } catch (error) {
      this.logger.error(`Error updating notification`, error);
      channel.nack(originalMsg, false, true);
    }
  }
}
```

**Vantagens:**

- ✅ Simples e direto
- ✅ Menos overhead

**Desvantagens:**

- ❌ Lógica não reutilizável
- ❌ Dificulta testes

---

### ❌ Opção 3: Worker → Prisma Direto (NÃO RECOMENDADO)

```typescript
// ❌ NÃO FAÇA ISSO!
import { PrismaService } from "@/infra/database/prisma/prisma.service";

@Controller()
export class NotificationWorker {
  constructor(private readonly prisma: PrismaService) {}

  @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION_PENDING)
  async handleNotificationPending(data, context) {
    // ❌ Acesso direto ao Prisma
    await this.prisma.notification.update({
      where: { id: data.notificationId },
      data: { status: "SENT" }
    });
  }
}
```

**Por que não:**

- ❌ Quebra Clean Architecture
- ❌ Perde regras de negócio da Entity
- ❌ Dificulta mudança de ORM
- ❌ Sem validações

---

## 🏗️ Exemplo Completo - Abordagem Recomendada

### 1. Use Case

```typescript
// src/application/use-cases/notifications/send-notification.ts
import { Injectable } from "@nestjs/common";
import { NotificationRepository } from "@/domain/repositories/notification-repository";
import { EmailService } from "@/infra/services/email.service";

interface SendNotificationInput {
  notificationId: string;
}

interface SendNotificationOutput {
  success: boolean;
  sentAt: Date;
}

@Injectable()
export class SendNotificationUseCase {
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly emailService: EmailService
  ) {}

  async execute(input: SendNotificationInput): Promise<SendNotificationOutput> {
    const notification = await this.notificationRepo.findById(
      input.notificationId
    );

    if (!notification) {
      throw new Error(`Notification ${input.notificationId} not found`);
    }

    if (notification.status !== "PENDING") {
      throw new Error(`Notification ${input.notificationId} is not pending`);
    }

    // Enviar email
    await this.emailService.send({
      to: notification.recipientEmail,
      subject: notification.subject,
      body: notification.content
    });

    // Marcar como enviada
    notification.markAsSent();
    await this.notificationRepo.save(notification);

    return {
      success: true,
      sentAt: new Date()
    };
  }
}
```

### 2. Worker

```typescript
// src/infra/messaging/workers/notification.worker.ts
import { Controller, Logger } from "@nestjs/common";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext
} from "@nestjs/microservices";
import { SendNotificationUseCase } from "@/application/use-cases/notifications/send-notification";
import { MESSAGE_PATTERNS } from "../constants";

@Controller()
export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION_PENDING)
  async handleNotificationPending(
    @Payload() data: { notificationId: string },
    @Ctx() context: RmqContext
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(`Processing notification: ${data.notificationId}`);

      const result = await this.sendNotificationUseCase.execute({
        notificationId: data.notificationId
      });

      channel.ack(originalMsg);
      this.logger.log(`Notification sent at ${result.sentAt}`);
    } catch (error) {
      this.logger.error(`Failed to send notification`, error);

      if (
        error.message.includes("not found") ||
        error.message.includes("not pending")
      ) {
        // Erro permanente - não tentar novamente
        channel.ack(originalMsg);
      } else {
        // Erro temporário - tentar novamente
        channel.nack(originalMsg, false, true);
      }
    }
  }
}
```

### 3. Module

```typescript
// src/infra/messaging/messaging.module.ts
import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { EnvModule } from "../env/env.module";
import { EnvService } from "../env/env.service";
import { DatabaseModule } from "../database/database.module";
import { SendNotificationUseCase } from "@/application/use-cases/notifications/send-notification";
import { EventsService } from "./publishers";
import { NotificationWorker } from "./workers";

@Module({
  imports: [
    DatabaseModule, // ← Fornece repositories
    ClientsModule.registerAsync([
      // ... configurações
    ])
  ],
  controllers: [NotificationWorker],
  providers: [
    EventsService,
    SendNotificationUseCase // ← Use Case disponível
  ],
  exports: [EventsService]
})
export class MessagingModule {}
```

---

## 📊 Comparação das Abordagens

| Aspecto                | Worker → Use Case     | Worker → Repository | Worker → Prisma |
| ---------------------- | --------------------- | ------------------- | --------------- |
| **Clean Architecture** | ✅ Perfeito           | ✅ Aceitável        | ❌ Quebra       |
| **Reusabilidade**      | ✅ Alta               | ⚠️ Baixa            | ❌ Nenhuma      |
| **Testabilidade**      | ✅ Fácil              | ⚠️ Moderada         | ❌ Difícil      |
| **Complexidade**       | ⚠️ Mais código        | ✅ Simples          | ✅ Simples      |
| **Regras de negócio**  | ✅ Na Entity/Use Case | ⚠️ Na Entity        | ❌ Espalhadas   |
| **Manutenção**         | ✅ Fácil              | ⚠️ Moderada         | ❌ Difícil      |

---

## 🎯 Recomendação Final

**Use Worker → Use Case** para lógica de processamento de notificações:

```typescript
@Controller()
export class NotificationWorker {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly markAsDeliveredUseCase: MarkAsDeliveredUseCase,
    private readonly handleFailedNotificationUseCase: HandleFailedNotificationUseCase
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION_PENDING)
  async handlePending(data, context) {
    await this.sendNotificationUseCase.execute({ notificationId: data.id });
  }

  @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION_SENT)
  async handleSent(data, context) {
    await this.markAsDeliveredUseCase.execute({ notificationId: data.id });
  }

  @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION_FAILED)
  async handleFailed(data, context) {
    await this.handleFailedNotificationUseCase.execute({
      notificationId: data.id,
      error: data.error
    });
  }
}
```

**Benefícios:**

- ✅ Worker focado apenas em RabbitMQ (ACK/NACK)
- ✅ Use Cases testáveis isoladamente
- ✅ Lógica reutilizável em outros lugares
- ✅ Clean Architecture respeitada
- ✅ Fácil de entender e manter

---
