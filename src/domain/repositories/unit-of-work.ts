export abstract class UnitOfWork<TTx = unknown> {
  abstract run<T>(fn: (tx: TTx) => Promise<T>): Promise<T>;
}
