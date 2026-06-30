import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { copilotService, COPILOT_DEFINITIONS, CopilotType } from "../services/ai/copilots/index.js";
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

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: copilotService.list() });
  } catch (err) { next(err); }
});

router.post("/:type/chat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    if (!COPILOT_DEFINITIONS[type as CopilotType]) {
      throw new ValidationError(`Unknown copilot: ${type}. Valid: ${Object.keys(COPILOT_DEFINITIONS).join(", ")}`);
    }

    const parsed = chatSchema.parse(req.body);
    const stream = req.headers.accept?.includes("text/event-stream");

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const result = await copilotService.chat(type as CopilotType, parsed.messages, {
        temperature: parsed.temperature,
        maxOutputTokens: parsed.maxOutputTokens,
        stream: true,
      });

      for await (const chunk of result) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write(`data: [DONE]\n\n`);
      res.end();
    } else {
      const text = await copilotService.chat(type as CopilotType, parsed.messages, {
        temperature: parsed.temperature,
        maxOutputTokens: parsed.maxOutputTokens,
      });
      res.json({ data: { text } });
    }
  } catch (err) { next(err); }
});

export default router;
