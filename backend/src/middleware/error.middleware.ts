import { Request, Response, NextFunction } from "express";
import { AppError } from "../core/errors.js";
import { logger } from "../core/logger.js";

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn({ err, code: err.code }, "Application error");
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
    return;
  }

  logger.error({ err }, "Unhandled internal error");
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
