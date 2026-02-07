# Tutorial RabbitMQ - Sistema de Notificações

Este documento é um guia completo para entender o RabbitMQ e como ele foi
implementado neste projeto de notificações.

---

## 📚 Índice

1. [O que é RabbitMQ?](#1-o-que-é-rabbitmq)
2. [Conceitos Fundamentais](#2-conceitos-fundamentais)
3. [Por que usar RabbitMQ?](#3-por-que-usar-rabbitmq)
4. [Como funciona no nosso projeto](#4-como-funciona-no-nosso-projeto)
5. [Estrutura de Filas de Prioridade](#5-estrutura-de-filas-de-prioridade)
6. [Arquitetura da Implementação](#6-arquitetura-da-implementação)
7. [Como Publicar Mensagens (Publisher)](#7-como-publicar-mensagens-publisher)
8. [Como Consumir Mensagens (Worker)](#8-como-consumir-mensagens-worker)
9. [Configuração e Variáveis de Ambiente](#9-configuração-e-variáveis-de-ambiente)
10. [Fluxo Completo de uma Mensagem](#10-fluxo-completo-de-uma-mensagem)
11. [Conceitos Avançados Utilizados](#11-conceitos-avançados-utilizados)
12. [Boas Práticas e Dicas](#12-boas-práticas-e-dicas)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. O que é RabbitMQ?

**RabbitMQ** é um **message broker** (intermediário de mensagens). Pense nele
como um **correio** para aplicações:

- Você escreve uma "carta" (mensagem)
- O RabbitMQ recebe e guarda essa carta
- Quando alguém estiver pronto para processar, o RabbitMQ entrega

### Analogia do Mundo Real

Imagine uma pizzaria:

```
Cliente faz pedido → Anotador coloca na fila → Pizzaiolo pega pedido da fila → Prepara pizza
     (Producer)           (RabbitMQ)              (Consumer/Worker)
```

**Vantagens:**

- O anotador não precisa esperar a pizza ficar pronta para anotar outro pedido
- O pizzaiolo trabalha no seu próprio ritmo
- Se houver muitos pedidos, você pode contratar mais pizzaiolos (escalar
  workers)

---

## 2. Conceitos Fundamentais

### 2.1 Producer (Produtor)

É quem **envia** mensagens para o RabbitMQ.

**No nosso projeto:** O `EventsService` é o producer. Quando criamos uma
notificação, enviamos uma mensagem para o RabbitMQ.

### 2.2 Queue (Fila)

É onde as mensagens ficam **armazenadas** esperando para serem processadas.

**No nosso projeto:** Temos 3 filas:

- `notifications.high` - Notificações urgentes
- `notifications.medium` - Notificações normais
- `notifications.low` - Notificações que podem esperar

### 2.3 Consumer/Worker (Consumidor/Trabalhador)

É quem **recebe e processa** as mensagens da fila.

**No nosso projeto:** O `NotificationWorker` é o consumer. Ele pega mensagens
das filas e processa (envia email, SMS, push notification, etc.).

### 2.4 Message (Mensagem)

É o **dado** que trafega entre producer e consumer.

**No nosso projeto:** Uma mensagem contém:

```typescript
{
  pattern: "notification.created",  // Tipo da mensagem
  data: {                           // Dados da notificação
    userId: "123",
    message: "Seu pedido foi aprovado!"
  }
}
```

### 2.5 Exchange (Não usado diretamente no projeto)

É um roteador que decide para qual fila a mensagem vai. No NestJS com RabbitMQ,
isso é abstraído e gerenciado automaticamente.

---

## 3. Por que usar RabbitMQ?

### 3.1 Processamento Assíncrono

**Sem RabbitMQ:**

```typescript
async createNotification() {
  // Salva notificação no banco (100ms)
  await database.save(notification);

  // Envia email (2000ms) ⏰ USUÁRIO ESPERANDO...
  await sendEmail(notification);

  // Envia SMS (1500ms) ⏰ USUÁRIO AINDA ESPERANDO...
  await sendSMS(notification);

  // Total: 3600ms (3.6 segundos!)
  return response;
}
```

**Com RabbitMQ:**

```typescript
async createNotification() {
  // Salva notificação no banco (100ms)
  await database.save(notification);

  // Envia mensagem para fila (10ms) ✅ RÁPIDO!
  await eventsService.emit('notification.created', notification);

  // Total: 110ms (0.11 segundos!)
  return response;

  // Email e SMS serão enviados em background pelo Worker
}
```

### 3.2 Desacoplamento

O código que cria a notificação **não precisa saber** como ela será enviada
(email, SMS, push). Cada parte faz seu trabalho independentemente.

### 3.3 Escalabilidade

Se houver muitas notificações, você pode:

- Subir mais instâncias do Worker
- Cada worker pega mensagens da fila e processa
- RabbitMQ distribui automaticamente entre os workers

### 3.4 Resiliência

Se o Worker falhar ao processar uma mensagem:

- A mensagem volta para a fila (NACK)
- Outro worker (ou o mesmo quando recuperar) tenta novamente
- Garantia de que nenhuma mensagem será perdida

---

## 4. Como funciona no nosso projeto

### 4.1 Visão Geral

```
┌──────────────────┐
│  HTTP Controller │  (Recebe requisição do usuário)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Use Case       │  (Lógica de negócio - cria notificação)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  EventsService   │  (Publisher - envia mensagem para RabbitMQ)
└────────┬─────────┘
         │
         ▼
   ┌─────────────┐
   │  RabbitMQ   │
   │             │
   │ Queue:HIGH  │  ← Notificações urgentes
   │ Queue:MED   │  ← Notificações normais
   │ Queue:LOW   │  ← Notificações não urgentes
   └──────┬──────┘
          │
          ▼
┌────────────────────┐
│ NotificationWorker │  (Consumer - processa mensagens)
└────────────────────┘
          │
          ▼
    ┌─────────┐
    │ Enviar  │  (Email, SMS, Push, etc.)
    └─────────┘
```

### 4.2 Fluxo Passo a Passo

**Passo 1:** Usuário faz requisição POST para criar notificação

**Passo 2:** Controller chama o Use Case

**Passo 3:** Use Case salva notificação no banco de dados

**Passo 4:** Use Case usa `EventsService` para publicar mensagem:

```typescript
await eventsService.emitHigh("notification.created", {
  notificationId: "123",
  userId: "user-456",
  message: "Seu pedido foi aprovado!"
});
```

**Passo 5:** RabbitMQ recebe e armazena a mensagem na fila `notifications.high`

**Passo 6:** Controller retorna resposta para o usuário (rápido! ~100-200ms)

**Passo 7:** `NotificationWorker` está rodando em background e pega a mensagem

**Passo 8:** Worker processa a mensagem (envia email, SMS, etc.)

**Passo 9:** Worker confirma processamento (ACK) e RabbitMQ remove da fila

---

## 5. Estrutura de Filas de Prioridade

### 5.1 Por que 3 filas?

Nem todas as notificações têm a mesma urgência:

- **HIGH** (Alta prioridade) - Processadas primeiro
  - Exemplo: Alerta de segurança, código de autenticação

- **MEDIUM** (Média prioridade) - Processadas normalmente
  - Exemplo: Confirmação de pedido, atualização de status

- **LOW** (Baixa prioridade) - Processadas quando houver capacidade
  - Exemplo: Newsletter, lembretes de marketing

### 5.2 Como escolher a fila?

```typescript
// Alta prioridade - código de 2FA expira rápido!
await eventsService.emitHigh("notification.created", {
  type: "TWO_FACTOR_AUTH",
  code: "123456"
});

// Média prioridade - importante mas não urgente
await eventsService.emitMedium("notification.created", {
  type: "ORDER_CONFIRMATION",
  orderId: "789"
});

// Baixa prioridade - pode esperar
await eventsService.emitLow("notification.created", {
  type: "NEWSLETTER",
  content: "Novidades da semana"
});
```

### 5.3 Configuração das Filas

Todas as filas têm as mesmas configurações (podem ser customizadas):

```typescript
{
  durable: true,        // Fila sobrevive se RabbitMQ reiniciar
  noAck: false,         // Worker deve confirmar processamento
  prefetchCount: 1      // Worker pega 1 mensagem por vez
}
```

---

## 6. Arquitetura da Implementação

### 6.1 Estrutura de Pastas

```
src/infra/messaging/
├── constants/
│   ├── queues.ts          # Nomes das filas
│   ├── patterns.ts        # Tipos de mensagens
│   └── index.ts
├── rabbitmq/
│   ├── rabbitmq-config.factory.ts  # Configurações
│   └── index.ts
├── publishers/
│   ├── events.service.ts           # Publica mensagens
│   └── index.ts
├── workers/
│   ├── notification.worker.ts      # Consome mensagens
│   └── index.ts
├── messaging.module.ts              # Módulo NestJS
└── index.ts
```

### 6.2 Separação de Responsabilidades (Clean Architecture)

**Domain Layer (Domínio):**

- Não sabe que RabbitMQ existe
- Define as regras de negócio

**Application Layer (Aplicação):**

- Use Cases que podem usar `EventsService`
- Não sabe como as mensagens são enviadas (abstração)

**Infrastructure Layer (Infraestrutura):**

- `messaging/` - Toda a implementação do RabbitMQ está aqui
- Se quisermos trocar RabbitMQ por Kafka, SQS, etc., mudamos apenas aqui

---

## 7. Como Publicar Mensagens (Publisher)

### 7.1 EventsService

Localização: `src/infra/messaging/publishers/events.service.ts`

```typescript
@Injectable()
export class EventsService {
  constructor(
    @Inject("RABBITMQ_HIGH_PRIORITY")
    private readonly highPriorityClient: ClientProxy,
    @Inject("RABBITMQ_MEDIUM_PRIORITY")
    private readonly mediumPriorityClient: ClientProxy,
    @Inject("RABBITMQ_LOW_PRIORITY")
    private readonly lowPriorityClient: ClientProxy
  ) {}

  // Método para alta prioridade
  async emitHigh(pattern: string, data: any): Promise<void> {
    await firstValueFrom(this.highPriorityClient.send(pattern, data));
  }

  // Métodos similares para medium e low...
}
```

### 7.2 Como usar no Use Case

```typescript
import { EventsService } from "@/infra/messaging";
import { MESSAGE_PATTERNS } from "@/infra/messaging/constants";

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly eventsService: EventsService
    // outros repos...
  ) {}

  async execute(input: CreateNotificationInput) {
    // 1. Salva no banco de dados
    const notification = await this.notificationRepo.create(input);

    // 2. Determina a prioridade
    const priority = this.determinePriority(notification.type);

    // 3. Publica mensagem na fila apropriada
    if (priority === "HIGH") {
      await this.eventsService.emitHigh(MESSAGE_PATTERNS.NOTIFICATION_CREATED, {
        notificationId: notification.id
      });
    } else if (priority === "MEDIUM") {
      await this.eventsService.emitMedium(
        MESSAGE_PATTERNS.NOTIFICATION_CREATED,
        { notificationId: notification.id }
      );
    } else {
      await this.eventsService.emitLow(MESSAGE_PATTERNS.NOTIFICATION_CREATED, {
        notificationId: notification.id
      });
    }

    return notification;
  }

  private determinePriority(type: string): "HIGH" | "MEDIUM" | "LOW" {
    // Sua lógica aqui
    if (type === "TWO_FACTOR_AUTH") return "HIGH";
    if (type === "ORDER_CONFIRMATION") return "MEDIUM";
    return "LOW";
  }
}
```

### 7.3 O que acontece ao publicar?

1. `eventsService.emitHigh()` é chamado
2. Internamente usa `ClientProxy` do NestJS
3. `ClientProxy` se conecta ao RabbitMQ
4. Envia mensagem para a fila `notifications.high`
5. RabbitMQ confirma recebimento
6. Método retorna (rápido! ~10-50ms)

---

## 8. Como Consumir Mensagens (Worker)

### 8.1 NotificationWorker

Localização: `src/infra/messaging/workers/notification.worker.ts`

```typescript
@Controller()
export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);

  @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION_CREATED)
  async handleNotificationCreated(
    @Payload() data: any,
    @Ctx() context: RmqContext
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log("Processing notification...");

      // 🔹 AQUI VOCÊ IMPLEMENTA A LÓGICA
      // Buscar notificação no banco
      // Enviar email
      // Enviar SMS
      // Enviar push notification

      // ✅ Confirma que processou com sucesso
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error("Error processing", error);

      // ❌ Rejeita e devolve para fila (será reprocessada)
      channel.nack(originalMsg, false, true);
    }
  }
}
```

### 8.2 Decorators Explicados

**@Controller()**

- Marca a classe como controller do NestJS
- Necessário para NestJS reconhecer os message handlers

**@MessagePattern('notification.created')**

- Define qual tipo de mensagem esse método processa
- Quando uma mensagem com pattern `notification.created` chegar, esse método é
  chamado

**@Payload()**

- Extrai os dados da mensagem
- É o objeto que você enviou no `emitHigh(pattern, data)`

**@Ctx()**

- Context do RabbitMQ
- Usado para ACK/NACK

### 8.3 ACK vs NACK

**ACK (Acknowledgment - Confirmação)**

```typescript
channel.ack(originalMsg);
```

- "Processado com sucesso!"
- RabbitMQ **remove** a mensagem da fila
- Mensagem não será reprocessada

**NACK (Negative Acknowledgment - Rejeição)**

```typescript
channel.nack(originalMsg, false, true);
//                        ↑      ↑
//                        |      └─ requeue: true (volta pra fila)
//                        └─ multiple: false (só essa mensagem)
```

- "Falhou! Tenta de novo depois"
- RabbitMQ **recoloca** a mensagem na fila
- Mensagem será reprocessada

**Quando usar cada um:**

- ✅ **ACK**: Processamento bem-sucedido
- ❌ **NACK com requeue=true**: Erro temporário (banco offline, API
  indisponível)
- ❌ **NACK com requeue=false**: Erro permanente (dados inválidos, não adianta
  tentar)

### 8.4 Exemplo Completo de Implementação

```typescript
@Controller()
export class NotificationWorker {
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly emailService: EmailService,
    private readonly smsService: SMSService
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION_CREATED)
  async handleNotificationCreated(
    @Payload() data: { notificationId: string },
    @Ctx() context: RmqContext
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      // 1. Busca notificação
      const notification = await this.notificationRepo.findById(
        data.notificationId
      );

      if (!notification) {
        // Não existe = dados inválidos = não adianta tentar
        channel.nack(originalMsg, false, false);
        return;
      }

      // 2. Processa baseado no tipo
      if (notification.channel === "EMAIL") {
        await this.emailService.send(notification);
      } else if (notification.channel === "SMS") {
        await this.smsService.send(notification);
      }

      // 3. Atualiza status
      notification.markAsSent();
      await this.notificationRepo.save(notification);

      // 4. Confirma processamento
      channel.ack(originalMsg);

      this.logger.log(`Notification ${notification.id} sent!`);
    } catch (error) {
      this.logger.error("Error processing notification", error);

      // Se for erro temporário (timeout, etc.), requeue
      const shouldRequeue = this.isTemporaryError(error);
      channel.nack(originalMsg, false, shouldRequeue);
    }
  }

  private isTemporaryError(error: any): boolean {
    // Timeout, conexão recusada, etc. = temporário
    return error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT";
  }
}
```

---

## 9. Configuração e Variáveis de Ambiente

### 9.1 Docker Compose

```yaml
rabbitmq:
  container_name: notification-center-rabbitmq
  image: rabbitmq:3.8-management-alpine
  ports:
    - "5672:5672" # Porta AMQP (protocolo RabbitMQ)
    - "15672:15672" # Porta Management UI
  environment:
    RABBITMQ_DEFAULT_USER: guest
    RABBITMQ_DEFAULT_PASS: guest
```

**Porta 5672:** Onde sua aplicação se conecta ao RabbitMQ **Porta 15672:**
Interface web para visualizar filas, mensagens, etc.

### 9.2 Variáveis de Ambiente (.env)

```bash
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE_HIGH=notifications.high
RABBITMQ_QUEUE_MEDIUM=notifications.medium
RABBITMQ_QUEUE_LOW=notifications.low
```

**Formato da URL:**

```
amqp://usuário:senha@host:porta
```

### 9.3 Validação com Zod

```typescript
// src/infra/env/env.ts
export const envSchema = z.object({
  RABBITMQ_URL: z.coerce.string().default("amqp://guest:guest@localhost:5672"),
  RABBITMQ_QUEUE_HIGH: z.string().default("notifications.high"),
  RABBITMQ_QUEUE_MEDIUM: z.string().default("notifications.medium"),
  RABBITMQ_QUEUE_LOW: z.string().default("notifications.low")
});
```

### 9.4 Conectando Microservices (main.ts)

```typescript
// src/infra/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());

  const configService = app.get(EnvService);
  const rabbitmqUrl = configService.get("RABBITMQ_URL");

  // Conecta aos 3 microservices (1 por fila)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: configService.get("RABBITMQ_QUEUE_HIGH"),
      queueOptions: { durable: true },
      noAck: false,
      prefetchCount: 1
    }
  });

  // Repete para MEDIUM e LOW...

  await app.startAllMicroservices(); // Inicia os consumers
  await app.listen(port); // Inicia o HTTP server
}
```

**Importante:** A aplicação roda 2 coisas ao mesmo tempo:

1. **HTTP Server** (recebe requisições REST)
2. **Microservices** (consome mensagens do RabbitMQ)

---

## 10. Fluxo Completo de uma Mensagem

### Cenário: Usuário compra um produto

```
┌──────────────────────────────────────────────────────────────────┐
│ PASSO 1: Requisição HTTP                                        │
└──────────────────────────────────────────────────────────────────┘

POST /api/notifications
{
  "userId": "user-123",
  "type": "ORDER_CONFIRMATION",
  "orderId": "order-456"
}

┌──────────────────────────────────────────────────────────────────┐
│ PASSO 2: Controller                                             │
└──────────────────────────────────────────────────────────────────┘

@Post()
async create(@Body() dto: CreateNotificationDto) {
  return this.createNotificationUseCase.execute(dto);
}

┌──────────────────────────────────────────────────────────────────┐
│ PASSO 3: Use Case - Salva no Banco                              │
└──────────────────────────────────────────────────────────────────┘

const notification = await this.notificationRepo.create({
  id: 'notif-789',
  userId: 'user-123',
  message: 'Seu pedido #456 foi confirmado!'
});

┌──────────────────────────────────────────────────────────────────┐
│ PASSO 4: Use Case - Publica no RabbitMQ                         │
└──────────────────────────────────────────────────────────────────┘

await this.eventsService.emitMedium(
  'notification.created',
  { notificationId: 'notif-789' }
);

┌──────────────────────────────────────────────────────────────────┐
│ PASSO 5: RabbitMQ - Armazena na Fila MEDIUM                     │
└──────────────────────────────────────────────────────────────────┘

Queue: notifications.medium
Messages: [
  {
    pattern: 'notification.created',
    data: { notificationId: 'notif-789' }
  }
]

┌──────────────────────────────────────────────────────────────────┐
│ PASSO 6: Controller - Retorna Resposta (RÁPIDO!)                │
└──────────────────────────────────────────────────────────────────┘

HTTP 201 Created
{
  "id": "notif-789",
  "status": "pending"
}

┌──────────────────────────────────────────────────────────────────┐
│ PASSO 7: Worker - Pega Mensagem da Fila (EM BACKGROUND)         │
└──────────────────────────────────────────────────────────────────┘

@MessagePattern('notification.created')
async handleNotificationCreated(data, context) {
  // ...
}

┌──────────────────────────────────────────────────────────────────┐
│ PASSO 8: Worker - Processa                                      │
└──────────────────────────────────────────────────────────────────┘

const notification = await this.repo.findById('notif-789');
await this.emailService.send(notification);
notification.markAsSent();
await this.repo.save(notification);

┌──────────────────────────────────────────────────────────────────┐
│ PASSO 9: Worker - Confirma (ACK)                                │
└──────────────────────────────────────────────────────────────────┘

channel.ack(originalMsg);

┌──────────────────────────────────────────────────────────────────┐
│ PASSO 10: RabbitMQ - Remove da Fila                             │
└──────────────────────────────────────────────────────────────────┘

Queue: notifications.medium
Messages: [] ← Vazia!
```

**Tempo total para responder ao usuário:** ~150ms **Tempo total de
processamento:** ~2000ms (mas em background!)

---

## 11. Conceitos Avançados Utilizados

### 11.1 Durable Queues (Filas Duráveis)

```typescript
queueOptions: {
  durable: true; // ← IMPORTANTE!
}
```

**O que significa:**

- Fila **sobrevive** se RabbitMQ reiniciar
- Mensagens **não são perdidas** em caso de crash

**Sem durable:**

```
RabbitMQ reinicia → Fila desaparece → Mensagens perdidas ❌
```

**Com durable:**

```
RabbitMQ reinicia → Fila continua existindo → Mensagens preservadas ✅
```

### 11.2 Manual Acknowledgment (noAck: false)

```typescript
options: {
  noAck: false; // ← Worker DEVE confirmar processamento
}
```

**noAck: false** (Manual ACK):

- Worker **deve** chamar `ack()` ou `nack()`
- Se worker crashar antes de ack, mensagem volta pra fila
- Garante que mensagens sejam processadas

**noAck: true** (Auto ACK):

- RabbitMQ considera processado assim que entrega
- Se worker crashar, mensagem é perdida ❌

### 11.3 Prefetch Count

```typescript
options: {
  prefetchCount: 1; // ← Worker pega 1 mensagem por vez
}
```

**O que é:**

- Quantas mensagens o worker pode pegar da fila simultaneamente

**prefetchCount: 1:**

- Worker pega 1 mensagem
- Processa
- Faz ACK
- Só então pega outra

**Vantagens:**

- Se houver múltiplos workers, distribui melhor
- Worker não fica sobrecarregado

**prefetchCount: 10:**

- Worker pega 10 mensagens de uma vez
- Processa em paralelo
- Mais rápido, mas mais memória

### 11.4 Multiple Microservices (1 por fila)

Por que conectamos 3 microservices?

```typescript
app.connectMicroservice({ queue: "notifications.high" });
app.connectMicroservice({ queue: "notifications.medium" });
app.connectMicroservice({ queue: "notifications.low" });
```

**Razão:**

- Cada microservice é um **consumer independente**
- Conseguimos consumir das 3 filas **simultaneamente**
- Podemos ter workers diferentes para cada fila (no futuro)

**Alternativa (não recomendada):**

- 1 microservice conectado a 1 fila
- Outras filas não seriam consumidas

### 11.5 Pattern-Based Routing

```typescript
@MessagePattern('notification.created')
@MessagePattern('notification.sent')
@MessagePattern('notification.failed')
```

**O que é:**

- Diferentes métodos para diferentes tipos de mensagem
- Roteamento baseado no `pattern`

**Fluxo:**

```
Mensagem chega com pattern 'notification.created'
  ↓
NestJS verifica qual método tem @MessagePattern('notification.created')
  ↓
Chama handleNotificationCreated()
```

---

## 12. Boas Práticas e Dicas

### 12.1 Sempre use Try/Catch

```typescript
@MessagePattern('notification.created')
async handle(@Payload() data, @Ctx() context: RmqContext) {
  const channel = context.getChannelRef();
  const msg = context.getMessage();

  try {
    await this.process(data);
    channel.ack(msg);
  } catch (error) {
    this.logger.error('Error', error);
    channel.nack(msg, false, true);  // Requeue
  }
}
```

**Por quê?**

- Se exception não for tratada, mensagem fica "travada"
- RabbitMQ não sabe se deu certo ou não

### 12.2 Log Estruturado

```typescript
this.logger.log(`Processing notification ${data.id}`, {
  pattern: "notification.created",
  notificationId: data.id,
  userId: data.userId
});
```

**Vantagens:**

- Rastreabilidade
- Debug mais fácil
- Métricas

### 12.3 Idempotência

**Problema:**

```
Worker processa mensagem
Worker envia email ✅
Worker crasha antes de ACK
RabbitMQ reentrega mensagem
Worker envia email NOVAMENTE ❌ (duplicado!)
```

**Solução - Idempotent Key:**

```typescript
async handle(data, context) {
  // Verifica se já processou
  const alreadyProcessed = await this.checkIdempotentKey(data.id);

  if (alreadyProcessed) {
    channel.ack(msg);  // Já foi processado, só confirma
    return;
  }

  // Processa
  await this.process(data);

  // Salva chave idempotente
  await this.saveIdempotentKey(data.id);

  channel.ack(msg);
}
```

### 12.4 Dead Letter Queue (DLQ)

Se uma mensagem falhar **muitas vezes**, enviá-la para uma fila especial:

```typescript
// Configuração avançada (não implementada ainda)
queueOptions: {
  durable: true,
  deadLetterExchange: 'dlx',
  deadLetterRoutingKey: 'failed-notifications'
}
```

**Quando usar:**

- Mensagem falha 5x
- Vai pra DLQ
- Admin investiga manualmente

### 12.5 Monitoring

Use a interface web do RabbitMQ:

```
http://localhost:15672
User: guest
Pass: guest
```

**O que ver:**

- Quantas mensagens em cada fila
- Taxa de processamento
- Mensagens com erro
- Consumers conectados

### 12.6 Não envie objetos grandes

**❌ Ruim:**

```typescript
await eventsService.emit("notification.created", {
  notification: {
    /* objeto gigante com 1MB */
  }
});
```

**✅ Bom:**

```typescript
await eventsService.emit("notification.created", {
  notificationId: "123" // Só o ID!
});

// Worker busca do banco
const notification = await repo.findById(data.notificationId);
```

**Por quê?**

- Mensagens grandes deixam RabbitMQ lento
- Aumentam uso de memória
- Dados podem estar desatualizados quando worker processar

---

## 13. Troubleshooting

### 13.1 Mensagem não é consumida

**Verificar:**

1. Worker está rodando?

```bash
# Logs devem mostrar:
[Nest] Microservice listening...
```

2. Fila existe?

- Acesse http://localhost:15672
- Vá em "Queues"
- Veja se `notifications.high/medium/low` existem

3. Pattern está correto?

```typescript
// Publisher
emit('notification.created', data)

// Worker
@MessagePattern('notification.created')  // ← Deve ser IGUAL
```

4. Consumer está conectado?

- No RabbitMQ UI, clique na fila
- Veja "Consumers" - deve ter pelo menos 1

### 13.2 Mensagem é consumida mas não processa

**Verificar:**

1. Exception sendo lançada?

- Veja logs do Worker
- Exception não tratada = mensagem fica travada

2. ACK está sendo chamado?

```typescript
try {
  await process();
  channel.ack(msg); // ← OBRIGATÓRIO!
} catch {
  channel.nack(msg, false, true);
}
```

### 13.3 Mensagens duplicadas

**Causa:**

- Worker processa mas não dá ACK
- RabbitMQ reenvia

**Solução:**

- Sempre dê ACK após processar
- Implemente idempotência (ver 12.3)

### 13.4 Fila crescendo infinitamente

**Causa:**

- Workers não conseguem processar rápido o suficiente
- Ou workers estão caindo/falhando

**Soluções:**

1. Aumentar número de workers (escalar)
2. Otimizar processamento
3. Verificar por que está falhando (logs)

### 13.5 Connection Refused

**Erro:**

```
Error: connect ECONNREFUSED 127.0.0.1:5672
```

**Causa:**

- RabbitMQ não está rodando

**Solução:**

```bash
docker-compose up -d rabbitmq
```

### 13.6 Mensagens ficam em "Unacked"

**Causa:**

- Worker pegou mensagem mas não deu ACK nem NACK

**Solução:**

- Sempre chame `ack()` ou `nack()`
- Use try/catch para garantir

---

## 🎯 Resumo Final

### O que você precisa saber:

1. **RabbitMQ é um message broker** - intermediário entre quem envia e quem
   processa mensagens

2. **Publisher (EventsService)** - envia mensagens para filas

   ```typescript
   await eventsService.emitHigh("pattern", data);
   ```

3. **Consumer (NotificationWorker)** - processa mensagens das filas

   ```typescript
   @MessagePattern('pattern')
   async handle(data, context) { /* ... */ }
   ```

4. **3 Filas de Prioridade** - HIGH, MEDIUM, LOW para diferentes urgências

5. **ACK/NACK** - confirmar ou rejeitar processamento

   ```typescript
   channel.ack(msg); // Sucesso
   channel.nack(msg); // Falha - reprocessar
   ```

6. **Assíncrono** - Resposta rápida ao usuário, processamento em background

7. **Durable & Manual ACK** - Mensagens não são perdidas

### Próximos Passos:

1. ✅ Subir RabbitMQ com Docker Compose
2. ✅ Configurar variáveis de ambiente
3. ✅ Implementar lógica nos TODOs do NotificationWorker
4. ✅ Testar enviando mensagens
5. ✅ Monitorar no RabbitMQ UI

---

**Dúvidas?**

- RabbitMQ UI: http://localhost:15672
- Documentação NestJS: https://docs.nestjs.com/microservices/rabbitmq
- RabbitMQ Docs: https://www.rabbitmq.com/documentation.html
