import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { generalLimiter, authLimiter } from "./middleware/rateLimit.middleware.js";
import { logger } from "./core/logger.js";

// Patch Express to forward async route rejections to error middleware
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

const app = express();

// Security headers
app.use(helmet());

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

// Global error handler (must be last)
app.use(errorMiddleware);

export { app };
