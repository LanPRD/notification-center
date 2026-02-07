# NestJS - Guards: Protegendo suas Rotas

## 🤔 O que são Guards?

> "Como faço para verificar se o usuário está autenticado antes de acessar uma
> rota?"

Guards são classes que implementam a interface `CanActivate` e determinam se uma
requisição pode ou não prosseguir. Eles são executados **antes** dos handlers
(controllers) e **depois** dos middlewares.

## 🎯 Resposta Rápida

```typescript
// Criar um Guard
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }
}

// Usar no Controller
@UseGuards(AuthGuard)
@Get('/protected')
async protectedRoute() {
  return 'Acesso permitido!';
}
```

---

## 📚 Entendendo o Ciclo de Vida da Requisição

### Ordem de Execução

```
Request
   │
   ▼
┌──────────────┐
│  Middleware  │  ← Transformações genéricas (logging, cors, etc.)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Guard     │  ← Decisão: pode ou não acessar? ← VOCÊ ESTÁ AQUI
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Interceptor  │  ← Before handler (transformar request)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Pipe      │  ← Validação e transformação de dados
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Handler    │  ← Seu controller method
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Interceptor  │  ← After handler (transformar response)
└──────┬───────┘
       │
       ▼
Response
```

---

## 🆚 Guard vs Middleware

| Aspecto               | Middleware                    | Guard                                               |
| --------------------- | ----------------------------- | --------------------------------------------------- |
| **Execução**          | Antes de tudo                 | Depois do middleware, antes do handler              |
| **Contexto**          | Apenas `req`, `res`, `next()` | `ExecutionContext` (sabe qual handler será chamado) |
| **Propósito**         | Transformação genérica        | Autorização/permissão                               |
| **Retorno**           | `next()` para continuar       | `boolean` ou `Promise<boolean>`                     |
| **Acesso a metadata** | ❌ Não                        | ✅ Sim (via Reflector)                              |

### Quando usar cada um?

```typescript
// ✅ Middleware - Tarefas genéricas
// Logging, CORS, parsing, compressão
app.use(LoggerMiddleware);

// ✅ Guard - Decisões de acesso
// Autenticação, autorização, verificação de roles
@UseGuards(AuthGuard)
```

---

## 🏗️ Anatomia de um Guard

### Interface CanActivate

```typescript
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class MeuGuard implements CanActivate {
  /**
   * @param context - Contexto da execução (tem acesso ao request, response, handler, etc.)
   * @returns boolean | Promise<boolean> | Observable<boolean>
   *          - true: requisição prossegue
   *          - false: requisição é negada (403 Forbidden)
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // Sua lógica aqui
    return true;
  }
}
```

### ExecutionContext - O que você pode acessar

```typescript
canActivate(context: ExecutionContext): boolean {
  // Obter o request HTTP
  const request = context.switchToHttp().getRequest();
  const response = context.switchToHttp().getResponse();

  // Obter informações sobre o handler
  const handler = context.getHandler();     // Método do controller
  const controller = context.getClass();    // Classe do controller

  // Obter tipo de contexto (http, rpc, ws)
  const type = context.getType();           // 'http' | 'rpc' | 'ws'

  // Acessar argumentos
  const args = context.getArgs();

  return true;
}
```

---

## 🎨 Padrões Comuns de Guards

### 1. Authentication Guard (Autenticação)

Verifica se o usuário está autenticado.

```typescript
// src/infra/http/guards/auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("Token não fornecido");
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      // Anexa o usuário ao request para uso posterior
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Token inválido");
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
```

**Uso:**

```typescript
@Controller("users")
@UseGuards(AuthGuard) // Protege todas as rotas do controller
export class UsersController {
  @Get("profile")
  getProfile(@Req() request) {
    return request.user; // Usuário anexado pelo guard
  }
}
```

---

### 2. Roles Guard (Autorização por Papel)

Verifica se o usuário tem o papel necessário.

```typescript
// src/infra/http/decorators/roles.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

```typescript
// src/infra/http/guards/roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtém os roles necessários do decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Se não há roles definidos, permite acesso
    if (!requiredRoles) {
      return true;
    }

    // Obtém o usuário do request (anexado pelo AuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Verifica se o usuário tem algum dos roles necessários
    return requiredRoles.some(role => user.roles?.includes(role));
  }
}
```

**Uso:**

```typescript
@Controller("admin")
@UseGuards(AuthGuard, RolesGuard) // Primeiro autentica, depois verifica roles
export class AdminController {
  @Get("dashboard")
  @Roles("admin") // Apenas admins
  getDashboard() {
    return "Dashboard do admin";
  }

