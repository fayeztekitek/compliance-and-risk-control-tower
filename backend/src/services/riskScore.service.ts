export const riskScoreService = {
  calculate(vuln: any, productCriticality: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"): number {
    let score = 0;

    // CVSS (weight ×2.5, max 25)
    score += Math.min(25, (vuln.cvssScore ?? 0) * 2.5);

    // EPSS (weight ×30, max 30) — placeholder until enrichment is wired
    score += Math.min(30, (vuln.epssScore ?? 0) * 30);

    // CISA KEV (binary 15)
    if (vuln.cisaKev) score += 15;

    // Severity-based floor
    if (vuln.unifiedSeverity === "CRITICAL") score += 5;
    else if (vuln.unifiedSeverity === "HIGH") score += 3;
    else if (vuln.unifiedSeverity === "MEDIUM") score += 1;

    // Reachability (max 10)
    if (vuln.reachability === "REACHABLE") score += 10;
    else if (vuln.reachability === "UNKNOWN") score += 3;

    // Business criticality (max 8)
    if (productCriticality === "CRITICAL") score += 8;
    else if (productCriticality === "HIGH") score += 5;
    else if (productCriticality === "MEDIUM") score += 2;

    // Age linear gradient (capped at 7)
    score += Math.min(7, Math.floor((vuln.ageInDays ?? 0) / 10));

    // Fix available = small rebate (max -5)
    if (vuln.fixAvailable) score -= 5;

    // Waived/Accepted discount
    if (vuln.status === "WAIVED" || vuln.status === "ACCEPTED") score -= 15;

    return Math.min(100, Math.max(0, Math.round(score)));
  },

  getProductGrade(score: number): "RED" | "ORANGE" | "GREEN" {
    if (score >= 70) return "RED";
    if (score >= 40) return "ORANGE";
    return "GREEN";
  },

  getAggregates(vulnerabilities: any[], productCriticality: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW") {
    const scores = vulnerabilities.map(v => this.calculate(v, productCriticality));
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const grade = this.getProductGrade(avgScore);
    return {
      riskScore: avgScore,
      grade,
      criticalCount: vulnerabilities.filter(v => v.unifiedSeverity === "CRITICAL").length,
      highCount: vulnerabilities.filter(v => v.unifiedSeverity === "HIGH").length,
      mediumCount: vulnerabilities.filter(v => v.unifiedSeverity === "MEDIUM").length,
      lowCount: vulnerabilities.filter(v => v.unifiedSeverity === "LOW").length,
      securityDebt: vulnerabilities.filter(v => v.status !== "FIXED" && v.status !== "FALSE_POSITIVE").length * 4,
      compliancePercentage: vulnerabilities.length
        ? Math.round((vulnerabilities.filter(v => v.status === "FIXED" || v.status === "FALSE_POSITIVE").length / vulnerabilities.length) * 100)
        : 100,
      mttrDays: vulnerabilities.filter(v => v.status === "FIXED").length
        ? Math.round(vulnerabilities.filter(v => v.status === "FIXED").reduce((sum, v) => sum + (v.ageInDays ?? 0), 0) / vulnerabilities.filter(v => v.status === "FIXED").length)
        : 0,
      fixVelocityPercentage: vulnerabilities.length
        ? Math.round((vulnerabilities.filter(v => v.fixAvailable).length / vulnerabilities.length) * 100)
        : 0,
      activeWaiversCount: vulnerabilities.filter(v => v.status === "WAIVED").length,
      agingStats: {
        under30: vulnerabilities.filter(v => (v.ageInDays ?? 0) <= 30).length,
        "30to60": vulnerabilities.filter(v => (v.ageInDays ?? 0) > 30 && (v.ageInDays ?? 0) <= 60).length,
        "60to90": vulnerabilities.filter(v => (v.ageInDays ?? 0) > 60 && (v.ageInDays ?? 0) <= 90).length,
        "90to180": vulnerabilities.filter(v => (v.ageInDays ?? 0) > 90 && (v.ageInDays ?? 0) <= 180).length,
        over180: vulnerabilities.filter(v => (v.ageInDays ?? 0) > 180).length,
      },
    };
  },
};
