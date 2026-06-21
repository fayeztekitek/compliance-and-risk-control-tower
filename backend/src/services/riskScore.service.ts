export const riskScoreService = {
  calculate(vuln: any, productCriticality: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"): number {
    let score = 0;
    score += (vuln.cvssScore ?? 0) * 4;

    if (vuln.severity === "CRITICAL") score += 15;
    else if (vuln.severity === "HIGH") score += 10;
    else if (vuln.severity === "MEDIUM") score += 5;
    else score += 2;

    if (vuln.reachable === "REACHABLE") score += 15;
    else if (vuln.reachable === "UNKNOWN") score += 5;

    if (vuln.exploitability === "EASY") score += 10;
    else if (vuln.exploitability === "MEDIUM") score += 6;
    else if (vuln.exploitability === "HARD") score += 3;

    if ((vuln.ageInDays ?? 0) > 90) score += 10;
    else if ((vuln.ageInDays ?? 0) > 30) score += 5;
    else score += 2;

    if (productCriticality === "CRITICAL") score += 10;
    else if (productCriticality === "HIGH") score += 7;
    else if (productCriticality === "MEDIUM") score += 4;
    else score += 1;

    if (vuln.status === "Waived") score -= 15;
    else if (vuln.status === "Accepted") score -= 10;

    if (vuln.fixAvailable && vuln.status === "Open") score += 10;

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
      criticalCount: vulnerabilities.filter(v => v.severity === "CRITICAL").length,
      highCount: vulnerabilities.filter(v => v.severity === "HIGH").length,
      mediumCount: vulnerabilities.filter(v => v.severity === "MEDIUM").length,
      lowCount: vulnerabilities.filter(v => v.severity === "LOW").length,
      securityDebt: vulnerabilities.filter(v => v.status !== "Fixed" && v.status !== "False Positive").length * 4,
      compliancePercentage: vulnerabilities.length ? Math.round((vulnerabilities.filter(v => v.status === "Fixed" || v.status === "False Positive").length / vulnerabilities.length) * 100) : 100,
      mttrDays: vulnerabilities.filter(v => v.status === "Fixed").length
        ? Math.round(vulnerabilities.filter(v => v.status === "Fixed").reduce((sum, v) => sum + (v.ageInDays ?? 0), 0) / vulnerabilities.filter(v => v.status === "Fixed").length)
        : 0,
      fixVelocityPercentage: vulnerabilities.length ? Math.round((vulnerabilities.filter(v => v.fixAvailable).length / vulnerabilities.length) * 100) : 0,
      activeWaiversCount: vulnerabilities.filter(v => v.status === "Waived").length,
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
