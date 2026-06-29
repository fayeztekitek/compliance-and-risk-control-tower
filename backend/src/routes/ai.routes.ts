import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { llmService, ChatMessage } from "../services/ai/llm.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { ValidationError } from "../core/errors.js";

const router = Router();

router.use(authMiddleware);

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
  })).min(1),
  temperature: z.number().min(0).max(2).optional(),
  maxOutputTokens: z.number().min(1).max(8192).optional(),
});

const modelsSchema = z.object({});

/**
 * @openapi
 * /api/ai/chat:
 *   post:
 *     tags: [AI]
 *     summary: Chat with the GRC Copilot
 *     description: Sends a chat request to the LLM. If `Accept: text/event-stream` is set, returns a Server-Sent Events stream.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [messages]
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role: { type: string, enum: [user, assistant, system] }
 *                     content: { type: string }
 *               temperature: { type: number }
 *               maxOutputTokens: { type: number }
 *     responses:
 *       200:
 *         description: AI response
 */
router.post("/chat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = chatSchema.parse(req.body);
    const stream = req.headers.accept?.includes("text/event-stream");

    const messages: ChatMessage[] = parsed.messages;

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const result = await llmService.chat(messages, {
        temperature: parsed.temperature,
        maxOutputTokens: parsed.maxOutputTokens,
        stream: true,
      });

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
      res.write(`data: [DONE]\n\n`);
      res.end();
    } else {
      const text = await llmService.chat(messages, {
        temperature: parsed.temperature,
        maxOutputTokens: parsed.maxOutputTokens,
        stream: false,
      });
      res.json({ data: { text } });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/ai/models:
 *   get:
 *     tags: [AI]
 *     summary: List available AI models
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of AI models
 */
router.get("/models", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await llmService.listModels();
    res.json({ data: models });
  } catch (err) {
    next(err);
  }
});

export default router;
