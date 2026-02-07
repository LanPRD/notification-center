# RabbitMQ - send() vs emit() | @MessagePattern vs @EventPattern

## 🐛 O Erro que Você Recebeu

```
PRECONDITION_FAILED - reply consumer cannot acknowledge
```

### Por que aconteceu?

Você estava usando:

```typescript
// ❌ ERRADO
await firstValueFrom(this.client.send(pattern, data));
```

Com configuração:

```typescript
options: {
  noAck: false; // Manual ACK
}
```

**Conflito:**

- `send()` cria um "reply consumer" temporário (para receber resposta)
- Esse reply consumer precisa de `noAck: true` (auto-ack)
- Mas a fila está com `noAck: false` (manual ack)
- RabbitMQ rejeita!

---

## 📊 send() vs emit()

### send() - Request-Reply Pattern

```typescript
// Publisher
const response = await firstValueFrom(client.send("pattern", data));
console.log(response); // Recebe resposta do consumer
```

**Características:**

- ✅ Espera uma **resposta** do consumer
- ✅ Comunicação **bidirecional**
- ⚠️ Cria fila temporária para resposta
- ⚠️ Requer `noAck: true` no reply consumer
- 📝 Usa RPC (Remote Procedure Call)

**Quando usar:**

- Quando você **precisa da resposta** do worker
- Exemplo: "Processar pagamento e retornar resultado"
- Exemplo: "Validar dados e retornar status"

**Consumer precisa retornar:**

```typescript
@MessagePattern('process.payment')
async processPayment(data: any) {
  const result = await this.processPayment(data);
  return result; // ← Retorna resposta
}
```

---

### emit() - Fire-and-Forget (Event Pattern)

```typescript
// Publisher
client.emit("pattern", data);
// Não espera resposta, continua execução
```

**Características:**

- ✅ **NÃO espera** resposta
- ✅ Comunicação **unidirecional**
- ✅ Mais **rápido** e **eficiente**
- ✅ Funciona com `noAck: false`
- 📝 Publica evento e esquece

**Quando usar:**

- Quando você **não precisa da resposta**
- Exemplo: "Enviar email" (não importa quando)
- Exemplo: "Criar notificação" (só quer que aconteça)
- **É o caso do seu projeto!** ✅

**Consumer NÃO retorna nada:**

```typescript
@MessagePattern('notification.created')
async handleNotification(data: any) {
  await this.sendEmail(data);
  // Não retorna nada
}
```

---

## 🎯 Comparação Lado a Lado

### Cenário: Criar Notificação

#### ❌ Com send() (Errado para este caso)

```typescript
// Publisher (Use Case)
await firstValueFrom(
  this.client.send('notification.created', { id: '123' })
); // ← Espera resposta (desnecessário!)

// Consumer (Worker)
@MessagePattern('notification.created')
async handle(data: any) {
  await this.sendEmail(data);
  return { success: true }; // ← Tem que retornar
}

// Problemas:
// - Mais lento (espera resposta)
// - Cria fila temporária
// - Conflito com noAck: false
// - Desnecessário (não usamos a resposta)
```

#### ✅ Com emit() (Correto!)

```typescript
// Publisher (Use Case)
this.client.emit('notification.created', { id: '123' });
// ← Fire-and-forget! Continua execução

// Consumer (Worker)
@MessagePattern('notification.created')
async handle(data: any) {
  await this.sendEmail(data);
  // Não precisa retornar nada
}

// Vantagens:
// ✅ Mais rápido
// ✅ Sem conflitos
// ✅ Simples
// ✅ Funciona perfeitamente!
```

---

## 🏷️ @MessagePattern vs @EventPattern

### @MessagePattern - Para ambos send() e emit()

```typescript
@MessagePattern('notification.created')
async handle(data: any) {
  // Funciona com send() E emit()
}
```

**Características:**

- ✅ Funciona com `send()` (request-reply)
- ✅ Funciona com `emit()` (event)
- ✅ Mais flexível
- 📝 Padrão recomendado

---

### @EventPattern - Apenas para emit()

```typescript
@EventPattern('notification.created')
async handle(data: any) {
  // Só funciona com emit()
}
```

**Características:**

- ⚠️ **NÃO** funciona com `send()`
- ✅ Funciona com `emit()`
- ✅ Mais semântico (deixa claro que é evento)
- 📝 Opcional (use se preferir)

---

## 🔧 Solução Aplicada no Projeto

### ❌ Antes (com send() - causava erro)

