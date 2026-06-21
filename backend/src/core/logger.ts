import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === "development"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
  redact: {
    paths: ["req.headers.authorization", "req.body.password", "req.body.token"],
    censor: "***",
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      correlationId: req.correlationId,
      user: req.user?.id,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});
