# Testing com Dependências Externas

## 🤔 O Problema

Você tem um Use Case que depende de serviços externos (EventsService,
EmailService, etc.). Como testar sem chamar os serviços reais?

```typescript
@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly eventsService: EventsService // ← Dependência externa!
  ) {}
}
```

---

## 🎯 Soluções (do melhor para o pior)

### ✅ Opção 1: Fake/Test Double (Recomendado)

**Crie uma versão "fake" para testes:**

```typescript
// __tests__/doubles/fake-events-service.ts
export class FakeEventsService extends EventsService {
  public emittedEvents: Array<{
    priority: string;
    pattern: string;
    data: any;
  }> = [];

  constructor() {
    super(null as any, null as any, null as any);
  }

  async emitHigh(pattern: string, data: any): Promise<void> {
    this.emittedEvents.push({ priority: "HIGH", pattern, data });
  }

  // ... outros métodos
}
```

**Uso no teste:**

```typescript
let eventsService: FakeEventsService;

beforeEach(() => {
  eventsService = new FakeEventsService();
  sut = new CreateNotificationUseCase(repo, eventsService);
});

test("should emit event after creating notification", async () => {
  await sut.execute(input);

  expect(eventsService.getEventCount()).toBe(1);
  expect(eventsService.hasEmittedEvent("notification.created")).toBe(true);
});
```

**Vantagens:**

- ✅ Simples de criar e usar
- ✅ Pode verificar chamadas
- ✅ Reutilizável em vários testes
- ✅ Não acopla teste à implementação
- ✅ Pode simular comportamentos diferentes

**Quando usar:**

- Testes unitários de Use Cases
- Dependências que você controla (do seu projeto)

---

### ✅ Opção 2: Mock/Spy

**Use bibliotecas de mock (vitest, jest):**

```typescript
import { vi } from "vitest";

let eventsService: EventsService;

beforeEach(() => {
  eventsService = {
    emitHigh: vi.fn(),
    emitMedium: vi.fn(),
    emitLow: vi.fn(),
    emit: vi.fn()
  } as any;

  sut = new CreateNotificationUseCase(repo, eventsService);
});

test("should call emitHigh when priority is HIGH", async () => {
  await sut.execute({ ...input, priority: "HIGH" });

  expect(eventsService.emitHigh).toHaveBeenCalledTimes(1);
  expect(eventsService.emitHigh).toHaveBeenCalledWith(
    "notification.created",
    expect.objectContaining({ notificationId: expect.any(String) })
  );
});
```

**Vantagens:**

- ✅ Rápido de criar
- ✅ Verifica chamadas e argumentos
- ✅ Pode simular erros facilmente

**Desvantagens:**

- ⚠️ Acopla teste à implementação
- ⚠️ Testes quebram ao refatorar (mesmo sem mudar comportamento)
- ⚠️ Dificulta refactoring

**Quando usar:**

- Quando não quer criar um Fake
- Para verificar chamadas específicas
- Testes rápidos/simples

---

### ⚠️ Opção 3: Instância Real (NÃO recomendado para testes unitários)

**Usar a instância real:**

```typescript
import { EventsService } from "@/infra/messaging";

let eventsService: EventsService;

beforeEach(() => {
  // Precisa criar ClientProxy, conectar RabbitMQ, etc.
  eventsService = new EventsService(clientHigh, clientMedium, clientLow);

  sut = new CreateNotificationUseCase(repo, eventsService);
});

test("should emit event", async () => {
  await sut.execute(input);
  // Como verificar? Precisa conectar no RabbitMQ de verdade...
});
```

**Problemas:**

- ❌ Lento (conecta no RabbitMQ real)
- ❌ Precisa de infraestrutura (RabbitMQ rodando)
- ❌ Não é teste unitário, é teste de integração
- ❌ Difícil de verificar resultados

**Quando usar:**

- **Nunca em testes unitários!**
- Apenas em testes de integração/E2E

---

## 📊 Comparação

| Aspecto            | Fake          | Mock/Spy     | Instância Real |
| ------------------ | ------------- | ------------ | -------------- |
| **Velocidade**     | ✅ Rápido     | ✅ Rápido    | ❌ Lento       |
| **Setup**          | ⚠️ Criar fake | ✅ Simples   | ❌ Complexo    |
| **Reusabilidade**  | ✅ Alta       | ⚠️ Média     | ❌ Baixa       |
| **Verificações**   | ✅ Simples    | ✅ Poderosas | ❌ Difícil     |
| **Refactoring**    | ✅ Seguro     | ⚠️ Quebra    | ⚠️ Quebra      |
| **Infraestrutura** | ✅ Nenhuma    | ✅ Nenhuma   | ❌ RabbitMQ    |
| **Tipo de teste**  | ✅ Unitário   | ✅ Unitário  | ❌ Integração  |

---

## 🏗️ Estrutura de Testes

### Organize seus doubles/fakes:

```
__tests__/
├── doubles/              ← Test doubles (fakes, stubs, mocks)
│   ├── fake-events-service.ts
│   ├── fake-email-service.ts
│   └── fake-sms-service.ts
├── factories/            ← Builders para criar objetos
│   ├── user-builder.ts
│   └── notification-builder.ts
├── repositories/         ← In-memory repositories
│   ├── in-memory-notification-repository.ts
│   └── in-memory-user-repository.ts
└── use-cases/            ← Testes dos use cases
    └── create-notification.spec.ts
```

---

## 🎓 Exemplo Completo

### 1. Fake EventsService

