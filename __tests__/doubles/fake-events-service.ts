import { EventsService } from "@/infra/messaging";

export class FakeEventsService extends EventsService {
  public emittedEvents: Array<{
    priority: "HIGH" | "MEDIUM" | "LOW";
    pattern: string;
    data: any;
  }> = [];

  constructor() {
    // Não passa nada no super() porque não precisa dos ClientProxy reais
    super(null as any, null as any, null as any);
  }

  async emitHigh(pattern: string, data: any): Promise<void> {
    this.emittedEvents.push({ priority: "HIGH", pattern, data });
  }

  async emitMedium(pattern: string, data: any): Promise<void> {
    this.emittedEvents.push({ priority: "MEDIUM", pattern, data });
  }

  async emitLow(pattern: string, data: any): Promise<void> {
    this.emittedEvents.push({ priority: "LOW", pattern, data });
  }

  async emit(pattern: string, data: any): Promise<void> {
    await this.emitMedium(pattern, data);
  }

  /**
   * Helpers para asserções nos testes
   */
  hasEmittedEvent(pattern: string): boolean {
    return this.emittedEvents.some(event => event.pattern === pattern);
  }

  getEmittedEvent(pattern: string) {
    return this.emittedEvents.find(event => event.pattern === pattern);
  }

  clearEvents(): void {
    this.emittedEvents = [];
  }

  getEventCount(): number {
    return this.emittedEvents.length;
  }
}
