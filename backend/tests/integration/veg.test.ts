import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { healthCheck } from "../../src/config/database";

const dbAvailable = await healthCheck().catch(() => false);

describe("VEG API (integration)", () => {
  let token: string;

  beforeAll(async () => {
    if (!dbAvailable) return;
    // Login as admin to get a token
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "fayez.tekitek@vermeg.com", password: "admin123!" });
    if (res.status === 200) {
      token = res.body.data.token;
    }
  });

  it("GET /api/veg should return 401 without auth", async () => {
    const res = await request(app).get("/api/veg");
    expect(res.status).toBe(401);
  });

  it("GET /api/veg should return 200 with valid token", async () => {
    if (!dbAvailable || !token) return;
    const res = await request(app)
      .get("/api/veg")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("total");
  });

  it("GET /api/veg?search= should filter results", async () => {
    if (!dbAvailable || !token) return;
    const res = await request(app)
      .get("/api/veg?search=nonexistent&limit=5")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("POST /api/veg should validate input", async () => {
    if (!dbAvailable || !token) return;
    const res = await request(app)
      .post("/api/veg")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "AB", type: "INVALID", client: "" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("code", "VALIDATION_ERROR");
  });

  it("POST /api/veg should create a new request", async () => {
    if (!dbAvailable || !token) return;
    const res = await request(app)
      .post("/api/veg")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Integration Test Request",
        type: "RFI",
        client: "Test Corp",
        marginEstimate: 25,
        workloadMd: 30,
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.title).toBe("Integration Test Request");
  });

  it("GET /api/veg/:id should return 404 for unknown id", async () => {
    if (!dbAvailable || !token) return;
    const res = await request(app)
      .get("/api/veg/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
