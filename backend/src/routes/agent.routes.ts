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

router.get("/runs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentType = req.query.agentType as string | undefined;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const result = await agentService.getRunLogs(agentType, page, limit);
    res.json(result);
  } catch (err) { next(err); }
});

router.get("/recommendations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentType = req.query.agentType as string | undefined;
    const unreadOnly = req.query.unreadOnly === "true";
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const result = await agentService.getRecommendations(agentType, unreadOnly, page, limit);
    res.json(result);
  } catch (err) { next(err); }
});

router.post("/recommendations/:id/read", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await agentService.markRecommendationRead(req.params.id);
    res.json({ data: { success: true } });
  } catch (err) { next(err); }
});

router.post("/recommendations/:id/dismiss", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await agentService.dismissRecommendation(req.params.id);
    res.json({ data: { success: true } });
  } catch (err) { next(err); }
});

router.post("/:agentType/run", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentType } = req.params;
    if (!AGENT_DEFINITIONS[agentType as AgentType]) {
      throw new ValidationError(`Unknown agent: ${agentType}`);
    }
    const result = await agentService.runAutonomous(agentType as AgentType, "manual");
    res.json({ data: result });
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
