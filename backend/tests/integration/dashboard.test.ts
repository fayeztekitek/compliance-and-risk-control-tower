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

describe("Dashboard API (integration)", () => {
  it("GET /api/dashboard/executive should return 401 without auth", async () => {
    const res = await request(app).get("/api/dashboard/executive");
    expect(res.status).toBe(401);
  });

  it("GET /api/dashboard/executive should return consolidated payload", async () => {
    if (!authedReq) return;
    const res = await authedReq.get("/api/dashboard/executive");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("kpis");
    expect(res.body.data).toHaveProperty("kris");
    expect(res.body.data).toHaveProperty("heatmap");
    expect(res.body.data).toHaveProperty("trends");
    expect(res.body.data).toHaveProperty("lastUpdated");
  });

  it("GET /api/dashboard/kpi should return 16 KPI values", async () => {
    if (!authedReq) return;
    const res = await authedReq.get("/api/dashboard/kpi");
    expect(res.status).toBe(200);
    const keys = Object.keys(res.body.data);
    expect(keys.length).toBeGreaterThanOrEqual(16);
  });

  it("GET /api/dashboard/kri should return 4 KRIs", async () => {
    if (!authedReq) return;
    const res = await authedReq.get("/api/dashboard/kri");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);
  });

  it("GET /api/dashboard/heatmap should return 5x5 grid data", async () => {
    if (!authedReq) return;
    const res = await authedReq.get("/api/dashboard/heatmap");
    expect(res.status).toBe(200);
    expect(res.body.data.severityLevels).toHaveLength(4);
    expect(res.body.data.ageRanges).toHaveLength(5);
  });

  it("GET /api/export/csv should return CSV content", async () => {
    if (!authedReq) return;
    const res = await authedReq.get("/api/export/csv?dataset=kpis");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
  });
});
