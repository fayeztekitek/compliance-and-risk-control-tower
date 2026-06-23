import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { pool } from "../config/database.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "SECURITY_MANAGER", "COMPLIANCE_OFFICER"]));

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query("SELECT * FROM alert_rules ORDER BY created_at DESC");
    res.json({ data: rows });
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, source_tool, severity_threshold, condition, condition_value, channel, recipients, enabled } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO alert_rules (name, description, source_tool, severity_threshold, condition, condition_value, channel, recipients, enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, description, source_tool || null, severity_threshold || null, condition || "SEVERITY", condition_value || null, channel || "EMAIL", recipients || [], enabled !== false]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) { next(err); }
});

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, enabled, severity_threshold, condition, condition_value, channel, recipients } = req.body;
    const sets: string[] = []; const vals: any[] = []; let idx = 1;
    if (name !== undefined) { sets.push(`name = $${idx++}`); vals.push(name); }
    if (description !== undefined) { sets.push(`description = $${idx++}`); vals.push(description); }
    if (enabled !== undefined) { sets.push(`enabled = $${idx++}`); vals.push(enabled); }
    if (severity_threshold !== undefined) { sets.push(`severity_threshold = $${idx++}`); vals.push(severity_threshold); }
    if (condition !== undefined) { sets.push(`condition = $${idx++}`); vals.push(condition); }
    if (condition_value !== undefined) { sets.push(`condition_value = $${idx++}`); vals.push(condition_value); }
    if (channel !== undefined) { sets.push(`channel = $${idx++}`); vals.push(channel); }
    if (recipients !== undefined) { sets.push(`recipients = $${idx++}`); vals.push(recipients); }
    sets.push(`updated_at = now()`);
    vals.push(req.params.id);
    const { rows } = await pool.query(`UPDATE alert_rules SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`, vals);
    if (!rows[0]) return res.status(404).json({ error: "Rule not found" });
    res.json({ data: rows[0] });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query("DELETE FROM alert_rules WHERE id = $1", [req.params.id]);
    res.json({ data: { deleted: true } });
  } catch (err) { next(err); }
});

export default router;
