import { EventEmitter } from "events";
import { DomainEvent, EventHandler } from "./types.js";
import { logger } from "../logger.js";

class EventBus {
  private emitter = new EventEmitter();
  private handlers = new Map<string, Set<EventHandler>>();

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    this.emitter.on(eventType, handler);
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    this.handlers.get(eventType)?.delete(handler);
    this.emitter.off(eventType, handler);
  }

  async publish(event: DomainEvent): Promise<void> {
    event.occurredAt = event.occurredAt || new Date();
    const matched = new Set<EventHandler>();
    const exact = this.handlers.get(event.eventType);
    if (exact) exact.forEach((h) => matched.add(h));
    const wildcard = this.handlers.get("*");
    if (wildcard) wildcard.forEach((h) => matched.add(h));
    if (matched.size === 0) {
      logger.debug(`No handlers for event: ${event.eventType}`);
      return;
    }
    const promises: Promise<void>[] = [];
    for (const handler of matched) {
      promises.push(handler(event).catch((err) => {
        logger.error({ err, eventType: event.eventType }, "Event handler failed");
      }));
    }
    await Promise.all(promises);
    logger.info({ eventType: event.eventType, aggregateId: event.aggregateId }, `Event published to ${matched.size} handler(s)`);
  }

  subscriberCount(eventType: string): number {
    return this.handlers.get(eventType)?.size || 0;
  }
}

export const eventBus = new EventBus();
