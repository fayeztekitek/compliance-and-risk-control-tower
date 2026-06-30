import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Chip, CircularProgress, Grid, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton,
} from "@mui/material";
import { Add, Edit, Delete, ArrowUpward, ArrowDownward, Remove, Camera } from "@mui/icons-material";
import { projectApi, Project, ProjectMilestone, ProjectRisk } from "../api/project.api";
import { PageHeader, StatCard } from "../components/ui/DashboardGrid";
import RAGBadge from "../components/ui/RAGBadge";
import RelatedItemsPanel from "../components/traceability/RelatedItemsPanel";
import { format } from "date-fns";

const RAG_FIELDS = ["planning", "quality", "scope", "governance", "security", "clientMood", "resources", "globalRisk"] as const;
const RAG_LABELS: Record<string, string> = {
  planning: "Planning", quality: "Quality", scope: "Scope", governance: "Governance",
  security: "Security", clientMood: "Client Mood", resources: "Resources", globalRisk: "Global Risk",
};

const TrendIcon: React.FC<{ trend: string }> = ({ trend }) => {
  if (trend === "improving") return <ArrowUpward fontSize="inherit" sx={{ color: "success.main", verticalAlign: "middle", ml: 0.5 }} />;
  if (trend === "deteriorating") return <ArrowDownward fontSize="inherit" sx={{ color: "error.main", verticalAlign: "middle", ml: 0.5 }} />;
  return <Remove fontSize="inherit" sx={{ color: "text.disabled", verticalAlign: "middle", ml: 0.5 }} />;
};

const RAG_CARD_COLORS: Record<string, Record<string, string>> = {
  GREEN: { bg: "#dcfce7", text: "#166534" },
  AMBER: { bg: "#fef3c7", text: "#92400e" },
  RED: { bg: "#fee2e2", text: "#991b1b" },
};

