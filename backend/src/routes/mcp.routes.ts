import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { mcpRegistryService } from "../services/mcp/mcpRegistry.service.js";
import { testConnectorById, syncConnectorById, testAllConnectors } from "../services/mcp/connectorFactory.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { ValidationError } from "../core/errors.js";

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  name: z.string().min(1).max(255),
  connectorType: z.enum(["sonarqube", "nexus", "veracode", "fortify", "jira", "github", "gitlab", "confluence", "slack"]),
  description: z.string().optional(),
  config: z.record(z.any()),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  config: z.record(z.any()).optional(),
  isEnabled: z.boolean().optional(),
});

// List connectors
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type as string | undefined;
    const connectors = await mcpRegistryService.list(type ? { connectorType: type } : undefined);
    res.json({ data: connectors });
  } catch (err) { next(err); }
});

// Get single connector
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const connector = await mcpRegistryService.getById(req.params.id);
    res.json({ data: connector });
  } catch (err) { next(err); }
});

// Create connector
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createSchema.parse(req.body);
    const connector = await mcpRegistryService.create(parsed);
    res.status(201).json({ data: connector });
  } catch (err) { next(err); }
});

// Update connector
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateSchema.parse(req.body);
    const connector = await mcpRegistryService.update(req.params.id, parsed);
    res.json({ data: connector });
  } catch (err) { next(err); }
});

// Delete connector
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await mcpRegistryService.delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

// Test connection
router.post("/:id/test", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await testConnectorById(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// Test all connections
router.post("/test-all", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await testAllConnectors();
    res.json({ data: results });
  } catch (err) { next(err); }
});

// Trigger sync
router.post("/:id/sync", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await syncConnectorById(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// Get webhook events for connector
router.get("/:id/webhooks", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const events = await mcpRegistryService.getWebhookEvents(req.params.id, limit);
    res.json({ data: events });
  } catch (err) { next(err); }
});

// Webhook receiver (no auth — signature verification handled per connector)
router.post("/webhook/:source", async (req: Request, res: Response) => {
  try {
    const { source } = req.params;
    const connectors = await mcpRegistryService.list({ connectorType: source as any, enabled: true });
    if (connectors.length === 0) {
      return res.status(404).json({ error: `No enabled ${source} connector found` });
    }
    const eventType = req.headers["x-event-type"] as string || req.headers["x-github-event"] as string || "unknown";
    await mcpRegistryService.logWebhookEvent(connectors[0].id, source, eventType, req.body);
    res.json({ data: { received: true } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
