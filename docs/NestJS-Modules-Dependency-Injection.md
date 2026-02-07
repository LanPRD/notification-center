# NestJS - Módulos e Injeção de Dependências

## 🤔 O Problema

> "Por que não consigo usar EventsService no meu CreateNotificationUseCase?"

## 🎯 Resposta Rápida

Você precisa **importar o módulo** que **exporta** o serviço.

```typescript
// ❌ ANTES - Não funcionava
@Module({
  imports: [DatabaseModule], // Falta MessagingModule!
  providers: [CreateNotificationUseCase]
})
export class HttpModule {}

// ✅ DEPOIS - Funciona!
@Module({
  imports: [DatabaseModule, MessagingModule], // ← Adicionado!
  providers: [CreateNotificationUseCase]
})
export class HttpModule {}
```

---

## 📚 Entendendo o Sistema de Módulos do NestJS

### Conceitos Fundamentais

#### 1. **Providers** (Provedores)

São classes que podem ser **injetadas** (services, repositories, use cases,
etc.)

```typescript
@Module({
  providers: [EventsService]  // ← EventsService é um provider
})
```

**Regra:** Providers declarados aqui **só estão disponíveis DENTRO deste
módulo**.

---

#### 2. **Exports** (Exportações)

Torna providers **disponíveis para OUTROS módulos**.

```typescript
@Module({
  providers: [EventsService],
  exports: [EventsService] // ← Agora outros módulos podem usar!
})
export class MessagingModule {}
```

**Regra:** Se não exportar, ninguém de fora consegue usar.

---

#### 3. **Imports** (Importações)

Importa módulos para ter acesso aos providers **exportados** deles.

```typescript
@Module({
  imports: [MessagingModule], // ← Importa o módulo
  providers: [CreateNotificationUseCase] // ← Agora pode injetar EventsService!
})
export class HttpModule {}
```

**Regra:** Para usar um provider de outro módulo, você **DEVE** importar aquele
módulo.

---

## 🏗️ Diagrama Completo do Sistema

### Estrutura Atual do Projeto

```
┌─────────────────────────────────────────────────────────────────┐
│ AppModule                                                       │
│                                                                 │
│ imports: [                                                      │
│   HttpModule,                                                   │
│   EnvModule,                                                    │
│   MessagingModule                                               │
│ ]                                                               │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────────────┐
│   HttpModule     │  │  EnvModule   │  │  MessagingModule     │
│                  │  │              │  │                      │
│ imports: [       │  │ providers: [ │  │ imports: [           │
│   DatabaseModule │  │   EnvService │  │   ClientsModule      │
│   MessagingModule│◄─┼─ ]          │  │ ]                    │
│ ]                │  │              │  │                      │
│                  │  │ exports: [   │  │ providers: [         │
│ providers: [     │  │   EnvService │  │   EventsService,     │
│   Use Cases      │  │ ]            │  │   OnNotification...  │
│ ]                │  └──────────────┘  │ ]                    │
│                  │                     │                      │
│ controllers: [   │                     │ exports: [           │
│   Controllers    │                     │   EventsService  ◄───┼─┐
│ ]                │                     │ ]                    │ │
└──────────────────┘                     │                      │ │
         │                               │ controllers: [       │ │
         │                               │   NotificationWorker │ │
         │                               │ ]                    │ │
         │                               └──────────────────────┘ │
         │                                                         │
         └─────────────────────────────────────────────────────────┘
                     HttpModule pode usar EventsService
                     porque importa MessagingModule!
```

---

## 🔄 Fluxo de Injeção de Dependências

### Passo a Passo

#### 1. MessagingModule define e exporta EventsService

```typescript
// src/infra/messaging/messaging.module.ts
@Module({
  imports: [ClientsModule.registerAsync([...])],
  providers: [EventsService],     // ← Define
  exports: [EventsService]        // ← Exporta (importante!)
})
export class MessagingModule {}
```

**Sem o `exports`:** EventsService fica preso dentro do MessagingModule.

---

#### 2. HttpModule importa MessagingModule

```typescript
// src/infra/http/http.module.ts
@Module({
  imports: [
    DatabaseModule,
    MessagingModule // ← Importa para ter acesso ao EventsService
  ],
  providers: [CreateNotificationUseCase]
})
export class HttpModule {}
```

**Agora:** Todos os providers do HttpModule podem injetar EventsService!

---

#### 3. Use Case injeta EventsService

```typescript
// src/application/use-cases/notifications/create-notification.ts
import { EventsService } from '@/infra/messaging';

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly eventsService: EventsService  // ← Funciona!
  ) {}

  async execute(input) {
    // ...
    await this.eventsService.emitHigh(...);
  }
}
```

---

## 📊 Tabela de Resolução de Dependências

| Quer usar                   | Onde está definido | O que fazer                                  |
| --------------------------- | ------------------ | -------------------------------------------- |
| `EventsService`             | `MessagingModule`  | Importar `MessagingModule`                   |
| `NotificationRepository`    | `DatabaseModule`   | Importar `DatabaseModule`                    |
| `EnvService`                | `EnvModule`        | Importar `EnvModule`                         |
| `CreateNotificationUseCase` | `HttpModule`       | Não pode! Use Cases não devem ser exportados |

---

## 🚫 Erros Comuns

### Erro 1: Provider não exportado

```typescript
// ❌ ERRADO
@Module({
  providers: [EventsService]  // Define mas NÃO exporta
})
export class MessagingModule {}

// ❌ Outro módulo tenta usar
@Module({
  imports: [MessagingModule],
  providers: [CreateNotificationUseCase]  // EventsService não disponível!
})
```

**Solução:** Adicionar `exports: [EventsService]`

---

### Erro 2: Módulo não importado

