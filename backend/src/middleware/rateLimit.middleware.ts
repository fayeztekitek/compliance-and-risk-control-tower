import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests", code: "RATE_LIMITED" },
});

export const authLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth requests", code: "RATE_LIMITED" },
});
