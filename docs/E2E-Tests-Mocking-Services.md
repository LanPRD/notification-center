# Testes E2E - Mockando Serviços Externos

## 🤔 O Problema

Você roda testes e2e e eles criam notificações reais. Depois, quando inicia
`start:dev`, o worker consome várias mensagens antigas do RabbitMQ.

```
$ npm run start:dev
[NotificationWorker] Processing message: notification.pending
[NotificationWorker] Processing message: notification.pending
[NotificationWorker] Processing message: notification.pending
# ← Mensagens dos testes!
```

**Por que isso acontece?**

1. Testes e2e usam o `AppModule` completo
2. `AppModule` inclui `MessagingModule` (RabbitMQ)
3. Ao criar notificações, `EventsService` emite para filas reais
4. Filas são `durable: true` - mensagens persistem
5. Worker consome quando inicia

---

## 🎯 Solução: Mock do EventsService

Nos testes e2e, substitua o `EventsService` por um mock que não faz nada:

```typescript
// __tests__/web-api/notification/create-notification.controller.e2e-spec.ts
import { EventsService } from "@/infra/messaging/publishers/events.service";

describe("Create notification (E2E)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { Test } = await import("@nestjs/testing");
    const { AppModule } = await import("@/infra/app.module.js");

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(EventsService) // ← Substitui o provider
      .useValue({
        emit: vi.fn().mockResolvedValue(undefined),
        emitHigh: vi.fn().mockResolvedValue(undefined),
        emitMedium: vi.fn().mockResolvedValue(undefined),
        emitLow: vi.fn().mockResolvedValue(undefined)
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });
});
```

---

## 🔍 O Que o Mock Faz

```typescript
.useValue({
  emit: vi.fn().mockResolvedValue(undefined),
  emitHigh: vi.fn().mockResolvedValue(undefined),
  emitMedium: vi.fn().mockResolvedValue(undefined),
  emitLow: vi.fn().mockResolvedValue(undefined)
})
```

`vi.fn().mockResolvedValue(undefined)` cria uma função que:

- ✅ **Não faz nada** (não conecta ao RabbitMQ)
- ✅ **Retorna `Promise<undefined>`** (importante para `.catch()`)
- ✅ **Registra chamadas** (pode verificar depois)
- ✅ **Não lança erros**

**Por que `.mockResolvedValue(undefined)` e não apenas `vi.fn()`?**

Se o código faz `.catch()` no resultado:

```typescript
await this.eventsService.emitLow(...).catch(err => ...);
```

`vi.fn()` retorna `undefined`, e `undefined.catch()` lança erro!

---

## 📊 Quando Usar Cada Tipo de Mock

### Funções que retornam `void` ou `Promise<void>`

```typescript
// EventsService.emit() retorna Promise<void>
async emit(pattern: string, data: any): Promise<void> {
  // ...
}

// Mock simples basta
.useValue({
  emit: vi.fn()  // ← Retorna undefined, que é compatível com void
})
```

### Funções que retornam valor

```typescript
// Se a função retornasse algo importante:
async getStatus(): Promise<string> {
  return "connected";
}

// Mock precisa retornar o valor
.useValue({
  getStatus: vi.fn().mockResolvedValue("connected")
})
```

### Tabela de Referência

| Tipo de Retorno           | Mock Necessário                      |
| ------------------------- | ------------------------------------ |
| `void`                    | `vi.fn()`                            |
| `Promise<void>`           | `vi.fn()`                            |
| `string`                  | `vi.fn().mockReturnValue("valor")`   |
| `Promise<string>`         | `vi.fn().mockResolvedValue("valor")` |
| `Promise` que pode falhar | `vi.fn().mockRejectedValue(erro)`    |

---

## 🧪 Verificando Chamadas no Teste

Se quiser verificar que o evento foi "emitido" (mesmo sendo mock):

```typescript
describe("Create notification (E2E)", () => {
  let eventsServiceMock: {
    emit: any;
    emitHigh: any;
    emitMedium: any;
    emitLow: any;
  };

  beforeAll(async () => {
    eventsServiceMock = {
      emit: vi.fn(),
      emitHigh: vi.fn(),
      emitMedium: vi.fn(),
      emitLow: vi.fn()
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(EventsService)
      .useValue(eventsServiceMock)
      .compile();

    // ...
  });

  test("[POST] /notifications cria notificação", async () => {
    await request(app.getHttpServer()).post("/notifications").send(body);

    // Verifica que emit foi chamado
    expect(eventsServiceMock.emitHigh).toHaveBeenCalled();
    expect(eventsServiceMock.emitHigh).toHaveBeenCalledWith(
      "notification.pending",
      expect.objectContaining({ notificationId: expect.any(String) })
    );
  });
});
```

