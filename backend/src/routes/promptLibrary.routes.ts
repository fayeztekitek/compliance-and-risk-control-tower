import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { promptLibraryService } from "../services/promptLibrary.service.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { ValidationError } from "../core/errors.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"]));

const createSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  category: z.string().max(50).optional(),
  domain: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  category: z.string().max(50).optional(),
  domain: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = "1", limit = "20", category, domain, search, favoriteOnly } = req.query;
    const result = await promptLibraryService.list({
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100),
      category: category as string,
      domain: domain as string,
      search: search as string,
      favoriteOnly: favoriteOnly === "true",
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.get("/categories", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await promptLibraryService.getCategories();
    res.json({ data: categories });
  } catch (err) { next(err); }
});

router.get("/domains", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const domains = await promptLibraryService.getDomains();
    res.json({ data: domains });
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prompt = await promptLibraryService.get(req.params.id);
    res.json(prompt);
  } catch (err) { next(err); }
});

router.post("/", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = createSchema.parse(req.body);
    const prompt = await promptLibraryService.create({
      ...parsed,
      createdBy: req.user?.id,
    });
    res.status(201).json(prompt);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateSchema.parse(req.body);
    const prompt = await promptLibraryService.update(req.params.id, parsed);
    res.json(prompt);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await promptLibraryService.delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

router.post("/:id/use", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await promptLibraryService.incrementUsage(req.params.id);
    res.json({ data: { success: true } });
  } catch (err) { next(err); }
});

router.post("/:id/favorite", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prompt = await promptLibraryService.toggleFavorite(req.params.id);
    res.json(prompt);
  } catch (err) { next(err); }
});

export default router;
