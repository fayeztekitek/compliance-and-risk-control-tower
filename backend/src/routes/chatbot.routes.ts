import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import { chatbotService, PageContext } from "../services/chatbot.service.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { ValidationError } from "../core/errors.js";
import { randomUUID } from "crypto";

const router = Router();
router.use(authMiddleware);

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
  })).min(1),
  pageContext: z.object({
    page: z.string(),
    pageLabel: z.string(),
    entityId: z.string().optional(),
    entityType: z.string().optional(),
    filters: z.record(z.any()).optional(),
  }),
  conversationId: z.string().optional(),
});

router.get("/quick-actions", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = (req.query.page as string) || "executive";
    res.json({ data: chatbotService.getQuickActions(page) });
  } catch (err) { next(err); }
});

router.get("/conversations", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const result = await chatbotService.listConversations(req.user!.id, page, limit);
    res.json({ data: result.data, total: result.total, page: result.page, limit: result.limit });
  } catch (err) { next(err); }
});

router.get("/conversations/:id", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const conv = await chatbotService.getConversation(req.params.id, req.user!.id);
    res.json({ data: conv });
  } catch (err) { next(err); }
});

router.delete("/conversations/:id", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await chatbotService.deleteConversation(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

router.post("/conversations/:id/archive", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await chatbotService.archiveConversation(req.params.id, req.user!.id);
    res.json({ data: { success: true } });
  } catch (err) { next(err); }
});

router.post("/chat", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = chatSchema.parse(req.body);
    const stream = req.headers.accept?.includes("text/event-stream");
    const convId = parsed.conversationId || `conv_${randomUUID().slice(0, 8)}`;
    const userId = req.user!.id;

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      res.write(`data: ${JSON.stringify({ conversationId: convId })}\n\n`);

      const result = await chatbotService.chatStream(
        parsed.messages, parsed.pageContext, convId, userId
      );

      for await (const chunk of result) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text, conversationId: convId })}\n\n`);
        }
      }
      res.write(`data: [DONE]\n\n`);
      res.end();
    } else {
      const text = await chatbotService.chat(parsed.messages, parsed.pageContext, convId, userId);
      res.json({ data: { text, conversationId: convId } });
    }
  } catch (err) { next(err); }
});

export default router;
