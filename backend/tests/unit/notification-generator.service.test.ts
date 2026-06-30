import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();
vi.mock("../../src/config/database.js", () => ({ query: mockQuery }));

describe("Notification Generator", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("overdueMilestones should create notifications for overdue milestones", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: "m1", name: "Phase 1 Complete", project_name: "Project A", project_id: "p1", responsible: "user1" },
        { id: "m2", name: "Phase 2 Complete", project_name: "Project B", project_id: "p2", responsible: "user1" },
      ],
    });
    // Each milestone triggers one INSERT notification
    mockQuery.mockResolvedValue({ rows: [] });

    const { notificationGenerator } = await import("../../src/services/notification-generator.service.js");
    const result = await notificationGenerator.overdueMilestones();

    expect(result).toBe(2);
    expect(mockQuery).toHaveBeenCalledTimes(3); // 1 SELECT + 2 INSERTs
  });

  it("overdueMilestones should skip milestones with no responsible person", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: "m1", name: "Phase 1", project_name: "Project A", project_id: "p1", responsible: null },
      ],
    });

    const { notificationGenerator } = await import("../../src/services/notification-generator.service.js");
    const result = await notificationGenerator.overdueMilestones();

    expect(result).toBe(0);
    expect(mockQuery).toHaveBeenCalledTimes(1); // only SELECT, no INSERTs
  });

  it("criticalRagProjects should create notifications for RED RAG projects", async () => {
    // First query: find RED RAG projects
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: "p1", name: "Project A", responsible: "user1", rag_risk: "RED" },
      ],
    });
    // Second query: find team members
    mockQuery.mockResolvedValueOnce({ rows: [{ user_id: "user2" }, { user_id: "user3" }] });
    // 3 INSERTs (for user1, user2, user3)
    mockQuery.mockResolvedValue({ rows: [] });

    const { notificationGenerator } = await import("../../src/services/notification-generator.service.js");
    const result = await notificationGenerator.criticalRagProjects();

    expect(result).toBe(3);
  });

  it("criticalRagProjects should handle projects with no team", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: "p1", name: "Project A", responsible: "user1", rag_risk: "RED" },
      ],
    });
    // No team members
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValue({ rows: [] });

    const { notificationGenerator } = await import("../../src/services/notification-generator.service.js");
    const result = await notificationGenerator.criticalRagProjects();

    expect(result).toBe(1); // just the responsible person
  });

  it("upcomingSteerco should create notifications for meetings in next 7 days", async () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: "sm1", title: "SteerCo Q1", meeting_date: futureDate, project_id: "p1", responsible: "user1" },
      ],
    });
    mockQuery.mockResolvedValue({ rows: [] });

    const { notificationGenerator } = await import("../../src/services/notification-generator.service.js");
    const result = await notificationGenerator.upcomingSteerco();

    expect(result).toBe(1);
  });

  it("missingSnapshots should notify for roadmaps without recent snapshot", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: "r1", name: "Roadmap 2025", responsible: "user1" },
      ],
    });
    mockQuery.mockResolvedValue({ rows: [] });

    const { notificationGenerator } = await import("../../src/services/notification-generator.service.js");
    const result = await notificationGenerator.missingSnapshots();

    expect(result).toBe(1);
  });

  it("expiringWaivers should notify for waivers expiring within 14 days", async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: "f1", title: "CVE-2024-1234", due_date: futureDate, assigned_to: "user1" },
      ],
    });
    mockQuery.mockResolvedValue({ rows: [] });

    const { notificationGenerator } = await import("../../src/services/notification-generator.service.js");
    const result = await notificationGenerator.expiringWaivers();

    expect(result).toBe(1);
  });

  it("generateAll should run all generators and return counts", async () => {
    // Mock all 6 generators to return counts
    mockQuery.mockResolvedValue({ rows: [] });

    const { notificationGenerator } = await import("../../src/services/notification-generator.service.js");
    const result = await notificationGenerator.generateAll();

    expect(result).toHaveProperty("created");
    expect(result).toHaveProperty("errors");
    expect(Array.isArray(result.errors)).toBe(true);
    // All generators ran (returned 0 each since no data)
    expect(result.created).toBe(0);
  });
});