  @Get("reports")
  @Roles("admin", "manager") // Admins OU managers
  getReports() {
    return "Relatórios";
  }
}
```

---

### 3. Webhook Signature Guard (Verificação de Assinatura)

Verifica a assinatura de webhooks externos.

```typescript
// src/infra/webhooks/guards/sendgrid-signature.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException
} from "@nestjs/common";
import { createPublicKey, verify } from "node:crypto";

@Injectable()
export class SendGridSignatureGuard implements CanActivate {
  private readonly logger = new Logger(SendGridSignatureGuard.name);

  constructor(private readonly envService: EnvService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const signature = request.headers["x-twilio-email-event-webhook-signature"];
    const timestamp = request.headers["x-twilio-email-event-webhook-timestamp"];
    const rawBody = request.rawBody?.toString() ?? "";

    if (!this.verifySignature(signature, timestamp, rawBody)) {
      this.logger.warn("Invalid webhook signature received");
      throw new UnauthorizedException("Invalid webhook signature");
    }

    return true;
  }

  private verifySignature(
    signature: string,
    timestamp: string,
    rawBody: string
  ): boolean {
    const publicKey = this.envService.get("SENDGRID_WEBHOOK_VERIFICATION_KEY");

    // Em modo demo/dev, pula verificação se não configurado
    if (!publicKey) {
      this.logger.warn("Verification key not configured - skipping");
      return true;
    }

    try {
      const payload = timestamp + rawBody;
      const decodedSignature = Buffer.from(signature, "base64");

      const key = createPublicKey({
        key: `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`,
        format: "pem"
      });

      return verify(null, Buffer.from(payload), key, decodedSignature);
    } catch (error) {
      this.logger.error("Signature verification failed", error);
      return false;
    }
  }
}
```

---

### 4. Throttling Guard (Rate Limiting)

Limita a quantidade de requisições.

```typescript
// Usando @nestjs/throttler (recomendado)
import { ThrottlerGuard } from "@nestjs/throttler";

@Controller("api")
@UseGuards(ThrottlerGuard)
export class ApiController {
  // Limitado a X requisições por Y segundos (configurado no módulo)
}
```

```typescript
// Implementação manual simples
@Injectable()
export class RateLimitGuard implements CanActivate {
  private requests = new Map<string, number[]>();
  private readonly limit = 100; // máximo de requisições
  private readonly windowMs = 60000; // janela de 1 minuto

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const now = Date.now();

    // Obtém requisições anteriores do IP
    const timestamps = this.requests.get(ip) || [];

    // Filtra apenas requisições dentro da janela
    const recentRequests = timestamps.filter(t => now - t < this.windowMs);

    if (recentRequests.length >= this.limit) {
      throw new HttpException("Too Many Requests", 429);
    }

    // Adiciona requisição atual
    recentRequests.push(now);
    this.requests.set(ip, recentRequests);

    return true;
  }
}
```

---

### 5. Feature Flag Guard

Verifica se uma feature está habilitada.

```typescript
// Decorator
export const FEATURE_KEY = "feature";
export const Feature = (name: string) => SetMetadata(FEATURE_KEY, name);

// Guard
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureService: FeatureService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.get<string>(
      FEATURE_KEY,
      context.getHandler()
    );

    if (!feature) {
      return true; // Sem feature flag, permite
    }

    const isEnabled = await this.featureService.isEnabled(feature);

    if (!isEnabled) {
      throw new HttpException("Feature not available", 403);
    }

    return true;
  }
}
```

**Uso:**

```typescript
@Get('new-feature')
@Feature('NEW_CHECKOUT')  // Só funciona se a feature estiver habilitada
@UseGuards(FeatureFlagGuard)
async newFeature() {
  return 'Nova funcionalidade!';
}
```

---

## 🔧 Como Registrar Guards

### 1. Nível de Método

```typescript
@Controller("users")
export class UsersController {
  @Get("public")
  publicRoute() {
    return "Qualquer um pode acessar";
  }

  @Get("private")
  @UseGuards(AuthGuard) // ← Apenas nesta rota
  privateRoute() {
    return "Apenas autenticados";
  }
}
```

### 2. Nível de Controller

```typescript
@Controller("admin")
@UseGuards(AuthGuard, RolesGuard) // ← Todas as rotas do controller
export class AdminController {
  @Get("dashboard")
  @Roles("admin")
  dashboard() {}

  @Get("settings")
  @Roles("admin")
  settings() {}
}
```

### 3. Nível Global

```typescript
// main.ts
const app = await NestFactory.create(AppModule);
app.useGlobalGuards(new AuthGuard());

