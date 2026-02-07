# Value Objects e Validação no Domínio

## 🤔 O Problema

Você tem validações específicas no controller (usando Zod/class-validator), mas:

- Se trocar de framework, perde as validações
- A entidade aceita qualquer valor, mesmo inválido
- Regras de negócio ficam espalhadas

```typescript
// ❌ Controller valida, mas entidade aceita qualquer coisa
const schema = z.object({
  phoneNumber: z.string().regex(/^\+55\d{11}$/), // Valida aqui
  templateName: z.string().min(1)
});

// Entidade aceita qualquer string!
const user = User.create({ phoneNumber: "invalido" }); // ← Passa!
```

---

## 🎯 Solução: Value Objects

**Value Object** é um objeto que representa um valor do domínio com suas
próprias regras de validação.

```typescript
// ✅ Validação no domínio - portável e reutilizável
const phoneOrError = PhoneNumber.create("+5511999999999");

if (phoneOrError.isLeft()) {
  // Erro: telefone inválido
}

const user = User.create({ phoneNumber: phoneOrError.value });
```

---

## 📐 Onde Colocar Cada Validação

```
Request HTTP
    ↓
Controller (Zod/DTO)     ← Validação de FORMATO (é string? não vazio?)
    ↓
Use Case                  ← Cria Value Objects, trata erros
    ↓
Domain (Value Objects)   ← Validação de NEGÓCIO (telefone brasileiro válido?)
    ↓
Repository
```

### Exemplos

| Validação                           | Onde             | Por quê               |
| ----------------------------------- | ---------------- | --------------------- |
| "É uma string?"                     | Controller       | Formato básico        |
| "Não está vazio?"                   | Controller       | Formato básico        |
| "É um enum válido?"                 | Controller       | Trivial de reescrever |
| "Telefone com DDI + 8 dígitos?"     | **Value Object** | Regra de negócio      |
| "Template no formato slug?"         | **Value Object** | Regra de negócio      |
| "CPF com dígito verificador?"       | **Value Object** | Regra complexa        |
| "Email corporativo (@empresa.com)?" | **Value Object** | Regra de negócio      |

---

## 🏗️ Como Criar um Value Object

### Estrutura Básica

```typescript
// src/domain/value-objects/phone-number.ts
import { type Either, left, right } from "@/core/either";

export class InvalidPhoneNumberError extends Error {
  constructor(phone: string) {
    super(
      `Invalid phone number: "${phone}". Must have DDI followed by 8+ digits.`
    );
    this.name = "InvalidPhoneNumberError";
  }
}

export class PhoneNumber {
  public value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(phone: string): Either<InvalidPhoneNumberError, PhoneNumber> {
    if (!PhoneNumber.isValid(phone)) {
      return left(new InvalidPhoneNumberError(phone));
    }
    return right(new PhoneNumber(phone));
  }

  static isValid(phone: string): boolean {
    // DDI (1-3 dígitos) + número (8+ dígitos)
    const phoneRegex = /^\+\d{1,3}\d{8,}$/;
    return phoneRegex.test(phone);
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }
}
```

### Características

- ✅ **Construtor privado**: só cria via `create()`
- ✅ **Retorna Either**: `left` para erro, `right` para sucesso
- ✅ **Imutável**: valor não muda após criação
- ✅ **Validação interna**: regra fica no domínio
- ✅ **Portável**: funciona em qualquer framework

---

## 🔄 Integrando na Entidade

### Antes (string)

```typescript
// src/domain/entities/user.ts
interface UserProps {
  email: string;
  phoneNumber?: string | null; // ← Aceita qualquer string
}
```

### Depois (Value Object)

```typescript
// src/domain/entities/user.ts
import type { PhoneNumber } from "@/domain/value-objects/phone-number";

interface UserProps {
  email: string;
  phoneNumber?: PhoneNumber | null; // ← Só aceita PhoneNumber válido
}

export class User extends Entity<UserProps> {
  get phoneNumber(): PhoneNumber | null {
    return this.props.phoneNumber ?? null;
  }
}
```

---

## 🔄 Usando no Use Case

O Use Case cria o Value Object e trata o erro:

