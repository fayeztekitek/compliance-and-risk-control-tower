import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ragService } from "../services/ai/rag.service.js";
import { knowledgeBaseService } from "../services/knowledgeBase.service.js";
import { embeddingService } from "../services/ai/embedding.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { query } from "../config/database.js";

const router = Router();
router.use(authMiddleware);

const searchSchema = z.object({
  query: z.string().min(1).max(1000),
  topK: z.number().min(1).max(20).optional(),
  category: z.string().optional(),
});

router.post("/search", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = searchSchema.parse(req.body);
    const chunks = await ragService.search(parsed.query, {
      topK: parsed.topK || 5,
      category: parsed.category,
      minScore: 0.1,
    });
    res.json({ data: chunks });
  } catch (err) { next(err); }
});

router.post("/reembed", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await ragService.reembedAll();
    res.json({ data: { reembedded: count } });
  } catch (err) { next(err); }
});

router.post("/embed/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await knowledgeBaseService.getById(req.params.id);
    const text = `${entry.title}\n${entry.content}`;
    const embedding = await embeddingService.generate(text);
    if (embedding) {
      await query("UPDATE knowledge_base SET embedding = $1 WHERE id = $2", [JSON.stringify(embedding), entry.id]);
      res.json({ data: { id: entry.id, embedded: true } });
    } else {
      res.status(500).json({ error: "Failed to generate embedding" });
    }
  } catch (err) { next(err); }
});

export default router;
