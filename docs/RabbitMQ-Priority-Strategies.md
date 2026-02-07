# Estratégias de Priorização no RabbitMQ - Produção

## ❌ O que NÃO fazer

### Anti-Pattern: Delays com setTimeout

```typescript
// ❌ NÃO FAÇA ISSO EM PRODUÇÃO!
await this.sleep(5 * 60 * 1000); // Bloqueia worker por 5 minutos
```

**Problemas:**

- Worker bloqueado (não processa outras mensagens)
- Mensagem "unacked" (RabbitMQ aguardando)
- Desperdiça memória e conexões
- Não escala

---

## ✅ Soluções Reais para Produção

### Estratégia 1: Prefetch Count Diferente (Já implementado)

**Configuração:**

```typescript
// main.ts
HIGH: prefetchCount: 10; // Pega 10 mensagens por vez
MEDIUM: prefetchCount: 3; // Pega 3 mensagens por vez
LOW: prefetchCount: 1; // Pega 1 mensagem por vez
```

**Como funciona:**

- Worker HIGH processa 10 mensagens simultaneamente
- Worker LOW processa 1 por vez
- Se sistema está sobrecarregado, LOW fica esperando na fila
- HIGH sempre tem prioridade no throughput

**Economia de recursos:**

- ✅ Worker de LOW usa menos CPU/memória
- ✅ Sob pressão, LOW não compete com HIGH
- ✅ Recursos são alocados dinamicamente

**Quando usar:**

- ✅ Diferentes tipos de notificação com urgências diferentes
- ✅ Quer controlar throughput por prioridade
- ✅ Múltiplas filas (HIGH, MEDIUM, LOW)

---

### Estratégia 2: RabbitMQ Priority Queues (Recomendado!)

O RabbitMQ suporta **prioridades nativas** dentro da mesma fila.

**Configuração:**

#### 1. Atualizar configuração das filas

```typescript
// src/infra/messaging/messaging.module.ts
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: "RABBITMQ_NOTIFICATIONS",
        imports: [EnvModule],
        inject: [EnvService],
        useFactory: (envService: EnvService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [envService.get("RABBITMQ_URL")],
            queue: envService.get("RABBITMQ_QUEUE"),  // Uma fila só!
            queueOptions: {
              durable: true,
              maxPriority: 10  // ← Habilita prioridades de 0-10
            },
            noAck: false,
            prefetchCount: 5
          }
        })
      }
    ])
  ]
})
```

#### 2. Enviar mensagens com prioridade

```typescript
// src/infra/messaging/publishers/events.service.ts
@Injectable()
export class EventsService {
  constructor(
    @Inject("RABBITMQ_NOTIFICATIONS") private readonly client: ClientProxy
  ) {}

  async emitHigh(pattern: string, data: any): Promise<void> {
    await firstValueFrom(
      this.client.send(pattern, data, {
        priority: 10 // ← Maior prioridade
      })
    );
  }

  async emitMedium(pattern: string, data: any): Promise<void> {
    await firstValueFrom(
      this.client.send(pattern, data, {
        priority: 5 // ← Prioridade média
      })
    );
  }

  async emitLow(pattern: string, data: any): Promise<void> {
    await firstValueFrom(
      this.client.send(pattern, data, {
        priority: 1 // ← Menor prioridade
      })
    );
  }
}
```

#### 3. Consumer (worker) - sem mudanças!

```typescript
// Worker não muda nada - RabbitMQ entrega na ordem de prioridade!
@Controller()
export class NotificationWorker {
  @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION_PENDING)
  async handlePending(@Payload() data, @Ctx() context) {
    // Processa normalmente
    // RabbitMQ já entregou na ordem de prioridade
  }
}
```

**Como funciona:**

1. Todas as mensagens vão para **uma fila** (`notifications`)
2. Cada mensagem tem uma **prioridade** (0-10)
3. RabbitMQ **entrega primeiro** as mensagens de maior prioridade
4. Worker processa naturalmente na ordem correta