---

## 🔄 Mudando Comportamento do Mock por Teste

Às vezes você precisa que o mock funcione em um teste e falhe em outro. Guarde
uma referência ao mock:

```typescript
describe("Cancel notification (E2E)", () => {
  let app: INestApplication;
  let eventsServiceMock: {
    emit: ReturnType<typeof vi.fn>;
    emitHigh: ReturnType<typeof vi.fn>;
    emitMedium: ReturnType<typeof vi.fn>;
    emitLow: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    // Cria o mock com comportamento padrão
    eventsServiceMock = {
      emit: vi.fn().mockResolvedValue(undefined),
      emitHigh: vi.fn().mockResolvedValue(undefined),
      emitMedium: vi.fn().mockResolvedValue(undefined),
      emitLow: vi.fn().mockResolvedValue(undefined)
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(EventsService)
      .useValue(eventsServiceMock) // ← Usa a referência
      .compile();

    // ...
  });

  afterEach(() => {
    // Reseta entre testes
    vi.clearAllMocks();
    // Volta ao comportamento padrão
    eventsServiceMock.emitLow.mockResolvedValue(undefined);
  });

  test("cancela notificação com sucesso", async () => {
    // Usa comportamento padrão (resolve)
    const result = await request(app.getHttpServer()).patch(
      `/notifications/${id}/cancel`
    );

    expect(result.status).toBe(200);
  });

  test("continua mesmo se emitLow falhar", async () => {
    // Muda comportamento para ESTE teste
    eventsServiceMock.emitLow.mockRejectedValue(
      new Error("RabbitMQ connection failed")
    );

    const result = await request(app.getHttpServer()).patch(
      `/notifications/${id}/cancel`
    );

    // Deve continuar funcionando - o .catch() captura o erro
    expect(result.status).toBe(200);
  });
});
```

### Métodos úteis para modificar mocks

| Método                          | O que faz                              |
| ------------------------------- | -------------------------------------- |
| `.mockResolvedValue(valor)`     | Retorna Promise que resolve            |
| `.mockRejectedValue(erro)`      | Retorna Promise que rejeita            |
| `.mockResolvedValueOnce(valor)` | Resolve apenas na próxima chamada      |
| `.mockRejectedValueOnce(erro)`  | Rejeita apenas na próxima chamada      |
| `.mockClear()`                  | Limpa histórico de chamadas            |
| `.mockReset()`                  | Limpa histórico + remove implementação |

---

## ⚠️ Cuidado: `.catch()` não captura erros síncronos

Se o mock retorna `undefined` ao invés de `Promise`, o `.catch()` **não
funciona**:

```typescript
// No use case:
await this.eventsService
  .emitLow(...)   // ← Se retorna undefined...
  .catch(...)     // ← undefined.catch() → TypeError!
```

### O que acontece

| Mock                                   | Retorna              | `.catch()` funciona?                            |
| -------------------------------------- | -------------------- | ----------------------------------------------- |
| `vi.fn()`                              | `undefined`          | ❌ TypeError: undefined.catch is not a function |
| `vi.fn().mockResolvedValue(undefined)` | `Promise<undefined>` | ✅ Funciona                                     |
| `vi.fn().mockRejectedValue(erro)`      | `Promise rejeitada`  | ✅ Captura o erro                               |

### Por que isso acontece?

O `.catch()` é um **método de Promise**. Se `emitLow()` retorna `undefined`,
você está tentando chamar um método em `undefined`:

```typescript
// Isso é o que acontece internamente:
const result = undefined;
result.catch(err => ...);  // 💥 TypeError!
```

O erro é **síncrono** (acontece antes de entrar na Promise), então o `.catch()`
nunca é alcançado.

**Regra:** Sempre use `.mockResolvedValue()` ou `.mockRejectedValue()` para
funções async.

---

## 🏗️ Outras Soluções (Alternativas)

### Opção 2: Filas Separadas para Testes

Criar `.env.test` com nomes de filas diferentes:

```env
# .env.test
RABBITMQ_QUEUE_HIGH=notifications.test.high
RABBITMQ_QUEUE_MEDIUM=notifications.test.medium
RABBITMQ_QUEUE_LOW=notifications.test.low
```

**Prós:** Testa integração real com RabbitMQ **Contras:** Precisa de RabbitMQ
rodando, mais lento

### Opção 3: Purgar Filas Antes de Dev

```bash
# Limpa filas antes de iniciar
rabbitmqctl purge_queue notifications.medium
npm run start:dev
```

**Prós:** Simples **Contras:** Manual, pode esquecer

### Opção 4: Limpar no afterAll

