export interface DomainEvent {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  occurredAt?: Date;
}

export type EventHandler = (event: DomainEvent) => Promise<void>;

export type EventBusSubscribe = {
  eventType: string;
  handler: EventHandler;
};
