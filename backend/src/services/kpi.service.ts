import { nexusRepo } from "../repositories/nexus.repo.js";
import { query } from "../config/database.js";
import { riskScoreService } from "./riskScore.service.js";

export const kpiService = {
  async recalculate() {
    const products = await nexusRepo.listProducts();
    const allVulns = await nexusRepo.listVulnerabilities({ page: 1, limit: 10000 });
    let totalScore = 0;
    let redCount = 0, orangeCount = 0, greenCount = 0;

    for (const p of products) {
      const productVulns = allVulns.data.filter((v: any) => {
        const prod = products.find((pr: any) => pr.productId === p.productId);
        return prod;
      });
      const aggregates = riskScoreService.getAggregates(productVulns, p.businessCriticality);
      totalScore += aggregates.riskScore;
      if (aggregates.grade === "RED") redCount++;
      else if (aggregates.grade === "ORANGE") orangeCount++;
      else greenCount++;
    }

    const avgScore = products.length ? Math.round(totalScore / products.length) : 0;
    const total = allVulns.total;

    await query(
      `INSERT INTO nexus_kpi_snapshots (snapshot_date, global_security_risk_score, total_vulnerabilities, critical_vulnerabilities, high_vulnerabilities, new_vulnerabilities, fixed_vulnerabilities, accepted_risk_count, expired_waivers_count, products_red_count, products_orange_count, products_green_count, security_debt_score, compliance_score)
       VALUES (CURRENT_DATE, $1, $2, $3, $4, 0, 0, 0, 0, $5, $6, $7, $8, 100.00)`,
      [avgScore, total,
       allVulns.data.filter((v: any) => v.severity === "CRITICAL").length,
       allVulns.data.filter((v: any) => v.severity === "HIGH").length,
       redCount, orangeCount, greenCount,
       allVulns.data.filter((v: any) => v.status !== "Fixed" && v.status !== "False Positive").length * 4]
    );

    return { avgScore, total, redCount, orangeCount, greenCount };
  },
};