```typescript
// events.service.ts
async emitHigh(pattern: string, data: any): Promise<void> {
  await firstValueFrom(this.highPriorityClient.send(pattern, data));
  //                                          ^^^^
  //                                    Request-Reply
  //                                    ❌ Erro!
}
```

### ✅ Depois (com emit() - funciona!)

```typescript
// events.service.ts
async emitHigh(pattern: string, data: any): Promise<void> {
  this.highPriorityClient.emit(pattern, data);
  //                      ^^^^
  //                  Fire-and-forget
  //                  ✅ Perfeito!
}
```

**Mudanças:**

1. ❌ Removido `await firstValueFrom()`
2. ✅ Trocado `send()` por `emit()`
3. ✅ Sem importação de `rxjs`

---

## 📐 Quando Usar Cada Um?

### Use send() quando:

- ✅ **Precisa da resposta** do worker
- ✅ Quer saber se processou com sucesso
- ✅ Precisa de dados retornados pelo worker

**Exemplos:**

```typescript
// Validar CPF
const isValid = await client.send("validate.cpf", { cpf: "123" });

// Calcular frete
const price = await client.send("calculate.shipping", { cep: "12345" });

// Processar pagamento
const result = await client.send("process.payment", { amount: 100 });
```

---

### Use emit() quando:

- ✅ **NÃO precisa da resposta**
- ✅ Quer apenas disparar uma ação
- ✅ Fire-and-forget

**Exemplos:**

```typescript
// Enviar email
client.emit("send.email", { to: "user@example.com" });

// Criar notificação
client.emit("notification.created", { userId: "123" });

// Registrar log
client.emit("log.activity", { action: "login" });

// Invalidar cache
client.emit("cache.invalidate", { key: "users" });
```

---

## 🎓 Boas Práticas

### ✅ DO (Faça)

1. **Use emit() para eventos que não precisam de resposta**

   ```typescript
   client.emit("notification.created", data);
   ```

2. **Use send() apenas quando realmente precisa da resposta**

   ```typescript
   const result = await client.send('validate.data', data);
   if (result.valid) { ... }
   ```

3. **Seja consistente nos nomes**

   ```typescript
   // Eventos (emit): use passado
   client.emit("notification.created", data);
   client.emit("email.sent", data);

   // Commands (send): use imperativo
   client.send("validate.cpf", data);
   client.send("process.payment", data);
   ```

4. **Trate erros de conexão**
   ```typescript
   try {
     client.emit("notification.created", data);
   } catch (error) {
     logger.error("Failed to emit event", error);
     // Não quebra a aplicação
   }
   ```

---

### ❌ DON'T (Não faça)

1. **Não use send() quando não precisa da resposta**

   ```typescript
   // ❌ Desnecessário
   await client.send("send.email", data);

   // ✅ Correto
   client.emit("send.email", data);
   ```

2. **Não espere emit() (ele não retorna Promise útil)**

   ```typescript
   // ❌ Errado
   await client.emit("notification.created", data);

   // ✅ Correto
   client.emit("notification.created", data);
   ```

3. **Não use send() com noAck: false** (causa o erro que você teve)

---

## 🔍 Troubleshooting

### Erro: "reply consumer cannot acknowledge"

**Causa:** Usando `send()` com `noAck: false`

**Solução:** Trocar para `emit()`

---

### Worker não recebe mensagens

**Verificar:**

1. Worker está registrado no AppModule?
2. Fila existe no RabbitMQ? (http://localhost:15672)
3. Pattern está correto? (publisher e consumer devem ter o mesmo)

---

### Mensagem enviada mas não processada

**Verificar:**

1. Worker tem erro e está fazendo NACK?
2. Worker está travado (timeout)?
3. Logs do worker mostram algo?

---

## 📊 Resumo Final

| Aspecto               | send()               | emit()             |
| --------------------- | -------------------- | ------------------ |
| **Espera resposta**   | ✅ SIM               | ❌ NÃO             |
| **Velocidade**        | ⚠️ Mais lento        | ✅ Mais rápido     |
| **noAck: false**      | ❌ Problema          | ✅ Funciona        |
| **Uso**               | RPC/Commands         | Eventos            |
| **Retorna no Worker** | ✅ Obrigatório       | ❌ Opcional        |
| **Caso de uso**       | Validações, cálculos | Notificações, logs |

### Para o seu projeto de notificações:

**✅ Use emit() - Fire-and-forget!**

```typescript
// ✅ Correto para notificações
this.client.emit("notification.created", data);
```

**Por quê?**

- Você não precisa saber quando/se o email foi enviado
- Quer apenas disparar a ação
- Mais rápido e eficiente
- Evita o erro que você teve

---
