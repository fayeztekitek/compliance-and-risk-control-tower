import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Paper, Typography, Chip, CircularProgress, Grid, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Timeline, TimelineItem, TimelineSeparator, TimelineDot,
  TimelineConnector, TimelineContent,
} from "@mui/material";
import { apiClient } from "../api/client";
import { PageHeader, StatCard } from "../components/ui/DashboardGrid";

interface AuditEntry {
  id: string;
  fromState: string | null;
  toState: string;
  action: string;
  actor: string | null;
  comment: string | null;
  createdAt: string;
}

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
  states: string[];
  transitions: { from: string; to: string; allowed_roles: string[]; label: string }[];
  createdAt: string;
}

const WorkflowInstancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [instance, setInstance] = useState<WfInstance | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitionDialog, setTransitionDialog] = useState(false);
  const [selectedTo, setSelectedTo] = useState("");
  const [comment, setComment] = useState("");

  const fetch = async () => {
    if (!id) return;
    const [i, a] = await Promise.all([
      apiClient.get<{ data: WfInstance }>(`/api/workflow-instances/${id}`),
      apiClient.get<{ data: AuditEntry[] }>(`/api/workflow-instances/${id}/audit`),
    ]);
    setInstance(i.data.data);
    setAudit(a.data.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [id]);

  const handleTransition = async () => {
    if (!selectedTo) return;
    await apiClient.post(`/api/workflow-instances/${id}/transition`, { toState: selectedTo, comment });
    setTransitionDialog(false);
    setSelectedTo("");
    setComment("");
    fetch();
  };

  if (loading) return <Box p={3} textAlign="center"><CircularProgress />;</Box>;
  if (!instance) return <Box p={3}><Typography>Workflow not found.</Typography></Box>;

  const available = instance.transitions.filter(t => t.from === instance.currentState);
  const stateIdx = instance.states.indexOf(instance.currentState);

  return (
    <Box p={3}>
      <PageHeader
        title={instance.definitionName}
        subtitle={`${instance.entityType} · ${instance.entityId?.slice(0, 8)}...`}
      />

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 6, md: 2 }}><StatCard title="Status" value={instance.status} unit="" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><StatCard title="State" value={instance.currentState.replace(/_/g, " ")} unit="" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><StatCard title="Assignee" value={instance.assignee || "—"} unit="" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><StatCard title="Due" value={instance.dueDate || "—"} unit="" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><StatCard title="Step" value={`${stateIdx + 1} / ${instance.states.length}`} unit="" /></Grid>
      </Grid>

      {/* State progress */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Workflow States</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {instance.states.map((s, i) => {
            const isCurrent = s === instance.currentState;
            const isPast = i < stateIdx;
            return (
              <Chip key={s} size="small" label={s.replace(/_/g, " ")}
                color={isCurrent ? "primary" : isPast ? "success" : "default"}
                variant={isCurrent ? "filled" : "outlined"}
              />
            );
          })}
        </Box>
      </Paper>

      {/* Available actions */}
      {instance.status === "ACTIVE" && available.length > 0 && (
        <Box display="flex" gap={1} mb={3}>
          {available.map(t => (
            <Button key={t.to} variant="contained" size="small"
              onClick={() => { setSelectedTo(t.to); setTransitionDialog(true); }}>
              {t.label}: {t.to.replace(/_/g, " ")}
            </Button>
          ))}
        </Box>
      )}

      {/* Audit timeline */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Audit Trail</Typography>
        {audit.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No audit entries yet.</Typography>
        ) : (
          <Box>
            {audit.map((entry, i) => (
              <Box key={entry.id} display="flex" gap={2} py={1} borderBottom={i < audit.length - 1 ? "1px solid" : "none"} borderColor="divider">
                <Box textAlign="center" minWidth={80}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip size="small" label={entry.fromState?.replace(/_/g, " ") || "—"} variant="outlined" />
                    <Typography variant="body2">→</Typography>
                    <Chip size="small" label={entry.toState.replace(/_/g, " ")} color="primary" />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {entry.action}{entry.actor ? ` by ${entry.actor}` : ""}
                  </Typography>
                  {entry.comment && <Typography variant="body2" sx={{ mt: 0.5, fontStyle: "italic" }}>"{entry.comment}"</Typography>}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <Dialog open={transitionDialog} onClose={() => setTransitionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transition: {instance.currentState.replace(/_/g, " ")} → {selectedTo.replace(/_/g, " ")}</DialogTitle>
        <DialogContent>
          <TextField label="Comment (optional)" value={comment} onChange={e => setComment(e.target.value)} fullWidth multiline rows={3} sx={{ mt: 2 }} size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransitionDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTransition}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowInstancePage;
