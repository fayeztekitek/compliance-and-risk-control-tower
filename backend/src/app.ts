import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { correlationMiddleware } from "./middleware/correlation.middleware.js";
import { generalLimiter, authLimiter } from "./middleware/rateLimit.middleware.js";
import { logger } from "./core/logger.js";

// Patch Express to forward async route rejections to error middleware
// @ts-expect-error - express/lib/router/layer.js has no type declarations
import Layer from "express/lib/router/layer.js";
const origHandle = Layer.prototype.handle_request;
Layer.prototype.handle_request = function (this: any, req: any, res: any, next: any) {
  const result = origHandle.call(this, req, res, next);
  if (result instanceof Promise) result.catch(next);
  return result;
};

import authRoutes from "./routes/auth.routes.js";
import vegRoutes from "./routes/veg.routes.js";
import vegDealRoutes from "./routes/veg-deal.routes.js";
import securityRoutes from "./routes/security.routes.js";
import projectRoutes from "./routes/project.routes.js";
import nexusRoutes from "./routes/nexus.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import dashboardPagesRoutes from "./routes/dashboardPages.routes.js";
import exportRoutes from "./routes/export.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import committeeRoutes from "./routes/committee.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import unifiedFindingRoutes from "./routes/unifiedFinding.routes.js";
import enrichmentRoutes from "./routes/enrichment.routes.js";
import organizationRoutes from "./routes/organization.routes.js";
import findingComponentRoutes from "./routes/findingComponent.routes.js";
import findingOccurrenceRoutes from "./routes/findingOccurrence.routes.js";
import scanReportRoutes from "./routes/scanReport.routes.js";
import reportRoutes from "./routes/report.routes.js";
import trendRoutes from "./routes/trend.routes.js";
import mitigationRoutes from "./routes/mitigation.routes.js";
import policyRuleRoutes from "./routes/policyRule.routes.js";
import complianceRoutes from "./routes/compliance.routes.js";
import archiveRoutes from "./routes/archive.routes.js";
import alertRoutes from "./routes/alert.routes.js";
import queueRoutes from "./routes/queue.routes.js";
import fortifyRoutes from "./routes/fortify.routes.js";
import sonarqubeRoutes from "./routes/sonarqube.routes.js";
import veracodeRoutes from "./routes/veracode.routes.js";
import searchRoutes from "./routes/search.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import engineReportRoutes from "./routes/engine-report.routes.js";
import complianceDashboardRoutes from "./routes/compliance-dashboard.routes.js";
import riskDashboardRoutes from "./routes/risk-dashboard.routes.js";
import auditDashboardRoutes from "./routes/audit-dashboard.routes.js";
import committeesDashboardRoutes from "./routes/committees-dashboard.routes.js";
import saasDashboardRoutes from "./routes/saas-dashboard.routes.js";
import roadmapsDashboardRoutes from "./routes/roadmaps-dashboard.routes.js";
import projectsDashboardRoutes from "./routes/projects-dashboard.routes.js";
import projectsExecutiveDashboardRoutes from "./routes/projects-executive-dashboard.routes.js";
import roadmapMonitoringRoutes from "./routes/roadmap-monitoring.routes.js";
import roadmapExecutiveDashboardRoutes from "./routes/roadmap-executive-dashboard.routes.js";
import snapshotRoutes from "./routes/snapshot.routes.js";
import traceabilityRoutes from "./routes/traceability.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import promptLibraryRoutes from "./routes/promptLibrary.routes.js";
import agentRoutes from "./routes/agent.routes.js";
import copilotRoutes from "./routes/copilot.routes.js";
import knowledgeBaseRoutes from "./routes/knowledgeBase.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import mcpRoutes from "./routes/mcp.routes.js";
import ragRoutes from "./routes/rag.routes.js";
import pipelineRoutes from "./routes/pipeline.routes.js";

const app = express();

// Security headers
app.use(helmet());

// Correlation ID
app.use(correlationMiddleware);

// CORS
app.use(cors({
  origin: env.CORS_ORIGIN.split(",").map(s => s.trim()),
  credentials: true,
}));

// Rate limiting
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.info({ req }, `${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Control Tower API Docs",
}));

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/veg", vegRoutes);
app.use("/api/veg-deals", vegDealRoutes);
app.use("/api/security", securityRoutes);
app.use("/api", projectRoutes);
app.use("/api/nexus", nexusRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/dashboard-pages", dashboardPagesRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/audits", auditRoutes);
app.use("/api/committees", committeeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/unified-findings", unifiedFindingRoutes);
app.use("/api", enrichmentRoutes);
app.use("/api", organizationRoutes);
app.use("/api/finding-components", findingComponentRoutes);
app.use("/api/finding-occurrences", findingOccurrenceRoutes);
app.use("/api/scan-reports", scanReportRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/trends", trendRoutes);
app.use("/api/mitigations", mitigationRoutes);
app.use("/api/policy-rules", policyRuleRoutes);
app.use("/api/compliance", complianceRoutes);
app.use("/api/fortify", fortifyRoutes);
app.use("/api/sonarqube", sonarqubeRoutes);
app.use("/api/veracode", veracodeRoutes);
app.use("/api/archive", archiveRoutes);
app.use("/api/alert-rules", alertRoutes);
app.use("/api/admin/queues", queueRoutes);
app.use("/api", searchRoutes);
app.use("/api", notificationRoutes);
app.use("/api", engineReportRoutes);
app.use("/api", complianceDashboardRoutes);
app.use("/api", riskDashboardRoutes);
app.use("/api", auditDashboardRoutes);
app.use("/api", committeesDashboardRoutes);
app.use("/api", saasDashboardRoutes);
app.use("/api", roadmapsDashboardRoutes);
app.use("/api", projectsDashboardRoutes);
app.use("/api", projectsExecutiveDashboardRoutes);
app.use("/api", roadmapMonitoringRoutes);
app.use("/api", roadmapExecutiveDashboardRoutes);
app.use("/api", snapshotRoutes);
app.use("/api", traceabilityRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/prompts", promptLibraryRoutes);
app.use("/api/ai/agents", agentRoutes);
app.use("/api/ai/copilots", copilotRoutes);
app.use("/api/knowledge-base", knowledgeBaseRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/mcp", mcpRoutes);
app.use("/api/rag", ragRoutes);
app.use("/api/pipelines", pipelineRoutes);

// Global error handler (must be last)
app.use(errorMiddleware);

export { app };
