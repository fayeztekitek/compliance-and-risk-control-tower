import { EventEmitter } from "events";
import { logger } from "../core/logger.js";

export type VegEventType =
  | "veg:request:created"
  | "veg:request:submitted"
  | "veg:request:approved"
  | "veg:request:rejected"
  | "veg:request:signed-off"
  | "veg:request:bid-decision"
  | "veg:request:go-nogo"
  | "veg:deal:created"
  | "veg:deal:updated";

export interface VegEventPayload {
  type: VegEventType;
  requestId?: string;
  dealId?: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class VegEventBus extends EventEmitter {
  emitVegEvent(payload: VegEventPayload): void {
    logger.info({ event: payload.type, id: payload.requestId || payload.dealId }, "VEG event emitted");
    this.emit(payload.type, payload);
  }
}

export const vegEventBus = new VegEventBus();

vegEventBus.on("veg:request:submitted", (p: VegEventPayload) => {
  logger.info({ requestId: p.requestId }, "VEG request submitted — SLA clock started");
});

vegEventBus.on("veg:deal:created", (p: VegEventPayload) => {
  logger.info({ dealId: p.dealId }, "VEG deal created — syncing to dashboard");
});
