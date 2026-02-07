# Notification Center

API robusta para gerenciamento e envio de notificações multicanal, construída
com foco em confiabilidade, escalabilidade e boas práticas de arquitetura.

## Tecnologias

- **NestJS** com Fastify
- **PostgreSQL** + Prisma ORM
- **RabbitMQ** para processamento assíncrono
- **Zod** para validação
- **Vitest** para testes
- **Swagger** para documentação

## Arquitetura

O projeto segue os princípios de **Clean Architecture**, com separação clara de
responsabilidades:

```
src/
├── core/           # Classes base (Entity, Either, ValueObject)
├── domain/         # Entidades, Value Objects e contratos de repositório
├── application/    # Use Cases e regras de negócio
└── infra/          # Implementações (HTTP, Database, Messaging)
```

## Decisões Técnicas

### Either Pattern para Tratamento de Erros

Ao invés de lançar exceptions nos use cases, utilizo o pattern **Either** para
retorno explícito de sucesso ou falha. Isso torna o fluxo de erro previsível e
facilita o tratamento:

```typescript
// src/core/either.ts
export type Either<L, R> = Left<L, R> | Right<L, R>;

export function left<L, R>(result: L): Either<L, R> {
  return new Left(result);
}

export function right<L, R>(reason: R): Either<L, R> {
  return new Right(reason);
}
```

```typescript
// Uso no use case
const result = await this.useCase.execute(params);

if (result.isLeft()) {
  throw result.value; // BadRequestException, NotFoundException, etc.
}

return result.value.notification;
```

### Value Objects com Validação

Regras de domínio encapsuladas em Value Objects, garantindo que dados inválidos
nunca entrem no sistema:

```typescript
// src/domain/value-objects/template-name.ts
export class TemplateName {
  static create(
    templateName: string
  ): Either<InvalidTemplateNameError, TemplateName> {
    const normalized = templateName.split(" ").join("-").toLowerCase();

    if (!TemplateName.isValid(normalized)) {
      return left(new InvalidTemplateNameError(templateName));
    }

    return right(new TemplateName(normalized));
  }

  static isValid(templateName: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(templateName);
  }
}
```

### Idempotência para Operações Críticas

Requisições de criação de notificação são protegidas por chaves de idempotência,
evitando duplicações mesmo em cenários de retry:

```typescript
// src/application/use-cases/notifications/create-notification.ts
const result = await this.unitOfWork.run<TxEither>(async tx => {
  const existingIk = await this.idempotencyKeyRepository.findByKey(ik, tx);

  if (existingIk) {
    if (existingIk.responseStatus) {
      return right({ notification: existingIk.responseBody!, created: false });
    }
    return left(
      new ConflictException({ message: "Request is being processed" })
    );
  }

  // ... criar idempotency key e notificação dentro da transação
});
```

### Filas com Prioridade

O sistema utiliza três filas RabbitMQ com diferentes níveis de prioridade, cada
uma com `prefetchCount` ajustado:

```typescript
// src/infra/main.ts
// HIGH PRIORITY - Processa imediatamente (senha, 2FA)
app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.RMQ,
  options: {
    queue: configService.get("RABBITMQ_QUEUE_HIGH"),
    prefetchCount: 10
  }
});

// MEDIUM PRIORITY - Processa normalmente (atualizações de pedido)
// prefetchCount: 3

// LOW PRIORITY - Processa quando houver capacidade (marketing)
// prefetchCount: 1
```

### Unit of Work para Atomicidade

Operações que envolvem múltiplas entidades são executadas dentro de uma
transação, garantindo consistência:

```typescript
// src/infra/database/prisma/prisma-unit-of-work.service.ts
@Injectable()
export class PrismaUnitOfWorkService implements UnitOfWork<Prisma.TransactionClient> {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }
}
```

### Testes com Repositórios In-Memory

Para testes unitários, uso repositórios in-memory que suportam snapshot/restore
para simular rollback:

```typescript
// __tests__/repositories/in-memory-unit-of-work.ts
export class InMemoryUnitOfWork implements UnitOfWork<unknown> {
  constructor(
    private readonly repos: Array<{ snapshot(): any; restore(s: any): void }>
  ) {}

  async run<T>(fn: (tx: unknown) => Promise<T>) {
    const snapshots = this.repos.map(r => r.snapshot());
    try {
      return await fn({});
    } catch (err) {
      this.repos.forEach((r, i) => r.restore(snapshots[i]));
      throw err;
    }
  }
}
```

### Testes E2E com Schema Isolado

Cada suíte de teste E2E cria um schema PostgreSQL único, garantindo isolamento
total:

```typescript
// __tests__/setup-e2e.ts
const schemaId = randomUUID();

beforeAll(async () => {
  const databaseURL = generateDatabaseURL(schemaId);
  process.env.DATABASE_URL = databaseURL;
  execSync("npx prisma migrate deploy");
  // ...
});

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`);
});
```

## Endpoints

### Notifications

| Método  | Rota                                      | Descrição                                              |
| ------- | ----------------------------------------- | ------------------------------------------------------ |
| `POST`  | `/api/notifications`                      | Cria uma notificação (requer header `Idempotency-Key`) |
| `GET`   | `/api/notifications`                      | Lista todas as notificações com detalhes               |
| `GET`   | `/api/notifications/:id`                  | Busca notificação por ID                               |
| `PATCH` | `/api/notifications/:id/cancel`           | Cancela notificação pendente                           |
| `GET`   | `/api/notifications/:notificationId/logs` | Busca logs de entrega                                  |

### Users

| Método | Rota                             | Descrição                            |
| ------ | -------------------------------- | ------------------------------------ |
| `POST` | `/api/users`                     | Cria usuário com preferências padrão |
| `GET`  | `/api/users/:userId/preferences` | Busca preferências do usuário        |
| `PUT`  | `/api/users/:userId/preferences` | Atualiza preferências                |

## Documentação

- **Swagger**: Acesse `http://localhost:3000/api` após iniciar o servidor
- **RabbitMQ Management**: `http://localhost:15672` (guest/guest)

## Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd notification-center

# Instale as dependências
npm install

# Suba os containers (PostgreSQL + RabbitMQ)
docker-compose up -d

# Execute as migrations
npx prisma migrate deploy

# Inicie o servidor
npm run start:dev
```

## Scripts

| Comando                    | Descrição                                     |
| -------------------------- | --------------------------------------------- |
| `npm run start:dev`        | Inicia em modo desenvolvimento com hot-reload |
| `npm run start:prod`       | Inicia em modo produção                       |
| `npm run test`             | Executa testes unitários                      |
| `npm run test:watch`       | Testes em modo watch                          |
| `npm run test:cov`         | Gera relatório de cobertura                   |
| `npm run test:e2e`         | Executa testes end-to-end                     |
| `npm run test:e2e:cleanup` | Remove schemas de teste órfãos                |
| `npm run lint`             | Verifica e corrige código com ESLint          |
| `npm run check:types`      | Verifica tipos TypeScript                     |

## Estrutura de Testes

```
__tests__/
├── core/              # Testes de classes base
├── use-cases/         # Testes unitários dos use cases
├── web-api/           # Testes E2E dos endpoints
├── factories/         # Builders para criação de entidades
├── repositories/      # Repositórios in-memory
└── doubles/           # Fakes e mocks
```

## Anotações Técnicas

A pasta `docs/` contém anotações que fiz durante o desenvolvimento sobre alguns dos conceitos aplicados no projeto, como estratégias de priorização no RabbitMQ, Value Objects, testes E2E, entre outros.
