import type { User } from "../entities/user";

export abstract class UserRepository {
  abstract create(user: User): Promise<User>;
  abstract findById(userId: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
}
