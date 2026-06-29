import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { agentService } from "../services/ai/agent.service.js";
import { AGENT_DEFINITIONS, AgentType } from "../services/ai/tools/index.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { ValidationError } from "../core/errors.js";

const router = Router();

router.use(authMiddleware);

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "model"]),
    content: z.string(),
  })).min(1),
});

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = await agentService.listAgents();
    res.json({ data: agents });
  } catch (err) { next(err); }
});

router.post("/:agentType/chat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentType } = req.params;
    if (!AGENT_DEFINITIONS[agentType as AgentType]) {
      throw new ValidationError(`Unknown agent type: ${agentType}. Valid types: ${Object.keys(AGENT_DEFINITIONS).join(", ")}`);
    }

    const parsed = chatSchema.parse(req.body);
    const stream = req.headers.accept?.includes("text/event-stream");

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const result = await agentService.chat(agentType as AgentType, parsed.messages, { stream: true });

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
      res.write(`data: [DONE]\n\n`);
      res.end();
    } else {
      const text = await agentService.chat(agentType as AgentType, parsed.messages, { stream: false });
      res.json({ data: { text } });
    }
  } catch (err) { next(err); }
});

export default router;
