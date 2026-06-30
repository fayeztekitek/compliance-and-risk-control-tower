import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { knowledgeBaseService } from "../services/knowledgeBase.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { ValidationError } from "../core/errors.js";

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()).optional(),
  sourceUrl: z.string().max(500).optional(),
  sourceType: z.string().max(50).optional(),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().max(100).optional(),
});

const updateSchema = createSchema.partial();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = "1", limit = "20", category, search } = req.query;
    const result = await knowledgeBaseService.list({
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100),
      category: category as string | undefined,
      search: search as string | undefined,
    });
    res.json({ data: result.data, total: result.total, page: result.page, limit: result.limit });
  } catch (err) { next(err); }
});

router.get("/categories", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await knowledgeBaseService.getCategories();
    res.json({ data: categories });
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await knowledgeBaseService.getById(req.params.id);
    res.json({ data: entry });
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createSchema.parse(req.body);
    const entry = await knowledgeBaseService.create(parsed);
    res.status(201).json({ data: entry });
  } catch (err) { next(err); }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateSchema.parse(req.body);
    const entry = await knowledgeBaseService.update(req.params.id, parsed);
    res.json({ data: entry });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await knowledgeBaseService.delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