```typescript
// __tests__/doubles/fake-events-service.ts
import { EventsService } from "@/infra/messaging";

export class FakeEventsService extends EventsService {
  public emittedEvents: Array<{
    priority: "HIGH" | "MEDIUM" | "LOW";
    pattern: string;
    data: any;
  }> = [];

  constructor() {
    super(null as any, null as any, null as any);
  }

  async emitHigh(pattern: string, data: any): Promise<void> {
    this.emittedEvents.push({ priority: "HIGH", pattern, data });
  }

  async emitMedium(pattern: string, data: any): Promise<void> {
    this.emittedEvents.push({ priority: "MEDIUM", pattern, data });
  }

  async emitLow(pattern: string, data: any): Promise<void> {
    this.emittedEvents.push({ priority: "LOW", pattern, data });
  }

  // Helpers para testes
  hasEmittedEvent(pattern: string): boolean {
    return this.emittedEvents.some(e => e.pattern === pattern);
  }

  getEmittedEvent(pattern: string) {
    return this.emittedEvents.find(e => e.pattern === pattern);
  }

  clearEvents(): void {
    this.emittedEvents = [];
  }

  getEventCount(): number {
    return this.emittedEvents.length;
  }
}
```

### 2. Teste do Use Case

```typescript
// __tests__/use-cases/create-notification.spec.ts
import { CreateNotificationUseCase } from "@/application/use-cases/notifications/create-notification";
import { MESSAGE_PATTERNS } from "@/infra/messaging";
import { FakeEventsService } from "__tests__/doubles/fake-events-service";

let eventsService: FakeEventsService;
let sut: CreateNotificationUseCase;

describe("CreateNotificationUseCase", () => {
  beforeEach(() => {
    eventsService = new FakeEventsService();
    sut = new CreateNotificationUseCase(notificationRepo, eventsService);
  });

  test("should emit HIGH priority event", async () => {
    const result = await sut.execute({
      ...input,
      priority: "HIGH"
    });

    expect(result.isRight()).toBe(true);

    // Verifica que evento foi emitido
    expect(eventsService.getEventCount()).toBe(1);
    expect(
      eventsService.hasEmittedEvent(MESSAGE_PATTERNS.NOTIFICATION_PENDING)
    ).toBe(true);

    // Verifica prioridade
    const event = eventsService.getEmittedEvent(
      MESSAGE_PATTERNS.NOTIFICATION_PENDING
    );
    expect(event?.priority).toBe("HIGH");
  });

  test("should emit MEDIUM priority event by default", async () => {
    const result = await sut.execute(input);

    const event = eventsService.getEmittedEvent(
      MESSAGE_PATTERNS.NOTIFICATION_PENDING
    );
    expect(event?.priority).toBe("MEDIUM");
  });

  test("should not emit event if creation fails", async () => {
    notificationRepo = new FailingRepository();

    await expect(sut.execute(input)).rejects.toThrow();

    // Não deve ter emitido evento
    expect(eventsService.getEventCount()).toBe(0);
  });
});
```

---

## 🎯 Quando Usar Cada Abordagem

### Use **Fake** quando:

- ✅ Testar Use Cases
- ✅ Dependência é sua (EventsService, EmailService)
- ✅ Quer verificar comportamento
- ✅ Quer reutilizar em vários testes

### Use **Mock/Spy** quando:

- ✅ Teste rápido e simples
- ✅ Só quer verificar se método foi chamado
- ✅ Não precisa de lógica complexa

### Use **Instância Real** quando:

- ❌ **Nunca em testes unitários!**
- ✅ Testes de integração/E2E
- ✅ Testar integração real com RabbitMQ

---

## 🚫 Anti-Patterns

### ❌ Não faça isso:

```typescript
// ❌ Mock com muita lógica
const eventsService = {
  emitHigh: vi.fn().mockImplementation(async (pattern, data) => {
    if (pattern === "notification.created") {
      console.log("emitted");
      return { success: true };
    }
  })
};
// Se precisa de lógica, crie um Fake!
```

```typescript
// ❌ Instância real em teste unitário
beforeEach(() => {
  const clientHigh = new ClientProxy(...);
  eventsService = new EventsService(clientHigh, ...);
});
// Use Fake ou Mock!
```

```typescript
// ❌ Mock que verifica implementação interna
test("should call clientHigh.send()", () => {
  // ...
  expect(eventsService.highPriorityClient.send).toHaveBeenCalled();
});
// Teste o comportamento, não a implementação!
```

---

## 📝 Checklist - Testando com Dependências

- [ ] Dependência é externa? → Criar Fake ou Mock
- [ ] Precisa verificar chamadas? → Fake com tracking ou Mock
- [ ] Precisa simular erros? → Fake com métodos que lançam erros
- [ ] Teste unitário? → Fake ou Mock (nunca instância real)
- [ ] Teste integração? → Instância real (com infra rodando)
- [ ] Reutilizar em vários testes? → Fake

---

## 🎉 Resumo

**Para EventsService e outros serviços externos:**

1. ✅ **Crie um Fake** (`FakeEventsService`)
2. ✅ **Use no teste** (injete no Use Case)
3. ✅ **Verifique comportamento** (evento foi emitido?)
4. ✅ **Reutilize** em outros testes

**Não:**

- ❌ Usar instância real em testes unitários
- ❌ Conectar no RabbitMQ/Email/SMS real
- ❌ Testar implementação interna

**Sim:**

- ✅ Testar comportamento externo
- ✅ Isolar dependências
- ✅ Testes rápidos e confiáveis