```typescript
// ❌ ERRADO
@Module({
  imports: [DatabaseModule],  // Falta MessagingModule!
  providers: [CreateNotificationUseCase]
})
export class HttpModule {}

// CreateNotificationUseCase tenta injetar EventsService
constructor(private readonly eventsService: EventsService) {}
// ❌ Error: Nest can't resolve dependencies of CreateNotificationUseCase
```

**Solução:** Adicionar `MessagingModule` nos imports

---

### Erro 3: Circular Dependency (Dependência circular)

```typescript
// ❌ ERRADO
// ModuleA importa ModuleB
@Module({
  imports: [ModuleB]
})
export class ModuleA {}

// ModuleB importa ModuleA (circular!)
@Module({
  imports: [ModuleA]
})
export class ModuleB {}
```

**Solução:** Usar `forwardRef()` ou reorganizar dependências

---

## 🎯 Checklist - Como adicionar um novo serviço

Quando criar um novo serviço que precisa ser usado em outros lugares:

### 1. ✅ Definir o provider no módulo

```typescript
@Module({
  providers: [MeuNovoService]  // ← Passo 1
})
```

### 2. ✅ Exportar o provider

```typescript
@Module({
  providers: [MeuNovoService],
  exports: [MeuNovoService]  // ← Passo 2 (para usar fora)
})
```

### 3. ✅ Importar o módulo onde quer usar

```typescript
@Module({
  imports: [ModuloQueTemoServiço]  // ← Passo 3
})
```

### 4. ✅ Injetar normalmente

```typescript
constructor(private readonly meuNovoService: MeuNovoService) {}
```

---

## 🏛️ Arquitetura de Módulos do Projeto

### Módulos e suas Responsabilidades

```
AppModule (raiz)
├── EnvModule (configurações)
│   └── exports: [EnvService]
│
├── DatabaseModule (persistência)
│   └── exports: [Repositories]
│
├── MessagingModule (RabbitMQ)
│   ├── imports: [EnvModule]
│   └── exports: [EventsService]
│
└── HttpModule (API REST)
    ├── imports: [DatabaseModule, MessagingModule]
    └── providers: [Use Cases, Controllers]
```

### Fluxo de Importações

```
HttpModule
    ↓ imports
    ├── DatabaseModule → usa Repositories
    └── MessagingModule → usa EventsService
            ↓ imports
            └── EnvModule → usa EnvService
```

---

## 💡 Boas Práticas

### ✅ DO (Faça)

1. **Sempre exporte** serviços que outros módulos vão usar

   ```typescript
   exports: [EventsService, OutroService];
   ```

2. **Importe módulos**, não providers individuais

   ```typescript
   // ✅ Certo
   imports: [MessagingModule];

   // ❌ Errado (não é assim que funciona)
   imports: [EventsService];
   ```

3. **Use Global Module** para serviços usados em TODO lugar

   ```typescript
   @Global() // ← Disponível em todos os módulos sem importar
   @Module({
     providers: [EnvService],
     exports: [EnvService]
   })
   export class EnvModule {}
   ```

4. **Organize por contexto/domínio**
   - `DatabaseModule` - tudo relacionado a banco
   - `MessagingModule` - tudo relacionado a RabbitMQ
   - `HttpModule` - tudo relacionado a HTTP

---

### ❌ DON'T (Não faça)

1. **Não exporte Use Cases**

   ```typescript
   // ❌ Use Cases são específicos do contexto HTTP
   exports: [CreateNotificationUseCase];
   ```

2. **Não importe módulos que não precisa**

   ```typescript
   // ❌ Se não usa, não importa
   imports: [MessagingModule, OutroModuloDesnecessario];
   ```

3. **Não crie dependências circulares**
   - Se A importa B e B importa A → problema!

---

## 🔍 Debug - Como descobrir o problema

### Erro comum:

```
Error: Nest can't resolve dependencies of the CreateNotificationUseCase (?).
Please make sure that the argument EventsService at index [1] is available
in the HttpModule context.
```

### Como ler o erro:

1. **"CreateNotificationUseCase"** - Classe que está tentando injetar
2. **"EventsService at index [1]"** - Dependência que não foi encontrada
3. **"HttpModule context"** - Módulo onde está tentando injetar

### Solução:

1. Encontrar onde `EventsService` está definido → `MessagingModule`
2. Verificar se está exportado → `exports: [EventsService]` ✅
3. Verificar se `HttpModule` importa `MessagingModule` → ❌ Não importava!
4. Adicionar `MessagingModule` nos imports do `HttpModule` → ✅ Resolvido!

---

## 📝 Resumo Final

### Para usar EventsService no CreateNotificationUseCase:

1. ✅ `EventsService` está definido em `MessagingModule`
2. ✅ `MessagingModule` exporta `EventsService`
3. ✅ `HttpModule` importa `MessagingModule`
4. ✅ `CreateNotificationUseCase` pode injetar `EventsService`

### Regra de Ouro:

> **Para usar um provider de outro módulo, você DEVE importar aquele módulo.**

### Checklist Rápido:

- [ ] Provider está definido? (`providers: [...]`)
- [ ] Provider está exportado? (`exports: [...]`)
- [ ] Módulo está importado? (`imports: [...]`)

Se todos marcados, vai funcionar! ✅

---

## 🚀 Próximos Passos

Agora você pode:

```typescript
@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly eventsService: EventsService // ← Funciona!
  ) {}

  async execute(input: CreateNotificationInput) {
    const notification = Notification.create(input);

    await this.notificationRepo.create(notification);

    // ✅ Emitir evento para RabbitMQ
    await this.eventsService.emitHigh(MESSAGE_PATTERNS.NOTIFICATION_PENDING, {
      notificationId: notification.id.toString()
    });
  }
}
```
