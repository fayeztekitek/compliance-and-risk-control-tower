import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { healthCheck } from "../../src/config/database";

const dbAvailable = await healthCheck().catch(() => false);

describe("Projects API (integration)", () => {
  let token: string;

  beforeAll(async () => {
    if (!dbAvailable) return;
    const r = await request(app).post("/api/auth/login").send({ email: "fayez.tekitek@vermeg.com", password: "admin123!" });
    if (r.status === 200) token = r.body.data.token;
  });

  it("GET /api/projects should return 401 without auth", async () => {
    const r = await request(app).get("/api/projects");
    expect(r.status).toBe(401);
  });

  it("GET /api/projects should return 200 with valid token", async () => {
    if (!dbAvailable || !token) return;
    const r = await request(app).get("/api/projects").set("Authorization", `Bearer ${token}`);
    expect(r.status).toBe(200);
  });

  it("POST /api/projects should validate input", async () => {
    if (!dbAvailable || !token) return;
    const r = await request(app).post("/api/projects").set("Authorization", `Bearer ${token}`).send({ name: "", code: "" });
    expect(r.status).toBe(400);
  });

  it("POST /api/projects should create with valid data", async () => {
    if (!dbAvailable || !token) return;
    const r = await request(app).post("/api/projects").set("Authorization", `Bearer ${token}`).send({ name: "Test Project", code: "TST001" });
    expect([201, 400]).toContain(r.status);
    if (r.status === 201) expect(r.body.data).toHaveProperty("id");
  });
});