// OU via módulo (melhor para DI)
// app.module.ts
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ]
})
export class AppModule {}
```

### 4. Combinando Guards

```typescript
// Executados em ordem: AuthGuard → RolesGuard → FeatureFlagGuard
@UseGuards(AuthGuard, RolesGuard, FeatureFlagGuard)
@Get('super-protected')
superProtectedRoute() {}
```

**Ordem de execução:**

1. `AuthGuard` - Verifica se está autenticado
2. `RolesGuard` - Verifica se tem o papel necessário
3. `FeatureFlagGuard` - Verifica se a feature está habilitada

Se **qualquer um** retornar `false` ou lançar exceção, a requisição é negada.

---

## 🛡️ AuthGuard do Passport

### O que é?

O `@nestjs/passport` fornece o `AuthGuard`, uma implementação que integra com
estratégias do Passport.js (JWT, Local, OAuth, etc.).

### Por que usar?

```typescript
// ❌ Sem Passport - Você implementa tudo manualmente
@Injectable()
export class JwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Extrair token
    // Validar token
    // Decodificar payload
    // Buscar usuário
    // Anexar ao request
    // Tratar erros
    // ... muito código!
  }
}

// ✅ Com Passport - Framework faz o trabalho pesado
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  // Passport já faz tudo!
  // Só sobrescreve se quiser customizar
}
```

### Configuração Básica

```typescript
// 1. Instalar dependências
// npm install @nestjs/passport passport passport-jwt @nestjs/jwt

// 2. Criar estratégia JWT
// src/infra/auth/strategies/jwt.strategy.ts
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET
    });
  }

  // Chamado automaticamente após validar o token
  async validate(payload: any) {
    // O retorno é anexado em request.user
    return { userId: payload.sub, email: payload.email };
  }
}

// 3. Criar o Guard
// src/infra/auth/guards/jwt-auth.guard.ts
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  // Pode sobrescrever métodos para customizar

  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException("Token inválido ou expirado");
    }
    return user;
  }
}

// 4. Configurar módulo
// src/infra/auth/auth.module.ts
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "1h" }
    })
  ],
  providers: [JwtStrategy],
  exports: [JwtModule]
})
export class AuthModule {}

// 5. Usar
@Controller("users")
export class UsersController {
  @Get("profile")
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
    return req.user; // { userId, email } do validate()
  }
}
```

### Estratégias Disponíveis

| Estratégia   | Pacote                    | Uso                     |
| ------------ | ------------------------- | ----------------------- |
| **JWT**      | `passport-jwt`            | APIs stateless          |
| **Local**    | `passport-local`          | Login com usuário/senha |
| **Google**   | `passport-google-oauth20` | OAuth com Google        |
| **Facebook** | `passport-facebook`       | OAuth com Facebook      |
| **GitHub**   | `passport-github`         | OAuth com GitHub        |

---

## 📊 Comparação: CanActivate vs AuthGuard (Passport)

| Aspecto                  | CanActivate (puro)   | AuthGuard (Passport)              |
| ------------------------ | -------------------- | --------------------------------- |
| **Complexidade**         | Você implementa tudo | Framework ajuda                   |
| **Flexibilidade**        | Total controle       | Limitado às estratégias           |
| **Casos de uso**         | Lógica customizada   | Auth padrão (JWT, OAuth)          |
| **Curva de aprendizado** | Baixa                | Média (precisa entender Passport) |
| **Código**               | Mais código          | Menos código                      |
| **Manutenção**           | Você mantém          | Comunidade mantém                 |

### Quando usar cada um?

```typescript
// ✅ Use CanActivate puro quando:
// - Lógica de verificação é específica do seu negócio
// - Não envolve autenticação padrão
// - Webhook signatures, feature flags, rate limiting, etc.

@Injectable()
export class WebhookSignatureGuard implements CanActivate {}
export class FeatureFlagGuard implements CanActivate {}
export class IpWhitelistGuard implements CanActivate {}

