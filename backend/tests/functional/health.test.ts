import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app";

describe("Health Check (functional)", () => {
  it("GET /api/health should return 200 with status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("GET /api/health should return valid ISO timestamp", async () => {
    const res = await request(app).get("/api/health");
    const timestamp = new Date(res.body.timestamp);
    expect(timestamp.toISOString()).toBe(res.body.timestamp);
  });

  it("GET /api/health should respond within 100ms", async () => {
    const start = Date.now();
    await request(app).get("/api/health");
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
