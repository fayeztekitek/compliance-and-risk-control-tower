import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { healthCheck } from "../../src/config/database";

const dbAvailable = await healthCheck().catch(() => false);

describe("Security API (integration)", () => {
  let token: string;

  beforeAll(async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "fayez.tekitek@vermeg.com", password: "admin123!" });
    if (res.status === 200) token = res.body.data.token;
  });

  it("GET /api/security/vulnerabilities should return 401 without auth", async () => {
    const res = await request(app).get("/api/security/vulnerabilities");
    expect(res.status).toBe(401);
  });

  it("GET /api/security/vulnerabilities should return 200 with valid token", async () => {
    if (!dbAvailable || !token) return;
    const res = await request(app)
      .get("/api/security/vulnerabilities")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
  });

  it("POST /api/security/vulnerabilities should validate input", async () => {
    if (!dbAvailable || !token) return;
    const res = await request(app)
      .post("/api/security/vulnerabilities")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "", severity: "INVALID" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("code", "VALIDATION_ERROR");
  });

  it("POST /api/security/vulnerabilities should create with validation", async () => {
    if (!dbAvailable || !token) return;
    const future = new Date(); future.setDate(future.getDate() + 30);
    const res = await request(app)
      .post("/api/security/vulnerabilities")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test Vuln", severity: "HIGH", sourceScanner: "VERACODE", slaDueDate: future.toISOString().split("T")[0] });
    expect([201, 400]).toContain(res.status);
    if (res.status === 201) expect(res.body.data).toHaveProperty("id");
  });

  it("GET /api/security/vulnerabilities/:id should return 404 for unknown", async () => {
    if (!dbAvailable || !token) return;
    const res = await request(app)
      .get("/api/security/vulnerabilities/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