**Vantagens:**

- ✅ **NATIVO** do RabbitMQ (sem hacks)
- ✅ **Não bloqueia** worker
- ✅ **Economiza recursos** (menos filas, menos conexões)
- ✅ **Simples** de implementar
- ✅ **Escala** perfeitamente

**Desvantagens:**

- ⚠️ Performance levemente menor com muitas mensagens (RabbitMQ precisa ordenar)
- ⚠️ Não funciona bem com múltiplos consumers (prioridade não é garantida)

---

### Estratégia 3: Múltiplos Workers (Escala Horizontal)

Rode **múltiplas instâncias** da aplicação, cada uma configurada para consumir
filas diferentes.

**Docker Compose exemplo:**

```yaml
services:
  # Worker dedicado para HIGH
  notification-worker-high:
    image: notification-center:latest
    environment:
      - WORKER_TYPE=high # Env var customizada
      - RABBITMQ_QUEUE=notifications.high
    deploy:
      replicas: 3 # 3 instâncias para HIGH

  # Worker dedicado para MEDIUM
  notification-worker-medium:
    image: notification-center:latest
    environment:
      - WORKER_TYPE=medium
      - RABBITMQ_QUEUE=notifications.medium
    deploy:
      replicas: 2 # 2 instâncias para MEDIUM

  # Worker dedicado para LOW
  notification-worker-low:
    image: notification-center:latest
    environment:
      - WORKER_TYPE=low
      - RABBITMQ_QUEUE=notifications.low
    deploy:
      replicas: 1 # 1 instância para LOW
```

**Como funciona:**

- 3 workers processam HIGH simultaneamente
- 2 workers processam MEDIUM simultaneamente
- 1 worker processa LOW
- **Resultado:** HIGH tem 3x mais poder de processamento que LOW

**Vantagens:**

- ✅ **Máximo throughput** para HIGH
- ✅ **Isolamento** (problema em LOW não afeta HIGH)
- ✅ **Fácil de escalar** (aumenta replicas)
- ✅ **Economia clara** de recursos por prioridade

**Desvantagens:**

- ⚠️ Mais infraestrutura (múltiplos containers)
- ⚠️ Mais complexo de configurar

---

### Estratégia 4: Delayed Messages (Para delays REAIS)

Se você **realmente** precisa de delays (ex: enviar notificação 2 horas depois),
use o **RabbitMQ Delayed Message Plugin**.

**Instalação do Plugin:**

```bash
# Docker Compose
rabbitmq:
  image: rabbitmq:3.13-management
  environment:
    RABBITMQ_PLUGINS: rabbitmq_delayed_message_exchange
```

**Configuração:**

```typescript
// Configurar exchange do tipo "x-delayed-message"
queueOptions: {
  durable: true,
  arguments: {
    'x-delayed-type': 'direct'
  }
}

// Enviar mensagem com delay
await this.client.send(pattern, data, {
  headers: {
    'x-delay': 7200000  // 2 horas em ms
  }
});
```

**Como funciona:**

- Mensagem fica **retida no RabbitMQ** (não no worker!)
- Após o delay, RabbitMQ **entrega** a mensagem
- Worker processa normalmente

**Vantagens:**

- ✅ Worker **não fica bloqueado**
- ✅ Delay **real** no RabbitMQ
- ✅ Mensagem **persiste** se RabbitMQ reiniciar

**Quando usar:**

- ✅ Notificações agendadas (enviar daqui a X horas)
- ✅ Retry com backoff exponencial
- ✅ Rate limiting

---

## 📊 Comparação - Qual usar?

