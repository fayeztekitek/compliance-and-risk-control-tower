import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { logger } from "./core/logger.js";

import authRoutes from "./routes/auth.routes.js";
import vegRoutes from "./routes/veg.routes.js";
import securityRoutes from "./routes/security.routes.js";
import projectRoutes from "./routes/project.routes.js";
import nexusRoutes from "./routes/nexus.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import exportRoutes from "./routes/export.routes.js";

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: env.CORS_ORIGIN.split(",").map(s => s.trim()),
  credentials: true,
}));

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
app.use("/api/auth", authRoutes);
app.use("/api/veg", vegRoutes);
app.use("/api/security", securityRoutes);
app.use("/api", projectRoutes);
app.use("/api/nexus", nexusRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/export", exportRoutes);

// Global error handler (must be last)
app.use(errorMiddleware);

export { app };