const RagIndicatorCard: React.FC<{ label: string; value: string; trend: string }> = ({ label, value, trend }) => {
  const c = RAG_CARD_COLORS[value] || RAG_CARD_COLORS.GREEN;
  return (
    <Box sx={{ bgcolor: c.bg, color: c.text, p: 2, borderRadius: 2, textAlign: "center", minWidth: 100 }}>
      <Typography variant="caption" sx={{ opacity: 0.8 }}>{label}</Typography>
      <Typography variant="h6" fontWeight={700}>{value}</Typography>
      <TrendIcon trend={trend} />
    </Box>
  );
};

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [milestoneDialog, setMilestoneDialog] = useState(false);
  const [riskDialog, setRiskDialog] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: "", description: "", dueDate: "", status: "PENDING" });
  const [riskForm, setRiskForm] = useState({ title: "", description: "", severity: "AMBER", category: "", status: "OPEN", owner: "" });

  const fetchProject = useCallback(async () => {
    if (!id) return;
    const [p, m, r] = await Promise.all([
      projectApi.getById(id),
      projectApi.listMilestones(id),
      projectApi.listRisks(id),
    ]);
    setProject(p.data.data);
    setMilestones(m.data.data);
    setRisks(r.data.data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const handleRagEdit = (field: string, value: string) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveRag = async () => {
    if (!id || !project) return;
    const updated = await projectApi.update(id, editData);
    setProject(updated.data.data);
    setEditData({});
    setEditDialog(false);
  };

  const handleCreateSnapshot = async () => {
    if (!id) return;
    await projectApi.createStatusSnapshot(id);
  };

  if (loading) return <Box p={3} textAlign="center"><CircularProgress /></Box>;
  if (!project) return <Box p={3}><Typography>Project not found.</Typography></Box>;

  return (
    <Box p={3}>
      <PageHeader
        title={`${project.name} (${project.code})`}
        subtitle={`Manager: ${project.manager || "N/A"}  ·  Status: ${project.status}`}
      >
        <Button variant="outlined" startIcon={<Camera />} size="small" onClick={handleCreateSnapshot}>Snapshot</Button>
        <Button variant="contained" size="small" onClick={() => { setEditData(project); setEditDialog(true); }}>Edit RAG</Button>
      </PageHeader>

      {/* KPI Strip */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 6, md: 1.5 }}><StatCard title="Status" value={project.status} unit="" /></Grid>
        <Grid size={{ xs: 6, md: 1.5 }}><StatCard title="RTD" value={project.rtdValue?.toFixed(1)} unit={`dev ${project.rtdDeviation?.toFixed(1)}`} /></Grid>
        <Grid size={{ xs: 6, md: 1.5 }}><StatCard title="Slippage" value={`${project.slippageMd}d`} unit="" /></Grid>
        <Grid size={{ xs: 6, md: 1.5 }}><StatCard title="Test Auto" value={`${project.testAutomationRate}%`} unit="" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><StatCard title="Budget" value={`${((project.consumedBudget || 0) / 1000).toFixed(0)}K`} unit={`/ ${((project.initialBudget || 0) / 1000).toFixed(0)}K`} /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><StatCard title="Go-Live" value={project.goLiveReadinessState} unit="" /></Grid>
      </Grid>

      {/* Executive Message */}
      {project.executiveMessage && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: "grey.50", borderLeft: 4, borderColor: "primary.main" }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>Executive Message</Typography>
          <Typography variant="body2">{project.executiveMessage}</Typography>
        </Paper>
      )}

      {/* RAG Indicator Grid */}
      <Typography variant="h6" gutterBottom>RAG Indicators</Typography>
      <Grid container spacing={1.5} mb={3}>
        {RAG_FIELDS.map(field => (
          <Grid key={field} size={{ xs: 6, sm: 4, md: 3 }}>
            <RagIndicatorCard
              label={RAG_LABELS[field]}
              value={project[field as keyof Project] as string}
              trend={project[`${field}Trend` as keyof Project] as string}
            />
          </Grid>
        ))}
      </Grid>

      {/* Related Items */}
      <Box mb={3}>
        <RelatedItemsPanel entityType="project" entityId={id || ""} />
      </Box>

      <Grid container spacing={3}>
        {/* Milestones */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Milestones</Typography>
              <Button size="small" startIcon={<Add />} onClick={() => { setMilestoneForm({ title: "", description: "", dueDate: "", status: "PENDING" }); setMilestoneDialog(true); }}>Add</Button>
            </Box>
            {milestones.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No milestones yet.</Typography>
            ) : (
              milestones.map(m => (
                <Paper key={m.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2">{m.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {m.dueDate ? `Due: ${format(new Date(m.dueDate), "MMM dd, yyyy")}` : "No due date"}
                      </Typography>
                    </Box>
                    <Chip size="small" label={m.status} color={m.status === "COMPLETED" ? "success" : m.status === "IN_PROGRESS" ? "info" : "default"} />
                  </Box>
                </Paper>
              ))
            )}
          </Paper>
        </Grid>

        {/* Risks */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Risks</Typography>
              <Button size="small" startIcon={<Add />} onClick={() => { setRiskForm({ title: "", description: "", severity: "AMBER", category: "", status: "OPEN", owner: "" }); setRiskDialog(true); }}>Add</Button>
            </Box>
            {risks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No risks logged.</Typography>
            ) : (
              risks.map(r => (
                <Paper key={r.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2">{r.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.category && `${r.category}  ·  `}{r.owner ? `Owner: ${r.owner}` : ""}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      <RAGBadge type="compliance" value={r.severity} />
                      <Chip size="small" label={r.status} variant="outlined" />
                    </Box>
                  </Box>
                </Paper>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Edit RAG Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit RAG Indicators</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {RAG_FIELDS.map(field => (
              <Grid size={{ xs: 6 }} key={field}>
                <FormControl fullWidth size="small">
                  <InputLabel>{RAG_LABELS[field]}</InputLabel>
                  <Select value={editData[field] || project[field as keyof Project]} label={RAG_LABELS[field]}
                    onChange={e => handleRagEdit(field, e.target.value)}>
                    <MenuItem value="GREEN">GREEN</MenuItem>
                    <MenuItem value="AMBER">AMBER</MenuItem>
                    <MenuItem value="RED">RED</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            ))}
            <Grid size={12}>
              <TextField label="Executive Message" value={editData.executiveMessage ?? project.executiveMessage ?? ""}
                onChange={e => setEditData((prev: any) => ({ ...prev, executiveMessage: e.target.value }))}
                fullWidth multiline rows={3} size="small" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRag}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Milestone Dialog */}
      <Dialog open={milestoneDialog} onClose={() => setMilestoneDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Milestone</DialogTitle>
        <DialogContent>
          <TextField label="Title" value={milestoneForm.title} onChange={e => setMilestoneForm(p => ({ ...p, title: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" />
          <TextField label="Description" value={milestoneForm.description} onChange={e => setMilestoneForm(p => ({ ...p, description: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" multiline rows={2} />
          <TextField label="Due Date" type="date" value={milestoneForm.dueDate} onChange={e => setMilestoneForm(p => ({ ...p, dueDate: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth sx={{ mt: 2 }} size="small">
            <InputLabel>Status</InputLabel>
            <Select value={milestoneForm.status} label="Status" onChange={e => setMilestoneForm(p => ({ ...p, status: e.target.value }))}>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMilestoneDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { if (id) { await projectApi.createMilestone(id, milestoneForm); setMilestoneDialog(false); fetchProject(); } }}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Risk Dialog */}
      <Dialog open={riskDialog} onClose={() => setRiskDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Risk</DialogTitle>
        <DialogContent>
          <TextField label="Title" value={riskForm.title} onChange={e => setRiskForm(p => ({ ...p, title: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" />
          <TextField label="Description" value={riskForm.description} onChange={e => setRiskForm(p => ({ ...p, description: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" multiline rows={2} />
          <FormControl fullWidth sx={{ mt: 2 }} size="small">
            <InputLabel>Severity</InputLabel>
            <Select value={riskForm.severity} label="Severity" onChange={e => setRiskForm(p => ({ ...p, severity: e.target.value }))}>
              <MenuItem value="GREEN">Low</MenuItem>
              <MenuItem value="AMBER">Medium</MenuItem>
              <MenuItem value="RED">High</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Category" value={riskForm.category} onChange={e => setRiskForm(p => ({ ...p, category: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" />
          <TextField label="Owner" value={riskForm.owner} onChange={e => setRiskForm(p => ({ ...p, owner: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRiskDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { if (id) { await projectApi.createRisk(id, riskForm); setRiskDialog(false); fetchProject(); } }}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetailPage;
