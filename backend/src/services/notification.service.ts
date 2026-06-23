import { emailService } from "./email.service.js";
import { slackService } from "./slack.service.js";
import { pool } from "../config/database.js";
import { logger } from "../core/logger.js";

interface NotificationParams {
  ruleId: string;
  channel: string;
  recipients: string[];
  title: string;
  subject: string;
  bodyLines: string[];
  severity?: string;
  findingId: string;
}

export const notificationService = {
  async send(params: NotificationParams): Promise<boolean> {
    let delivered = false;

    if (params.channel === "EMAIL" || params.channel === "BOTH") {
      const ok = await emailService.sendAlert({
        to: params.recipients,
        subject: params.subject,
        title: params.title,
        bodyLines: params.bodyLines,
        severity: params.severity,
      });
      if (ok) delivered = true;
    }

    if (params.channel === "SLACK" || params.channel === "BOTH") {
      const ok = await slackService.sendAlert(params.subject, params.severity);
      if (ok) delivered = true;
    }

    await pool.query(
      `INSERT INTO nexus_alerts (rule_id, channel, delivery_status, delivered_at)
       VALUES ($1, $2, $3, ${delivered ? "now()" : "NULL"})`,
      [params.ruleId, params.channel, delivered ? "DELIVERED" : "FAILED"]
    );

    logger.info({ ruleId: params.ruleId, channel: params.channel, delivered }, "Notification sent");
    return delivered;
  },
};
