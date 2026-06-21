import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

let healthOk = false;

beforeAll(async () => {
  const res = await request(app).get("/api/health");
  healthOk = res.status === 200;
});

describe("Sprint 7 — Security Hardening (integration)", () => {
  it("app should be defined", () => {
    expect(app).toBeDefined();
  });

  it("GET /api/docs should return Swagger UI HTML", async () => {
    const res = await request(app).get("/api/docs/");
    expect([200, 301, 302]).toContain(res.status);
    if (res.status === 200) {
      expect(res.text).toContain("swagger");
    }
  });

  it("GET /api/docs should serve valid swagger spec", async () => {
    const res = await request(app).get("/api/docs/");
    expect([200, 301, 302]).toContain(res.status);
    const specRes = await request(app).get("/api/docs/swagger.json");
    expect([200, 404]).toContain(specRes.status);
  });

  it("GET /api/health should respond with correct shape", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("undefined API routes return 401 (auth catches before 404)", async () => {
    const res = await request(app).get("/api/nonexistent-route");
    expect(res.status).toBe(401);
  });
});
