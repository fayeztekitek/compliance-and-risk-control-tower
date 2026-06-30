import { query } from "../config/database.js";
import { logger } from "../core/logger.js";

interface NotificationInput {
  recipient: string;
  type: "info" | "warning" | "error" | "success";
  subject: string;
  body: string;
  link?: string;
  entityType?: string;
  entityId?: string;
}

async function insertNotification(n: NotificationInput): Promise<void> {
  await query(
    `INSERT INTO notifications (channel, recipient, subject, body, type, link, entity_type, entity_id, status, created_at)
     VALUES ('IN_APP', $1, $2, $3, $4, $5, $6, $7, 'PENDING', NOW())`,
    [n.recipient, n.subject, n.body, n.type, n.link || null, n.entityType || null, n.entityId || null]
  );
}

export const notificationGenerator = {
  async generateAll(): Promise<{ created: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;

    try { created += await this.overdueMilestones(); } catch (e: any) { errors.push(`overdueMilestones: ${e.message}`); }
    try { created += await this.overdueSteercoActions(); } catch (e: any) { errors.push(`overdueSteercoActions: ${e.message}`); }
    try { created += await this.upcomingSteerco(); } catch (e: any) { errors.push(`upcomingSteerco: ${e.message}`); }
    try { created += await this.criticalRagProjects(); } catch (e: any) { errors.push(`criticalRagProjects: ${e.message}`); }
    try { created += await this.missingSnapshots(); } catch (e: any) { errors.push(`missingSnapshots: ${e.message}`); }
    try { created += await this.expiringWaivers(); } catch (e: any) { errors.push(`expiringWaivers: ${e.message}`); }

    logger.info({ created, errorCount: errors.length }, "Notification generation complete");
    return { created, errors };
  },

  async overdueMilestones(): Promise<number> {
    const rows = await query(`
      SELECT pm.id, pm.name, p.name AS project_name, p.id AS project_id, p.responsible
      FROM project_milestones pm
      JOIN projects p ON p.id = pm.project_id
      WHERE pm.due_date < NOW() AND pm.status != 'COMPLETED'
    `);
    let count = 0;
    for (const row of rows.rows) {
      const recipients = [row.responsible].filter(Boolean);
      if (recipients.length === 0) continue;
      for (const r of recipients) {
        await insertNotification({
          recipient: r,
          type: "error",
          subject: "Overdue Milestone",
          body: `Milestone "${row.name}" for project "${row.project_name}" is overdue.`,
          link: `/projects/${row.project_id}`,
          entityType: "milestone",
          entityId: row.id,
        });
        count++;
      }
    }
    return count;
  },

  async overdueSteercoActions(): Promise<number> {
    const rows = await query(`
      SELECT sai.id, sai.description, sm.title AS meeting_title, p.id AS project_id, p.responsible
      FROM steerco_action_items sai
      JOIN steerco_meetings sm ON sm.id = sai.meeting_id
      JOIN projects p ON p.id = sm.project_id
      WHERE sai.due_date < NOW() AND sai.status NOT IN ('COMPLETED', 'CLOSED')
    `);
    let count = 0;
    for (const row of rows.rows) {
      const recipients = [row.responsible].filter(Boolean);
      if (recipients.length === 0) continue;
      for (const r of recipients) {
        await insertNotification({
          recipient: r,
          type: "warning",
          subject: "Overdue Action Item",
          body: `Action item "${row.description?.slice(0, 100)}" from "${row.meeting_title}" is overdue.`,
          link: `/projects/${row.project_id}/steerco`,
          entityType: "steerco_action_item",
          entityId: row.id,
        });
        count++;
      }
    }
    return count;
  },

  async upcomingSteerco(): Promise<number> {
    const rows = await query(`
      SELECT sm.id, sm.title, sm.meeting_date, p.id AS project_id, p.responsible
      FROM steerco_meetings sm
      JOIN projects p ON p.id = sm.project_id
      WHERE sm.meeting_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    `);
    let count = 0;
    for (const row of rows.rows) {
      const recipients = [row.responsible].filter(Boolean);
      if (recipients.length === 0) continue;
      for (const r of recipients) {
        await insertNotification({
          recipient: r,
          type: "info",
          subject: "Upcoming SteerCo",
          body: `SteerCo "${row.title}" is scheduled for ${new Date(row.meeting_date).toLocaleDateString()}.`,
          link: `/projects/${row.project_id}/steerco`,
          entityType: "steerco_meeting",
          entityId: row.id,
        });
        count++;
      }
    }
    return count;
  },

  async criticalRagProjects(): Promise<number> {
    const rows = await query(`
      SELECT id, name, responsible, rag_risk
      FROM projects
      WHERE rag_risk = 'RED'
    `);
    let count = 0;
    for (const row of rows.rows) {
      const recipients: string[] = [];
      if (row.responsible) recipients.push(row.responsible);
      const members = await query(`SELECT user_id FROM team_members WHERE team_id = (SELECT team_id FROM projects WHERE id = $1)`, [row.id]);
      for (const m of members.rows) {
        if (!recipients.includes(m.user_id)) recipients.push(m.user_id);
      }
      if (recipients.length === 0) continue;
      for (const r of recipients) {
        await insertNotification({
          recipient: r,
          type: "error",
          subject: "Critical Risk Project",
          body: `Project "${row.name}" has a RED risk RAG status. Immediate attention required.`,
          link: `/projects/${row.id}`,
          entityType: "project",
          entityId: row.id,
        });
        count++;
      }
    }
    return count;
  },

  async missingSnapshots(): Promise<number> {
    const rows = await query(`
      SELECT r.id, r.name, r.responsible
      FROM roadmaps r
      WHERE NOT EXISTS (
        SELECT 1 FROM roadmap_snapshots rs
        WHERE rs.roadmap_id = r.id AND rs.created_at > NOW() - INTERVAL '30 days'
      )
    `);
    let count = 0;
    for (const row of rows.rows) {
      const recipients = [row.responsible].filter(Boolean);
      if (recipients.length === 0) continue;
      for (const r of recipients) {
        await insertNotification({
          recipient: r,
          type: "warning",
          subject: "Snapshot Missing",
          body: `Roadmap "${row.name}" has not had a snapshot in over 30 days.`,
          link: `/snapshots`,
          entityType: "roadmap",
          entityId: row.id,
        });
        count++;
      }
    }
    return count;
  },

  async expiringWaivers(): Promise<number> {
    const rows = await query(`
      SELECT f.id, f.title, f.due_date, f.assigned_to
      FROM nexus_findings f
      WHERE f.status = 'WAIVED' AND f.due_date IS NOT NULL
        AND f.due_date BETWEEN NOW() AND NOW() + INTERVAL '14 days'
    `);
    let count = 0;
    for (const row of rows.rows) {
      const recipients = [row.assigned_to].filter(Boolean);
      if (recipients.length === 0) continue;
      for (const r of recipients) {
        await insertNotification({
          recipient: r,
          type: "warning",
          subject: "Waiver Expiring",
          body: `Waiver "${row.title}" expires on ${new Date(row.due_date).toLocaleDateString()}.`,
          link: `/waived-accepted-risks`,
          entityType: "finding",
          entityId: row.id,
        });
        count++;
      }
    }
    return count;
  },
};
