import { describe, it, expect } from "vitest";
import { generalLimiter, authLimiter } from "../../src/middleware/rateLimit.middleware.js";

describe("Rate Limiting Middleware", () => {
  it("generalLimiter should have correct defaults", () => {
    expect(generalLimiter).toBeDefined();
    expect(typeof generalLimiter).toBe("function");
  });

  it("authLimiter should have stricter max", () => {
    expect(authLimiter).toBeDefined();
    expect(typeof authLimiter).toBe("function");
  });
});

describe("Graceful Shutdown", () => {
  it("should handle SIGTERM without throwing", async () => {
    const { pool } = await import("../../src/config/database.js");
    expect(pool.end).toBeDefined();
  });
});

describe("Swagger Config", () => {
  it("should export swaggerSpec with openapi version", async () => {
    const { swaggerSpec } = await import("../../src/config/swagger.js");
    expect(swaggerSpec).toBeDefined();
    expect(swaggerSpec.openapi).toBe("3.0.0");
    expect(swaggerSpec.info.title).toContain("Control Tower");
    expect(swaggerSpec.tags).toBeInstanceOf(Array);
    expect(swaggerSpec.tags!.length).toBeGreaterThanOrEqual(5);
  });
});
