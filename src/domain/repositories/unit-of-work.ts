export interface UnitOfWork<TTx = unknown> {
  run<T>(fn: (tx: TTx) => Promise<T>): Promise<T>;
}
