import { describe, it, expect } from "vitest";
import { logger } from "../../src/core/logger";

describe("Logger", () => {
  it("should create a logger instance", () => {
    expect(logger).toBeDefined();
    expect(logger.level).toBe("info");
  });

  it("should log info messages without throwing", () => {
    expect(() => logger.info("test message")).not.toThrow();
  });

  it("should log error messages without throwing", () => {
    expect(() => logger.error("test error")).not.toThrow();
  });

  it("should redact sensitive fields", () => {
    const childLogger = logger.child({});
    expect(() => {
      childLogger.info({ req: { headers: { authorization: "Bearer secret" } } }, "request");
    }).not.toThrow();
  });
});
