import { Router, Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service.js";
import { query } from "../config/database.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { ValidationError } from "../core/errors.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN"]));

function zodHandler(fn: (req: Request) => any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try { const result = await fn(req); res.json({ data: result }); }
    catch (err: any) { if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors)); next(err); }
  };
}

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User list
 */
router.get("/users", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query("SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC");
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User details
 */
router.get("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query("SELECT id, name, email, role, status, created_at FROM users WHERE id = $1", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /admin/users:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string }
 *     responses:
 *       201:
 *         description: User created
 */
router.post("/users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return next(new ValidationError("Missing required fields: name, email, password"));
    }
    const result = await authService.register(name, email, password, role);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /admin/users/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update user role or status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User updated
 */
router.put("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, status } = req.body;
    const fields: string[] = []; const params: any[] = []; let idx = 1;
    if (role) { fields.push(`role=$${idx++}`); params.push(role); }
    if (status) { fields.push(`status=$${idx++}`); params.push(status); }
    if (!fields.length) return next(new ValidationError("No fields to update"));
    params.push(req.params.id);
    const result = await query(
      `UPDATE users SET ${fields.join(",")} WHERE id=$${idx} RETURNING id, name, email, role, status`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query("DELETE FROM users WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ data: { success: true } });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /admin/activity-logs:
 *   get:
 *     tags: [Admin]
 *     summary: List recent activity logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Activity log list
 */
router.get("/activity-logs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const result = await query("SELECT id, level, message, timestamp, meta FROM logs ORDER BY timestamp DESC LIMIT $1", [limit]);
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /admin/system-health:
 *   get:
 *     tags: [Admin]
 *     summary: Get system health status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health status
 */
router.get("/system-health", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dbResult = await query("SELECT 1 AS ok");
    const dbOk = dbResult.rows.length > 0;
    res.json({
      data: {
        status: dbOk ? "healthy" : "degraded",
        database: dbOk ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  } catch (err) {
    res.json({
      data: {
        status: "degraded",
        database: "disconnected",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  }
});

export default router;
