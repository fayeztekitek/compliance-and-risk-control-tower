import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { healthCheck } from "../../src/config/database.js";

let authedReq: any;

beforeAll(async () => {
  const dbOk = await healthCheck();
  if (!dbOk) return;

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "fayez.tekitek@vermeg.com", password: "admin123!" });

  const token = loginRes.body.data?.accessToken;
  if (token) {
    authedReq = request.agent(app);
    authedReq.set("Authorization", `Bearer ${token}`);
  }
});

describe("Nexus API (integration)", () => {
  it("GET /api/nexus/products should return 401 without auth", async () => {
    const res = await request(app).get("/api/nexus/products");
    expect(res.status).toBe(401);
  });

  it("GET /api/nexus/products should return 200 with valid token", async () => {
    if (!authedReq) return;
    const res = await authedReq.get("/api/nexus/products");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
  });

  it("GET /api/nexus/config should return config or null", async () => {
    if (!authedReq) return;
    const res = await authedReq.get("/api/nexus/config");
    expect(res.status).toBe(200);
  });

  it("POST /api/nexus/config/test should test connection", async () => {
    if (!authedReq) return;
    const res = await authedReq.post("/api/nexus/config/test");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("success");
  });

  it("GET /api/nexus/vulnerabilities should return paginated list", async () => {
    if (!authedReq) return;
    const res = await authedReq.get("/api/nexus/vulnerabilities?page=1&limit=10");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("total");
  });

  it("GET /api/nexus/kpis/executive should return KPI payload", async () => {
    if (!authedReq) return;
    const res = await authedReq.get("/api/nexus/kpis/executive");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });
});
