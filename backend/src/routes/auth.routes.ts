import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { ValidationError } from "../core/errors.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
  role: z.enum(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "AUDITOR", "EXECUTIVE_READ_ONLY"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input", parsed.error.flatten().fieldErrors);
    }
    const user = await authService.register(parsed.data.name, parsed.data.email, parsed.data.password, parsed.data.role);
    res.status(201).json({ data: user });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input", parsed.error.flatten().fieldErrors);
    }
    const { user, tokens } = await authService.login(parsed.data.email, parsed.data.password);
    res.json({
      data: { user, token: tokens.token, refreshToken: tokens.refreshToken, expiresIn: tokens.expiresIn },
    });
  } catch (err) { next(err); }
});

// POST /api/auth/refresh
router.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input", parsed.error.flatten().fieldErrors);
    }
    const tokens = await authService.refresh(parsed.data.refreshToken);
    res.json({ data: tokens });
  } catch (err) { next(err); }
});

// POST /api/auth/logout (requires auth)
router.post("/logout", authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await authService.logout(req.user!.id);
    res.json({ data: { message: "Logged out successfully" } });
  } catch (err) { next(err); }
});

// GET /api/auth/me (requires auth)
router.get("/me", authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.getProfile(req.user!.id);
    res.json({ data: profile });
  } catch (err) { next(err); }
});

export default router;
