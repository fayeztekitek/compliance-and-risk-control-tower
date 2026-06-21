import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { healthCheck } from "../../src/config/database";

const dbAvailable = await healthCheck().catch(() => false);

describe("VEG Functional Tests", () => {
  let token: string;

  beforeAll(async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "fayez.tekitek@vermeg.com", password: "admin123!" });
    if (res.status === 200) token = res.body.data.token;
  });

  it("Complete flow: create → view → sign-off → approve → bid → go", async () => {
    if (!dbAvailable || !token) return;

    // 1. Create
    const createRes = await request(app)
      .post("/api/veg")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Functional Test", type: "RFP", client: "Test Client", marginEstimate: 30, workloadMd: 45 });
    expect(createRes.status).toBe(201);
    const id = createRes.body.data.id;

    // 2. View by id
    const getRes = await request(app)
      .get(`/api/veg/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(id);

    // 3. Submit (status transition)
    const submitRes = await request(app)
      .patch(`/api/veg/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "SUBMITTED" });
    expect(submitRes.status).toBe(200);

    // 4. Department sign-offs
    const signoffFinance = await request(app)
      .patch(`/api/veg/${id}/signoff/finance`)
      .set("Authorization", `Bearer ${token}`)
      .send({ state: "APPROVED" });
    expect(signoffFinance.status).toBe(200);

    const signoffSales = await request(app)
      .patch(`/api/veg/${id}/signoff/sales`)
      .set("Authorization", `Bearer ${token}`)
      .send({ state: "APPROVED" });
    expect(signoffSales.status).toBe(200);

    const signoffProduct = await request(app)
      .patch(`/api/veg/${id}/signoff/product`)
      .set("Authorization", `Bearer ${token}`)
      .send({ state: "APPROVED" });
    expect(signoffProduct.status).toBe(200);

    const signoffLegal = await request(app)
      .patch(`/api/veg/${id}/signoff/legal`)
      .set("Authorization", `Bearer ${token}`)
      .send({ state: "APPROVED" });
    // After all 4 approved, status should auto-transition to APPROVED
    expect(signoffLegal.status).toBe(200);

    // 5. Check status is now APPROVED
    const checkRes = await request(app)
      .get(`/api/veg/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(checkRes.body.data.status).toBe("APPROVED");

    // 6. Bid decision
    const bidRes = await request(app)
      .patch(`/api/veg/${id}/bid`)
      .set("Authorization", `Bearer ${token}`)
      .send({ decision: "BID" });
    expect(bidRes.status).toBe(200);
    expect(bidRes.body.data.bidDecision).toBe("BID");

    // 7. Go/No-Go
    const goRes = await request(app)
      .patch(`/api/veg/${id}/gonogo`)
      .set("Authorization", `Bearer ${token}`)
      .send({ decision: "GO" });
    expect(goRes.status).toBe(200);
    expect(goRes.body.data.goNoGoDecision).toBe("GO");

    // 8. Create opportunity
    const oppRes = await request(app)
      .post(`/api/veg/${id}/opportunities`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Opp", value: 50000, salesStage: "QUALIFICATION" });
    expect(oppRes.status).toBe(201);
    const oppId = oppRes.body.data.id;

    // 9. Create contract under opportunity
    const contractRes = await request(app)
      .post(`/api/veg/opportunities/${oppId}/contracts`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Contract",
        startDate: "2025-06-01",
        endDate: "2026-06-01",
        slaCommitments: "99.9% uptime",
      });
    expect(contractRes.status).toBe(201);
    expect(contractRes.body.data.title).toBe("Test Contract");

    // 10. Delete
    const delRes = await request(app)
      .delete(`/api/veg/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(delRes.status).toBe(200);
  });
});
