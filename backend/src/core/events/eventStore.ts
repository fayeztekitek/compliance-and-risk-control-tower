import { query } from "../../config/database.js";
import { DomainEvent } from "./types.js";
import { logger } from "../logger.js";

export async function storeEvent(event: DomainEvent): Promise<void> {
  try {
    await query(`
      INSERT INTO event_store (event_type, aggregate_type, aggregate_id, data, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      event.eventType,
      event.aggregateType,
      event.aggregateId,
      JSON.stringify(event.data),
      JSON.stringify(event.metadata || {}),
    ]);
  } catch (err) {
    logger.error({ err, eventType: event.eventType }, "Failed to store event");
  }
}

export async function getEventsByAggregate(aggregateType: string, aggregateId: string, limit = 50): Promise<DomainEvent[]> {
  const result = await query(`
    SELECT event_type, aggregate_type, aggregate_id, data, metadata, created_at
    FROM event_store
    WHERE aggregate_type = $1 AND aggregate_id = $2
    ORDER BY created_at DESC
    LIMIT $3
  `, [aggregateType, aggregateId, limit]);
  return result.rows.map((r: any) => ({
    eventType: r.event_type,
    aggregateType: r.aggregate_type,
    aggregateId: r.aggregate_id,
    data: r.data,
    metadata: r.metadata,
    occurredAt: r.created_at,
  }));
}

export async function getEventsByType(eventType: string, limit = 50): Promise<DomainEvent[]> {
  const result = await query(`
    SELECT event_type, aggregate_type, aggregate_id, data, metadata, created_at
    FROM event_store
    WHERE event_type = $1
    ORDER BY created_at DESC
    LIMIT $2
  `, [eventType, limit]);
  return result.rows.map((r: any) => ({
    eventType: r.event_type,
    aggregateType: r.aggregate_type,
    aggregateId: r.aggregate_id,
    data: r.data,
    metadata: r.metadata,
    occurredAt: r.created_at,
  }));
}
