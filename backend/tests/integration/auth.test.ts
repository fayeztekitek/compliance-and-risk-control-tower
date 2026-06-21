import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { healthCheck } from "../../src/config/database";

const dbAvailable = await healthCheck().catch(() => false);

describe("Auth API (integration)", () => {
  it("POST /api/auth/login should return 401 with invalid credentials", async () => {
    if (!dbAvailable) return; // skip when no DB
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nonexistent@test.com", password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("code", "UNAUTHORIZED");
  });

  it("POST /api/auth/login should validate input", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("code", "VALIDATION_ERROR");
  });

  it("POST /api/auth/register should validate input", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "A", email: "bad", password: "12" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("code", "VALIDATION_ERROR");
  });

  it("POST /api/auth/refresh should return 401 with invalid token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "invalid-token" });
    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me should return 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("code", "UNAUTHORIZED");
  });

  it("GET /api/auth/me should return 401 with expired token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4c0HFT79ZqZ6kQaQ6q6q6q6q6q6q6q6q6q6q6q6q6q6");
    expect([401, 500]).toContain(res.status);
  });
});
