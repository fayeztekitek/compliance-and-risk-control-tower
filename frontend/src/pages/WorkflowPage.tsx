import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Chip, CircularProgress, Button, Select,
  MenuItem, FormControl, InputLabel,
} from "@mui/material";
import { apiClient } from "../api/client";
import { PageHeader, KpiCardGrid, StatCard } from "../components/ui/DashboardGrid";

interface WfInstance {
  id: string;
  definitionId: string;
  definitionName: string;
  entityId: string;
  entityType: string;
  currentState: string;
  status: string;
  assignee: string | null;
  dueDate: string | null;
  createdAt: string;
}

const WorkflowPage: React.FC = () => {
  const navigate = useNavigate();
  const [instances, setInstances] = useState<WfInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetch = async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filterType) params.entityType = filterType;
    if (filterStatus) params.status = filterStatus;
    const r = await apiClient.get<{ data: WfInstance[] }>("/api/workflow-instances", { params });
    setInstances(r.data.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [filterType, filterStatus]);

  const activeCount = instances.filter(i => i.status === "ACTIVE").length;
  const closedCount = instances.filter(i => i.status !== "ACTIVE").length;

  const TYPE_COLORS: Record<string, string> = {
    veg_request: "#6366f1", roadmap_review: "#22c55e", steerco: "#f59e0b",
    waiver: "#ef4444", risk_acceptance: "#8b5cf6", audit: "#06b6d4",
  };

  return (
    <Box p={3}>
      <PageHeader title="Workflow Engine" subtitle="Reusable workflow instances across governance processes">
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Entity Type</InputLabel>
            <Select value={filterType} label="Entity Type" onChange={e => setFilterType(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="veg_request">VEG</MenuItem>
              <MenuItem value="roadmap_review">Roadmap</MenuItem>
              <MenuItem value="steerco">SteerCo</MenuItem>
              <MenuItem value="waiver">Waiver</MenuItem>
              <MenuItem value="risk_acceptance">Risk Acceptance</MenuItem>
              <MenuItem value="audit">Audit</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} label="Status" onChange={e => setFilterStatus(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </PageHeader>

      <KpiCardGrid>
        <StatCard title="Total" value={instances.length} icon={undefined as any} color="text-blue-600 bg-blue-50" />
        <StatCard title="Active" value={activeCount} icon={undefined as any} color="text-green-600 bg-green-50" />
        <StatCard title="Closed" value={closedCount} icon={undefined as any} color="text-slate-600 bg-slate-50" />
      </KpiCardGrid>

      {loading ? <CircularProgress sx={{ display: "block", mx: "auto", mt: 4 }} /> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Workflow</TableCell>
                <TableCell>Entity Type</TableCell>
                <TableCell>Current State</TableCell>
                <TableCell>Assignee</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {instances.map(inst => (
                <TableRow key={inst.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/workflow/${inst.id}`)}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{inst.definitionName}</Typography>
                    <Typography variant="caption" color="text.secondary">{inst.entityId?.slice(0, 8)}...</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={inst.entityType} sx={{ bgcolor: TYPE_COLORS[inst.entityType] || "#94a3b8", color: "#fff" }} />
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={inst.currentState.replace(/_/g, " ")} variant="outlined" />
                  </TableCell>
                  <TableCell>{inst.assignee || "—"}</TableCell>
                  <TableCell>{inst.dueDate || "—"}</TableCell>
                  <TableCell>
                    <Chip size="small" label={inst.status} color={inst.status === "ACTIVE" ? "success" : "default"} />
                  </TableCell>
                </TableRow>
              ))}
              {!instances.length && (
                <TableRow><TableCell colSpan={6} align="center">No workflow instances found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default WorkflowPage;