| Estratégia                       | Economia de Recursos | Complexidade | Produção        | Escalabilidade |
| -------------------------------- | -------------------- | ------------ | --------------- | -------------- |
| **setTimeout (delay no worker)** | ❌ Desperdiça        | ✅ Fácil     | ❌ Anti-pattern | ❌ Não escala  |
| **Prefetch Count diferente**     | ✅ Boa               | ✅ Fácil     | ✅ Sim          | ✅ Ótima       |
| **Priority Queues (RabbitMQ)**   | ✅ Ótima             | ⚠️ Média     | ✅ Sim          | ⚠️ Limitada    |
| **Múltiplos Workers**            | ✅ Excelente         | ⚠️ Complexa  | ✅ Sim          | ✅ Perfeita    |
| **Delayed Message Plugin**       | ✅ Perfeita          | ⚠️ Média     | ✅ Sim          | ✅ Ótima       |

---

## 🎯 Recomendações por Caso de Uso

### Caso 1: Diferentes tipos de notificação com urgências diferentes

**Recomendação:** Prefetch Count diferente (atual) + Múltiplos Workers
(produção)

```
Situação:
- HIGH: Códigos 2FA (urgente!)
- MEDIUM: Confirmações de pedido (importante)
- LOW: Newsletters (pode esperar)

Solução:
- 3 filas separadas (HIGH, MEDIUM, LOW)
- prefetchCount: 10, 3, 1
- Em produção: 3 workers HIGH, 2 MEDIUM, 1 LOW
```

### Caso 2: Mesma fila, mas algumas mensagens mais importantes

**Recomendação:** Priority Queues do RabbitMQ

```
Situação:
- Todas notificações na mesma fila
- Algumas urgentes, outras não

Solução:
- 1 fila com maxPriority: 10
- Marcar mensagens com priority (1-10)
- RabbitMQ entrega por prioridade
```

### Caso 3: Precisa de delays REAIS (agendar notificações)

**Recomendação:** Delayed Message Plugin

```
Situação:
- "Enviar lembrete daqui a 2 horas"
- "Retry após 5 minutos"

Solução:
- Delayed Message Plugin
- Enviar com header x-delay
- RabbitMQ segura a mensagem
```

---

## 🚀 Implementação Recomendada para Você

Baseado no seu projeto, recomendo **continuar com Prefetch Count diferente** e
remover os delays:

### 1. Remover setTimeout (delays fake)

```typescript
// ❌ REMOVER ISSO
private getDelayForQueue(queue: string): number { ... }
private sleep(ms: number): Promise<void> { ... }
```

### 2. Manter Prefetch Count (já configurado!)

```typescript
// ✅ MANTER ISSO
HIGH: prefetchCount: 10;
MEDIUM: prefetchCount: 3;
LOW: prefetchCount: 1;
```

### 3. (Opcional) Migrar para Priority Queues no futuro

Se quiser simplificar para 1 fila apenas:

```typescript
// Uma fila com prioridades nativas
queueOptions: {
  durable: true,
  maxPriority: 10
}
```

---

## 📈 Métricas em Produção

**Com Prefetch Count diferente:**

```
Cenário: 1000 notificações simultâneas
- 100 HIGH
- 500 MEDIUM
- 400 LOW

Resultado:
- HIGH: ~10 segundos (10 simultâneas)
- MEDIUM: ~3 minutos (3 simultâneas, após HIGH)
- LOW: ~20 minutos (1 por vez, após MEDIUM)

CPU/Memória:
- HIGH usa mais (10 processos paralelos)
- LOW usa menos (1 processo)
✅ Economia real de recursos!
```

**Com setTimeout (delay fake):**

```
Cenário: 1000 notificações simultâneas

Resultado:
- HIGH: ~10 segundos
- MEDIUM: 2min delay + processamento = 3min
- LOW: 5min delay + processamento = 25min

CPU/Memória:
- Worker BLOQUEADO durante delays
- Conexões OCUPADAS
- Memória DESPERDIÇADA
❌ Sem economia! Pior performance!
```

---

**Economia real de recursos vem de:**

- ✅ Prefetch Count: Controla quantas mensagens processam simultaneamente
- ✅ Múltiplos Workers: Aloca mais recursos para HIGH
- ✅ Priority Queues: RabbitMQ gerencia prioridade nativamente
- ❌ setTimeout: Bloqueia worker, desperdiça recursos