```typescript
// src/application/use-cases/users/create-user.ts
import {
  PhoneNumber,
  InvalidPhoneNumberError
} from "@/domain/value-objects/phone-number";

@Injectable()
export class CreateUserUseCase {
  async execute({ input }: CreateUserInput): Promise<CreateUserResponse> {
    const { email, phoneNumber, pushToken } = input;

    // Criar Value Object (valida automaticamente)
    let validatedPhone: PhoneNumber | null = null;

    if (phoneNumber) {
      const phoneOrError = PhoneNumber.create(phoneNumber);

      if (phoneOrError.isLeft()) {
        return left(
          new BadRequestException({
            message: phoneOrError.value.message
          })
        );
      }

      validatedPhone = phoneOrError.value;
    }

    // Entidade recebe Value Object já validado
    const user = User.create({
      email,
      phoneNumber: validatedPhone,
      pushToken
    });

    await this.userRepository.create(user);
    return right({ user });
  }
}
```

---

## 🔄 Atualizando Mappers

Os mappers convertem entre Value Object e string (para o banco):

```typescript
// src/infra/database/mappers/prisma-user-mapper.ts
import { PhoneNumber } from "@/domain/value-objects/phone-number";

export class PrismaUserMapper {
  // Banco → Domínio
  static toDomain(raw: PrismaUser): User {
    let phoneNumber: PhoneNumber | null = null;

    if (raw.phoneNumber) {
      const phoneOrError = PhoneNumber.create(raw.phoneNumber);
      if (phoneOrError.isRight()) {
        phoneNumber = phoneOrError.value;
      }
    }

    return User.create({
      email: raw.email,
      phoneNumber, // ← Value Object
      pushToken: raw.pushToken
    });
  }

  // Domínio → Banco
  static toPrisma(user: User): Prisma.UserUncheckedCreateInput {
    return {
      id: user.id.toString(),
      email: user.email,
      phoneNumber: user.phoneNumber?.value ?? null, // ← Extrai string
      pushToken: user.pushToken
    };
  }
}
```

---

## 🔄 Atualizando Presenters

Presenters extraem o valor para a resposta HTTP:

```typescript
// src/infra/http/presenters/user-presenter.ts
export class UserPresenter {
  static toHTTP(user: User) {
    return {
      id: user.id.toString(),
      email: user.email,
      phoneNumber: user.phoneNumber?.value ?? null, // ← Extrai string
      pushToken: user.pushToken
    };
  }
}
```

---

## 🧪 Atualizando Factories de Teste

```typescript
// __tests__/factories/user-builder.ts
import { PhoneNumber } from "@/domain/value-objects/phone-number";

export class UserFactory {
  static build(id?: UniqueEntityID, data: Partial<UserProps> = {}): User {
    return User.create({
      email: faker.internet.email(),
      phoneNumber: UserFactory.generateValidPhone(), // ← Value Object
      pushToken: faker.string.uuid(),
      ...data
    });
  }

  static generateValidPhone(): PhoneNumber {
    const ddi = "+55";
    const number = faker.string.numeric(11);
    const phoneOrError = PhoneNumber.create(`${ddi}${number}`);

    if (phoneOrError.isLeft()) {
      throw new Error("Failed to generate valid phone number");
    }

    return phoneOrError.value;
  }
}
```

---

## 📝 Exemplo Completo: TemplateName

### 1. Value Object

```typescript
// src/domain/value-objects/template-name.ts
import { type Either, left, right } from "@/core/either";

export class InvalidTemplateNameError extends Error {
  constructor(templateName: string) {
    super(`Invalid template name: "${templateName}". Must be a valid slug.`);
    this.name = "InvalidTemplateNameError";
  }
}

export class TemplateName {
  public value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(
    templateName: string
  ): Either<InvalidTemplateNameError, TemplateName> {
    // Normaliza: "Welcome Email" → "welcome-email"
    const normalized = templateName.split(" ").join("-").toLowerCase();

    if (!TemplateName.isValid(normalized)) {
      return left(new InvalidTemplateNameError(templateName));
    }

    return right(new TemplateName(normalized));
  }

  static isValid(templateName: string): boolean {
    // Slug: letras minúsculas, números, hífens
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(templateName);
  }

  equals(other: TemplateName): boolean {
    return this.value === other.value;
  }
}
```

### 2. Uso no Use Case

