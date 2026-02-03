import type { User } from "@/domain/entities/user";
import type { UserRepository } from "@/domain/repositories/user-repository";

export class InMemoryUserRepository implements UserRepository {
  public users: User[] = [];

  async create(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }

  async findById(userId: string): Promise<User | null> {
    return this.users.find(user => user.id.toString() === userId) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) ?? null;
  }
}
