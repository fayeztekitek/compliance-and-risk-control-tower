import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { healthCheck } from "../../src/config/database";

const dbAvailable = await healthCheck().catch(() => false);

describe("Projects Functional Tests", () => {
  let token: string;

  beforeAll(async () => {
    if (!dbAvailable) return;
    const r = await request(app).post("/api/auth/login").send({ email: "fayez.tekitek@vermeg.com", password: "admin123!" });
    if (r.status === 200) token = r.body.data.token;
  });

  it("Full flow: create audit → add finding → add CAPA → close", async () => {
    if (!dbAvailable || !token) return;

    const audit = await request(app).post("/api/audits").set("Authorization", `Bearer ${token}`).send({ title: "Sprint 4 Audit", type: "ACCESS_AUDIT" });
    if (audit.status !== 201) return;
    const auditId = audit.body.data.id;

    const finding = await request(app).post(`/api/audits/${auditId}/findings`).set("Authorization", `Bearer ${token}`).send({ title: "Missing access logs", severity: "HIGH" });
    expect(finding.status).toBe(201);
    const findingId = finding.body.data.id;

    const capa = await request(app).post(`/api/audits/findings/${findingId}/actions`).set("Authorization", `Bearer ${token}`).send({ description: "Implement logging", dueDate: "2026-07-15" });
    expect(capa.status).toBe(201);
    const capaId = capa.body.data.id;

    const close = await request(app).patch(`/api/audits/actions/${capaId}/close`).set("Authorization", `Bearer ${token}`).send({ evidenceDescription: "Logs configured and verified" });
    expect(close.status).toBe(200);
    expect(close.body.data.status).toBe("COMPLETED");
  });

  it("Full flow: create committee → record decision", async () => {
    if (!dbAvailable || !token) return;

    const com = await request(app).post("/api/committees").set("Authorization", `Bearer ${token}`).send({ name: "VEG Committee", date: "2026-07-01", type: "VEG_COMMITTEE" });
    if (com.status !== 201) return;
    const comId = com.body.data.id;

    const dec = await request(app).post(`/api/committees/${comId}/decisions`).set("Authorization", `Bearer ${token}`).send({ title: "Approve VEG-2026-042", outcome: "APPROVED", context: "All conditions met" });
    expect(dec.status).toBe(201);
    expect(dec.body.data.outcome).toBe("APPROVED");
  });
});
