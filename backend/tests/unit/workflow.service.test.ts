import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();
vi.mock("../../src/config/database.js", () => ({ query: mockQuery }));

const MOCK_DEFINITION = {
  id: "wd1", name: "Test Workflow", description: null,
  entity_type: "test", states: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"],
  initial_state: "DRAFT",
  transitions: [
    { from: "DRAFT", to: "SUBMITTED", allowed_roles: ["ADMIN"], label: "Submit" },
    { from: "SUBMITTED", to: "APPROVED", allowed_roles: ["ADMIN", "RISK_MANAGER"], label: "Approve" },
    { from: "SUBMITTED", to: "REJECTED", allowed_roles: ["ADMIN", "RISK_MANAGER"], label: "Reject" },
  ],
  active: true, created_at: "2025-01-01T00:00:00Z",
};

const MOCK_INSTANCE_ROW = {
  id: "wi1", definition_id: "wd1", entity_id: "e1", entity_type: "test",
  current_state: "DRAFT", status: "ACTIVE", assignee: "user1", due_date: null,
  metadata: {}, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z",
  definition_name: "Test Workflow", states: MOCK_DEFINITION.states,
  transitions: MOCK_DEFINITION.transitions,
};

describe("Workflow Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("listDefinitions should return mapped definitions", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_DEFINITION] });
    const { workflowService } = await import("../../src/services/workflow.service.js");
    const defs = await workflowService.listDefinitions();

    expect(defs).toHaveLength(1);
    const d = defs[0];
    expect(d.id).toBe("wd1");
    expect(d.entityType).toBe("test");
    expect(d.initialState).toBe("DRAFT");
    expect(d.transitions).toHaveLength(3);
  });

  it("startInstance should create instance and log audit entry", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [MOCK_DEFINITION] })  // fetch definition
      .mockResolvedValueOnce({ rows: [{ id: "wi1", ...MOCK_INSTANCE_ROW }] })  // INSERT instance
      .mockResolvedValueOnce({ rows: [] })  // INSERT audit log
      .mockResolvedValueOnce({ rows: [MOCK_INSTANCE_ROW] });  // getInstance fetch

    const { workflowService } = await import("../../src/services/workflow.service.js");
    const instance = await workflowService.startInstance("wd1", "e1", "test", "user1");

    expect(instance).toBeDefined();
    expect(instance.currentState).toBe("DRAFT");
    expect(mockQuery).toHaveBeenCalledTimes(4);
  });

  it("transition should move to valid next state", async () => {
    const beforeRow = { ...MOCK_INSTANCE_ROW, current_state: "DRAFT" };
    const afterRow = { ...MOCK_INSTANCE_ROW, current_state: "SUBMITTED" };

    mockQuery
      .mockResolvedValueOnce({ rows: [beforeRow] })  // getInstance query 1 (snapshot)
      .mockResolvedValueOnce({ rows: [] })            // getInstance query 2 (items — none here since no items)
      .mockResolvedValueOnce({ rows: [] })            // UPDATE
      .mockResolvedValueOnce({ rows: [] })            // INSERT audit log
      .mockResolvedValueOnce({ rows: [afterRow] });   // getInstance after transition

    // getInstance does two queries: SELECT from workflow_instances JOIN, then no items query
    // Actually getInstance only does 1 query (JOIN). Let me fix: it returns row with states and transitions
    mockQuery.mockReset();

    // Re-mock properly
    mockQuery.mockResolvedValueOnce({ rows: [{ ...MOCK_INSTANCE_ROW, current_state: "DRAFT" }] })
      .mockResolvedValueOnce({ rows: [] })   // UPDATE
      .mockResolvedValueOnce({ rows: [] })   // INSERT audit log
      .mockResolvedValueOnce({ rows: [{ ...MOCK_INSTANCE_ROW, current_state: "SUBMITTED" }] });

    const { workflowService } = await import("../../src/services/workflow.service.js");
    const result = await workflowService.transition("wi1", "SUBMITTED", "admin");

    expect(result.currentState).toBe("SUBMITTED");
  });

  it("transition should throw on invalid state transition", async () => {
    mockQuery.mockReset();
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...MOCK_INSTANCE_ROW, current_state: "DRAFT" }],
    });

    const { workflowService } = await import("../../src/services/workflow.service.js");
    await expect(workflowService.transition("wi1", "APPROVED", "admin"))
      .rejects.toThrow(/Invalid transition/);
  });

  it("transition should throw when instance is not ACTIVE", async () => {
    mockQuery.mockReset();
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...MOCK_INSTANCE_ROW, current_state: "DRAFT", status: "COMPLETED" }],
    });

    const { workflowService } = await import("../../src/services/workflow.service.js");
    await expect(workflowService.transition("wi1", "SUBMITTED", "admin"))
      .rejects.toThrow("Workflow is not active");
  });

  it("transition should throw when instance not found", async () => {
    mockQuery.mockReset();
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const { workflowService } = await import("../../src/services/workflow.service.js");
    await expect(workflowService.transition("nonexistent", "SUBMITTED"))
      .rejects.toThrow("Workflow instance not found");
  });

  it("getAvailableTransitions should return transitions from current state", async () => {
    mockQuery.mockReset();
    mockQuery.mockResolvedValueOnce({ rows: [{ transitions: MOCK_DEFINITION.transitions }] });

    const { workflowService } = await import("../../src/services/workflow.service.js");
    const transitions = await workflowService.getAvailableTransitions("wd1", "DRAFT");

    expect(transitions).toHaveLength(1);
    expect(transitions[0].to).toBe("SUBMITTED");
  });

  it("setStatus should update instance status", async () => {
    mockQuery.mockReset();
    mockQuery.mockResolvedValueOnce({ rows: [] })  // UPDATE
      .mockResolvedValueOnce({ rows: [{ ...MOCK_INSTANCE_ROW, status: "COMPLETED" }] });  // getInstance

    const { workflowService } = await import("../../src/services/workflow.service.js");
    const result = await workflowService.setStatus("wi1", "COMPLETED");

    expect(result.status).toBe("COMPLETED");
  });

  it("updateInstance should update assignee and dueDate", async () => {
    mockQuery.mockReset();
    mockQuery.mockResolvedValueOnce({ rows: [] })  // UPDATE
      .mockResolvedValueOnce({ rows: [{ ...MOCK_INSTANCE_ROW, assignee: "user2" }] });  // getInstance

    const { workflowService } = await import("../../src/services/workflow.service.js");
    const result = await workflowService.updateInstance("wi1", { assignee: "user2" });

    expect(result.assignee).toBe("user2");
  });
});
