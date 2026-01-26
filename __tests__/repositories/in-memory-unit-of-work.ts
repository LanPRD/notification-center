import type { UnitOfWork } from "@/domain/repositories/unit-of-work";

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
