import { query } from "../../config/database.js";
import { eventBus } from "../../core/events/eventBus.js";
import { DomainEvent } from "../../core/events/types.js";
import { logger } from "../../core/logger.js";
import { emailService } from "../email.service.js";
import { slackService } from "../slack.service.js";

interface NotificationRule {
  id: string;
  name: string;
  eventType: string;
  channels: string[];
  recipients: string[];
  subjectTemplate: string;
  bodyTemplate: string;
  conditions: Record<string, any>;
}

function renderTemplate(template: string | undefined | null, data: Record<string, any>): string {
  if (!template) return "";
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? `{{${key}}}`));
}

class NotificationEngine {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    eventBus.subscribe("*", async (event: DomainEvent) => {
      try {
        await this.evaluateRules(event);
      } catch (err) {
        logger.error({ err, eventType: event.eventType }, "Notification rule evaluation failed");
      }
    });
    this.initialized = true;
    logger.info("Notification engine initialized");
  }

  async processEvent(event: DomainEvent): Promise<void> {
    await this.evaluateRules(event);
  }

  private async evaluateRules(event: DomainEvent): Promise<void> {
    const rules = await this.getMatchingRules(event.eventType);
    for (const rule of rules) {
      if (!this.matchesConditions(rule, event)) continue;
      for (const channel of rule.channels) {
        for (const recipient of rule.recipients) {
          await this.sendNotification({
            ruleId: rule.id,
            channel: channel as "EMAIL" | "SLACK" | "IN_APP",
            recipient,
            subject: renderTemplate(rule.subjectTemplate, event.data),
            body: renderTemplate(rule.bodyTemplate, event.data),
          });
        }
      }
    }
  }

  private async getMatchingRules(eventType: string): Promise<NotificationRule[]> {
    const result = await query(`
      SELECT id, name, event_type AS "eventType", channels, recipients,
             subject_template AS "subjectTemplate", body_template AS "bodyTemplate", conditions
      FROM notification_rules
      WHERE enabled = true AND (event_type = $1 OR event_type = '*')
    `, [eventType]);
    return result.rows;
  }

  private matchesConditions(rule: NotificationRule, event: DomainEvent): boolean {
    const conditions = rule.conditions;
    if (!conditions || Object.keys(conditions).length === 0) return true;
    for (const [key, value] of Object.entries(conditions)) {
      if (event.data[key] !== value) return false;
    }
    return true;
  }

  private async sendNotification(params: {
    ruleId: string;
    channel: "EMAIL" | "SLACK" | "IN_APP";
    recipient: string;
    subject: string;
    body: string;
  }): Promise<void> {
    let status = "SENT";
    try {
      if (params.channel === "EMAIL") {
        const sent = await emailService.sendAlert(params.recipient, params.subject, params.body);
        if (!sent) status = "FAILED";
      } else if (params.channel === "SLACK") {
        const sent = await slackService.sendAlert(params.body);
        if (!sent) status = "FAILED";
      }
    } catch (err) {
      logger.error({ err, channel: params.channel, recipient: params.recipient }, "Notification send failed");
      status = "FAILED";
    }

    try {
      await query(`
        INSERT INTO notifications (rule_id, channel, recipient, subject, body, status, delivered_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        params.ruleId, params.channel, params.recipient, params.subject, params.body,
        status, status === "SENT" ? new Date().toISOString() : null,
      ]);
    } catch (err) {
      logger.error({ err }, "Failed to persist notification");
    }
  }

  async addRule(params: {
    name: string;
    eventType: string;
    channels: string[];
    recipients: string[];
    subjectTemplate?: string;
    bodyTemplate?: string;
    conditions?: Record<string, any>;
  }): Promise<string> {
    const result = await query(`
      INSERT INTO notification_rules (name, event_type, channels, recipients, subject_template, body_template, conditions)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      params.name, params.eventType, params.channels, params.recipients,
      params.subjectTemplate || null, params.bodyTemplate || null,
      JSON.stringify(params.conditions || {}),
    ]);
    return result.rows[0].id;
  }

  async getNotifications(limit = 50, offset = 0) {
    const result = await query(`
      SELECT id, created_at, channel, recipient, subject, body, status, read_at, delivered_at
      FROM notifications
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await query(`UPDATE notifications SET status = 'READ', read_at = NOW() WHERE id = $1`, [notificationId]);
  }
}

export const notificationEngine = new NotificationEngine();
