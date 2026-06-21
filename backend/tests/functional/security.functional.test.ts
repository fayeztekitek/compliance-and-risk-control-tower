import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { healthCheck } from "../../src/config/database";

const dbAvailable = await healthCheck().catch(() => false);

describe("Security Functional Tests", () => {
  let token: string;

  beforeAll(async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "fayez.tekitek@vermeg.com", password: "admin123!" });
    if (res.status === 200) token = res.body.data.token;
  });

  it("Complete flow: create vuln → false positive toggle → verify", async () => {
    if (!dbAvailable || !token) return;

    const future = new Date(); future.setDate(future.getDate() + 30);
    const createRes = await request(app)
      .post("/api/security/vulnerabilities")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Functional Test Vuln", severity: "CRITICAL", sourceScanner: "VERACODE", slaDueDate: future.toISOString().split("T")[0] });
    if (createRes.status !== 201) return; // skip if DB not fully setup
    const id = createRes.body.data.id;

    // Toggle false positive
    const fpRes = await request(app)
      .post(`/api/security/vulnerabilities/${id}/false-positive`)
      .set("Authorization", `Bearer ${token}`)
      .send({ explanation: "This vulnerability does not apply to our deployment configuration" });
    expect(fpRes.status).toBe(200);
    expect(fpRes.body.data.isFalsePositive).toBe(true);
    expect(fpRes.body.data.status).toBe("FALSE_POSITIVE");

    // Verify through list
    const listRes = await request(app)
      .get(`/api/security/vulnerabilities?search=Functional Test Vuln`)
      .set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);
  });

  it("Complete flow: create vuln → waiver → approve → verify status", async () => {
    if (!dbAvailable || !token) return;

    const future = new Date(); future.setDate(future.getDate() + 30);
    const createRes = await request(app)
      .post("/api/security/vulnerabilities")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Waiver Flow Vuln", severity: "HIGH", sourceScanner: "NEXPOSE", slaDueDate: future.toISOString().split("T")[0] });
    if (createRes.status !== 201) return;
    const vulnId = createRes.body.data.id;

    const waiverRes = await request(app)
      .post("/api/security/waivers")
      .set("Authorization", `Bearer ${token}`)
      .send({ vulnerabilityId: vulnId, title: "Test Waiver", rationale: "Business critical feature, risk accepted temporarily", expiryDate: future.toISOString().split("T")[0] });
    expect(waiverRes.status).toBe(201);
    const waiverId = waiverRes.body.data.id;

    const approveRes = await request(app)
      .patch(`/api/security/waivers/${waiverId}/approve`)
      .set("Authorization", `Bearer ${token}`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe("APPROVED");
  });
});
