import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { logger } from "./core/logger.js";

import authRoutes from "./routes/auth.routes.js";
import vegRoutes from "./routes/veg.routes.js";
import securityRoutes from "./routes/security.routes.js";

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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/veg", vegRoutes);
app.use("/api/security", securityRoutes);

// Global error handler (must be last)
app.use(errorMiddleware);

export { app };