```typescript
// Entrada do usuário: "Welcome Email" ou "welcome-email"
const templateOrError = TemplateName.create(input.templateName);

if (templateOrError.isLeft()) {
  return left(
    new BadRequestException({
      message: templateOrError.value.message
    })
  );
}

// Valor normalizado: "welcome-email"
const notification = Notification.create({
  templateName: templateOrError.value
  // ...
});
```

---

## 📊 Quando Criar Value Object

| Critério                                  | Criar Value Object? |
| ----------------------------------------- | ------------------- |
| Validação é uma linha (não vazio, enum)   | ❌ Controller basta |
| Validação tem regex complexo              | ✅ Sim              |
| Validação tem lógica (dígito verificador) | ✅ Sim              |
| Pode ser usado em múltiplas entidades     | ✅ Sim              |
| É específico do domínio                   | ✅ Sim              |
| Precisa ser portável entre frameworks     | ✅ Sim              |

---

## 🎯 Fluxo Completo

```
1. Request chega: { "phoneNumber": "+5511999999999" }
                    ↓
2. Controller (Zod): Valida que é string, não vazio
                    ↓
3. Use Case: PhoneNumber.create(input.phoneNumber)
                    ↓
4. Value Object: Valida formato DDI + 8 dígitos
                    ↓
   Se inválido → return left(BadRequestException)
   Se válido   → continua
                    ↓
5. Entidade: User.create({ phoneNumber: validatedPhone })
                    ↓
6. Repository: Salva user.phoneNumber.value no banco
                    ↓
7. Presenter: Retorna { phoneNumber: user.phoneNumber?.value }
```

---

## ✅ Checklist - Criando Value Object

- [ ] Criar classe em `src/domain/value-objects/`
- [ ] Criar classe de erro (`InvalidXxxError`)
- [ ] Método `create()` retorna `Either<Error, ValueObject>`
- [ ] Método `isValid()` com a lógica de validação
- [ ] Construtor privado
- [ ] Atualizar entidade para usar o Value Object
- [ ] Atualizar Use Case para criar e tratar erro
- [ ] Atualizar Mapper (toDomain e toPrisma)
- [ ] Atualizar Presenter (extrair `.value`)
- [ ] Atualizar Factory de teste

---

## 🚫 Anti-Patterns

### ❌ Validação só no Controller

```typescript
// Controller valida...
const schema = z.object({
  phoneNumber: z.string().regex(/^\+55\d{11}$/)
});

// ...mas entidade aceita qualquer coisa
const user = User.create({ phoneNumber: "lixo" }); // Passa!
```

### ❌ Value Object sem Either

```typescript
// ❌ Lança exceção - difícil de tratar
static create(phone: string): PhoneNumber {
  if (!this.isValid(phone)) {
    throw new Error("Invalid phone");  // ← Exceção!
  }
  return new PhoneNumber(phone);
}

// ✅ Retorna Either - fácil de tratar
static create(phone: string): Either<Error, PhoneNumber> {
  if (!this.isValid(phone)) {
    return left(new InvalidPhoneError(phone));
  }
  return right(new PhoneNumber(phone));
}
```

### ❌ Validação duplicada

```typescript
// ❌ Mesma regex no Controller E no Value Object
// Controller
z.string().regex(/^\+\d{1,3}\d{8,}$/)

// Value Object
static isValid(phone: string): boolean {
  return /^\+\d{1,3}\d{8,}$/.test(phone);
}

// ✅ Controller valida só o básico, Value Object valida a regra
// Controller
z.string().min(1)

// Value Object
static isValid(phone: string): boolean {
  return /^\+\d{1,3}\d{8,}$/.test(phone);
}
```

---

## 🎉 Resumo

**Value Objects são para:**

- ✅ Regras de validação específicas do domínio
- ✅ Código portável entre frameworks
- ✅ Garantir que entidades só recebem valores válidos
- ✅ Centralizar lógica de validação

**Controller (Zod) é para:**

- ✅ Validações genéricas (é string? não vazio?)
- ✅ Conversão de tipos
- ✅ Primeira linha de defesa

**Fluxo:**

1. Controller valida formato básico
2. Use Case cria Value Object (valida regra de negócio)
3. Entidade recebe Value Object já validado
4. Mapper converte para/de string (banco)
5. Presenter extrai `.value` para resposta
