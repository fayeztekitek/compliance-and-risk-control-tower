import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service.js";
import { teamService } from "../services/team.service.js";
import { auditService } from "../services/audit.service.js";
import { query } from "../config/database.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { auditMiddleware } from "../middleware/audit.middleware.js";
import { ValidationError } from "../core/errors.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER"]));

// --- Users ---
router.get("/users", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query("SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC");
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

router.get("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query("SELECT id, name, email, role, status, created_at FROM users WHERE id = $1", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

const userSchema = z.object({ name: z.string().min(2).max(255), email: z.string().email(), password: z.string().min(6).max(128), role: z.string().optional() });
router.post("/users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = userSchema.parse(req.body);
    const result = await authService.register(parsed.name, parsed.email, parsed.password, parsed.role);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

router.put("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, status } = req.body;
    const fields: string[] = []; const params: any[] = []; let idx = 1;
    if (role) { fields.push(`role=$${idx++}`); params.push(role); }
    if (status) { fields.push(`status=$${idx++}`); params.push(status); }
    if (!fields.length) return next(new ValidationError("No fields to update"));
    params.push(req.params.id);
    const result = await query(`UPDATE users SET ${fields.join(",")} WHERE id=$${idx} RETURNING id, name, email, role, status`, params);
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query("DELETE FROM users WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ data: { success: true } });
  } catch (err) { next(err); }
});

// --- Teams ---
const teamSchema = z.object({ name: z.string().min(1).max(255), description: z.string().optional(), ownerId: z.string().uuid().optional() });
const memberSchema = z.object({ userId: z.string().uuid(), role: z.enum(["owner", "admin", "member"]).optional() });

router.get("/teams", async (_req: Request, res: Response, next: NextFunction) => {
  try { const teams = await teamService.list(); res.json({ data: teams }); } catch (err) { next(err); }
});

router.get("/teams/:id", async (req: Request, res: Response, next: NextFunction) => {
  try { const team = await teamService.getById(req.params.id); res.json({ data: team }); } catch (err) { next(err); }
});

router.post("/teams", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = teamSchema.parse(req.body);
    const team = await teamService.create(parsed);
    res.status(201).json({ data: team });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

router.put("/teams/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = teamSchema.partial().parse(req.body);
    const team = await teamService.update(req.params.id, parsed);
    res.json({ data: team });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

router.delete("/teams/:id", async (req: Request, res: Response, next: NextFunction) => {
  try { await teamService.delete(req.params.id); res.status(204).send(); } catch (err) { next(err); }
});

router.get("/teams/:id/members", async (req: Request, res: Response, next: NextFunction) => {
  try { const members = await teamService.getMembers(req.params.id); res.json({ data: members }); } catch (err) { next(err); }
});

router.post("/teams/:id/members", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = memberSchema.parse(req.body);
    const member = await teamService.addMember(req.params.id, parsed.userId, parsed.role);
    res.status(201).json({ data: member });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

router.delete("/teams/:teamId/members/:userId", async (req: Request, res: Response, next: NextFunction) => {
  try { await teamService.removeMember(req.params.teamId, req.params.userId); res.status(204).send(); } catch (err) { next(err); }
});

// --- Audit Log ---
router.get("/audit-logs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, action, resourceType, page, limit } = req.query;
    const result = await auditService.list({
      userId: userId as string, action: action as string, resourceType: resourceType as string,
      page: parseInt(page as string, 10) || 1, limit: Math.min(parseInt(limit as string, 10) || 50, 200),
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.get("/audit-logs/stats", async (_req: Request, res: Response, next: NextFunction) => {
  try { const stats = await auditService.getStats(); res.json({ data: stats }); } catch (err) { next(err); }
});

// --- System Health ---
router.get("/system-health", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dbResult = await query("SELECT 1 AS ok");
    const dbOk = dbResult.rows.length > 0;
    res.json({ data: { status: dbOk ? "healthy" : "degraded", database: dbOk ? "connected" : "disconnected", timestamp: new Date().toISOString(), uptime: process.uptime() } });
  } catch {
    res.json({ data: { status: "degraded", database: "disconnected", timestamp: new Date().toISOString(), uptime: process.uptime() } });
  }
});

// --- Activity Logs (legacy) ---
router.get("/activity-logs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const result = await query("SELECT id, level, message, timestamp, meta FROM logs ORDER BY timestamp DESC LIMIT $1", [limit]);
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

export default router;