// ✅ Use AuthGuard (Passport) quando:
// - Autenticação padrão (JWT, OAuth, etc.)
// - Quer aproveitar estratégias existentes
// - Múltiplos métodos de auth

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
export class GoogleAuthGuard extends AuthGuard("google") {}
export class LocalAuthGuard extends AuthGuard("local") {}
```

---

## 💡 Boas Práticas

### ✅ DO (Faça)

1. **Lance exceções específicas**

   ```typescript
   // ✅ Bom - Exceção específica
   throw new UnauthorizedException("Token expirado");

   // ❌ Ruim - Apenas retorna false (403 genérico)
   return false;
   ```

2. **Use injeção de dependências**

   ```typescript
   // ✅ Bom - Pode injetar serviços
   @Injectable()
   export class AuthGuard implements CanActivate {
     constructor(
       private readonly jwtService: JwtService,
       private readonly userService: UserService
     ) {}
   }
   ```

3. **Combine guards para responsabilidades separadas**

   ```typescript
   // ✅ Bom - Cada guard tem uma responsabilidade
   @UseGuards(AuthGuard, RolesGuard, FeatureFlagGuard)
   ```

4. **Use Reflector para metadata**

   ```typescript
   // ✅ Bom - Decorators + Reflector
   @Roles('admin')
   @Get('admin')
   adminRoute() {}
   ```

5. **Registre guards no módulo para DI funcionar**
   ```typescript
   // ✅ Bom
   @Module({
     providers: [AuthGuard, RolesGuard]
   })
   ```

---

### ❌ DON'T (Não faça)

1. **Não coloque lógica de negócio no guard**

   ```typescript
   // ❌ Ruim - Guard fazendo muito
   canActivate(context) {
     const user = this.getUser();
     this.updateLastAccess(user);      // ← Não!
     this.logAccess(user);             // ← Não!
     this.sendNotification(user);      // ← Não!
     return true;
   }
   ```

2. **Não ignore erros silenciosamente**

   ```typescript
   // ❌ Ruim
   try {
     await this.validate(token);
   } catch {
     return false; // Esconde o erro real
   }

   // ✅ Bom
   try {
     await this.validate(token);
   } catch (error) {
     throw new UnauthorizedException(error.message);
   }
   ```

3. **Não acesse banco diretamente**

   ```typescript
   // ❌ Ruim
   canActivate(context) {
     const user = await this.prisma.user.findUnique(...);  // ← Não!
   }

   // ✅ Bom
   canActivate(context) {
     const user = await this.userService.findById(...);
   }
   ```

---

## 🎯 Exemplo do Projeto: SendGridSignatureGuard

Este projeto usa um guard para validar assinaturas de webhooks do SendGrid:

```
src/infra/webhooks/
├── guards/
│   └── sendgrid-signature.guard.ts   ← Guard de verificação
├── controllers/
│   └── sendgrid-webhook.controller.ts
└── webhooks.module.ts
```

### Fluxo

```
SendGrid envia webhook
        │
        ▼
┌─────────────────────────────────┐
│   SendGridSignatureGuard        │
│   - Extrai headers (signature,  │
│     timestamp)                  │
│   - Verifica assinatura ECDSA   │
│   - Se inválido: 401            │
│   - Se válido: continua         │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│   SendGridWebhookController     │
│   - Processa eventos            │
│   - Chama Use Case              │
└─────────────────────────────────┘
```

### Uso

```typescript
@Controller()
@ApiTags("Webhooks")
export class SendGridWebhookController {
  @Post("/webhooks/sendgrid")
  @UseGuards(SendGridSignatureGuard) // ← Guard protege a rota
  async handle(@Body() body: SendGridWebhookBodyDto) {
    // Só chega aqui se a assinatura for válida
  }
}
```

---

## 📝 Resumo

### Tipos de Guards por Propósito

| Propósito         | Guard                        | Exemplo                          |
| ----------------- | ---------------------------- | -------------------------------- |
| **Autenticação**  | Verifica identidade          | `JwtAuthGuard`, `SessionGuard`   |
| **Autorização**   | Verifica permissão           | `RolesGuard`, `PermissionsGuard` |
| **Rate Limiting** | Limita requisições           | `ThrottlerGuard`                 |
| **Feature Flags** | Habilita/desabilita features | `FeatureFlagGuard`               |
| **Webhook**       | Valida assinatura            | `SendGridSignatureGuard`         |
| **IP Whitelist**  | Restringe por IP             | `IpWhitelistGuard`               |

### Checklist para criar um Guard

- [ ] Implementa `CanActivate`
- [ ] É decorado com `@Injectable()`
- [ ] Usa `ExecutionContext` para acessar request
- [ ] Retorna `boolean` ou `Promise<boolean>`
- [ ] Lança exceções específicas (não apenas `return false`)
- [ ] Está registrado no módulo como provider
- [ ] Usa `@UseGuards()` para aplicar

### Ordem de Aplicação

```typescript
@UseGuards(Guard1, Guard2, Guard3)
// Executa: Guard1 → Guard2 → Guard3
// Se qualquer um falhar, para imediatamente
```

---