```typescript
afterAll(async () => {
  // Purgar filas via API do RabbitMQ
  await app.close();
});
```

**Prós:** Automático **Contras:** Complexo de implementar

---

## 📊 Comparação das Soluções

| Solução                | Velocidade | Complexidade | Isolamento |
| ---------------------- | ---------- | ------------ | ---------- |
| **Mock (recomendado)** | ✅ Rápido  | ✅ Simples   | ✅ Total   |
| Filas separadas        | ❌ Lento   | ⚠️ Média     | ⚠️ Parcial |
| Purgar manual          | ✅ N/A     | ✅ Simples   | ❌ Nenhum  |
| Limpar no afterAll     | ❌ Lento   | ❌ Complexo  | ⚠️ Parcial |

---

## 🎯 O Que Testar em E2E

### ✅ Testar

```typescript
// Casos de sucesso
test("[POST] /notifications cria notificação", async () => {
  const response = await request(app.getHttpServer())
    .post("/notifications")
    .send(body);

  expect(response.status).toBe(201);
});

// Erros de negócio
test("[POST] /notifications retorna 404 se usuário não existe", async () => {
  const response = await request(app.getHttpServer())
    .post("/notifications")
    .send({ ...body, userId: "inexistente" });

  expect(response.status).toBe(404);
});

// Validações básicas
test("[POST] /notifications retorna 400 se email inválido", async () => {
  const response = await request(app.getHttpServer())
    .post("/users")
    .send({ email: "invalido" });

  expect(response.status).toBe(400);
});
```

### ❌ Não testar em E2E

```typescript
// ❌ Testes de integração com RabbitMQ real
test("mensagem é consumida pelo worker"); // → Teste de integração separado

// ❌ Validações muito específicas
test("regex de telefone brasileiro"); // → Teste unitário do Value Object

// ❌ Erros de infraestrutura
test("retorna 500 se banco cair"); // → Difícil de simular
```

---

## 📝 Template Completo

```typescript
// __tests__/web-api/notification/create-notification.controller.e2e-spec.ts
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { EventsService } from "@/infra/messaging/publishers/events.service";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

describe("Create notification (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const { Test } = await import("@nestjs/testing");
    const { AppModule } = await import("@/infra/app.module.js");

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(EventsService)
      .useValue({
        emit: vi.fn().mockResolvedValue(undefined),
        emitHigh: vi.fn().mockResolvedValue(undefined),
        emitMedium: vi.fn().mockResolvedValue(undefined),
        emitLow: vi.fn().mockResolvedValue(undefined)
      })
      .compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test("[POST] /notifications creates a notification", async () => {
    // Arrange
    const user = await prisma.user.create({ data: { email: "test@test.com" } });

    const body = {
      userId: user.id,
      templateName: "welcome-email",
      content: { name: "John" },
      priority: "HIGH",
      externalId: "ext-123"
    };

    // Act
    const response = await request(app.getHttpServer())
      .post("/notifications")
      .set("Idempotency-Key", "unique-key")
      .send(body);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const notification = await prisma.notification.findFirst({
      where: { externalId: "ext-123" }
    });
    expect(notification).toBeTruthy();
  });

  test("[POST] /notifications returns 404 if user not found", async () => {
    const response = await request(app.getHttpServer())
      .post("/notifications")
      .set("Idempotency-Key", "unique-key-2")
      .send({
        userId: "non-existent-user",
        templateName: "welcome-email",
        content: {},
        priority: "HIGH",
        externalId: "ext-456"
      });

    expect(response.status).toBe(404);
  });
});
```

---

## ✅ Checklist - Testes E2E

- [ ] Importar `EventsService` do messaging
- [ ] Usar `.overrideProvider(EventsService).useValue({...})`
- [ ] Mockar todos os métodos (`emit`, `emitHigh`, `emitMedium`, `emitLow`)
- [ ] Usar `vi.fn()` para funções void
- [ ] Testar casos de sucesso
- [ ] Testar erros de negócio (404, 409)
- [ ] Testar validações básicas (400)
- [ ] Limpar dados no `afterAll` se necessário

---

## 🎉 Resumo

**Problema:** Testes e2e poluem filas do RabbitMQ

**Solução:** Mock do EventsService

```typescript
.overrideProvider(EventsService)
.useValue({
  emit: vi.fn(),
  emitHigh: vi.fn(),
  emitMedium: vi.fn(),
  emitLow: vi.fn()
})
```

**Benefícios:**

- ✅ Testes rápidos
- ✅ Sem dependência de RabbitMQ
- ✅ Filas limpas
- ✅ Isolamento total

**Regra:** Testes e2e testam o **contrato da API**, não a integração com
RabbitMQ.
