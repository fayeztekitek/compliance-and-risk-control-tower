import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Typography, Paper, Chip, CircularProgress, Grid, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem,
  FormControl, InputLabel, IconButton, Collapse, Card, CardContent, CardActions,
} from "@mui/material";
import { Add, Edit, Delete, ExpandMore, ExpandLess } from "@mui/icons-material";
import { projectApi, SteercoMeeting, SteercoDecision, SteercoActionItem } from "../api/project.api";
import { PageHeader } from "../components/ui/DashboardGrid";
import { format } from "date-fns";

const MeetingCard: React.FC<{
  meeting: SteercoMeeting;
  decisions: SteercoDecision[];
  actions: SteercoActionItem[];
  onEdit: (m: SteercoMeeting) => void;
  onDelete: (id: string) => void;
  onAddDecision: (meetingId: string) => void;
  onAddAction: (meetingId: string) => void;
  onRefresh: () => void;
}> = ({ meeting, decisions, actions, onEdit, onDelete, onAddDecision, onAddAction }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>{meeting.title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(meeting.date), "MMM dd, yyyy")}{meeting.time ? ` at ${meeting.time}` : ""}
              {meeting.participants?.length ? `  ·  ${meeting.participants.length} participants` : ""}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip size="small" label={meeting.status} color={meeting.status === "HELD" ? "success" : meeting.status === "CANCELLED" ? "error" : "default"} />
            <IconButton size="small" onClick={() => onEdit(meeting)}><Edit fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => onDelete(meeting.id)}><Delete fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>
        {meeting.notes && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{meeting.notes}</Typography>}
      </CardContent>
      <Collapse in={expanded}>
        <CardContent sx={{ pt: 0 }}>
          <Box display="flex" gap={1} mb={1}>
            <Button size="small" startIcon={<Add />} onClick={() => onAddDecision(meeting.id)}>Decision</Button>
            <Button size="small" startIcon={<Add />} onClick={() => onAddAction(meeting.id)}>Action Item</Button>
          </Box>
          {decisions.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>Decisions ({decisions.length})</Typography>
              {decisions.map(d => (
                <Paper key={d.id} variant="outlined" sx={{ p: 1, mb: 0.5 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={500}>{d.title}</Typography>
                    <Chip size="small" label={d.status} color={d.status === "COMPLETED" ? "success" : d.status === "OVERDUE" ? "error" : "warning"} variant="outlined" />
                  </Box>
                  {d.owner && <Typography variant="caption" color="text.secondary">Owner: {d.owner}{d.dueDate ? `  ·  Due: ${format(new Date(d.dueDate), "MMM dd")}` : ""}</Typography>}
                </Paper>
              ))}
            </Box>
          )}
          {actions.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>Action Items ({actions.length})</Typography>
              {actions.map(a => (
                <Paper key={a.id} variant="outlined" sx={{ p: 1, mb: 0.5 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={500}>{a.title}</Typography>
                    <Chip size="small" label={a.status} color={a.status === "COMPLETED" ? "success" : a.status === "IN_PROGRESS" ? "info" : "default"} variant="outlined" />
                  </Box>
                  {a.assignee && <Typography variant="caption" color="text.secondary">Assignee: {a.assignee}{a.dueDate ? `  ·  Due: ${format(new Date(a.dueDate), "MMM dd")}` : ""}</Typography>}
                </Paper>
              ))}
            </Box>
          )}
          {!decisions.length && !actions.length && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>No decisions or action items yet.</Typography>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

const SteercoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [meetings, setMeetings] = useState<SteercoMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded data: decisions & action items per meeting
  const [decisionsMap, setDecisionsMap] = useState<Record<string, SteercoDecision[]>>({});
  const [actionsMap, setActionsMap] = useState<Record<string, SteercoActionItem[]>>({});

  // Dialogs
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", time: "", notes: "", participants: "" });
  const [editMeeting, setEditMeeting] = useState<SteercoMeeting | null>(null);
  const [decisionDialog, setDecisionDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [targetMeetingId, setTargetMeetingId] = useState("");
  const [decisionForm, setDecisionForm] = useState({ title: "", description: "", owner: "", dueDate: "" });
  const [actionForm, setActionForm] = useState({ title: "", assignee: "", dueDate: "", notes: "" });

  const fetchAll = async () => {
    if (!id) return;
    const m = await projectApi.listSteercoMeetings(id);
    setMeetings(m.data.data);
    // Fetch decisions & action items for each meeting
    const dMap: Record<string, SteercoDecision[]> = {};
    const aMap: Record<string, SteercoActionItem[]> = {};
    await Promise.all(m.data.data.map(async (mtg) => {
      const [d, a] = await Promise.all([
        projectApi.listSteercoDecisions(mtg.id),
        projectApi.listSteercoActionItems(mtg.id),
      ]);
      dMap[mtg.id] = d.data.data;
      aMap[mtg.id] = a.data.data;
    }));
    setDecisionsMap(dMap);
    setActionsMap(aMap);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [id]);

  if (loading) return <Box p={3} textAlign="center"><CircularProgress /></Box>;

  return (
    <Box p={3}>
      <PageHeader title="SteerCo Management" subtitle="Schedule and manage steering committee meetings for this project">
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ title: "", date: new Date().toISOString().split("T")[0], time: "", notes: "", participants: "" }); setCreateDialog(true); }}>
          Schedule Meeting
        </Button>
      </PageHeader>

      {meetings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No SteerCo meetings scheduled yet for this project.</Typography>
        </Paper>
      ) : (
        meetings.map(mtg => (
          <MeetingCard
            key={mtg.id}
            meeting={mtg}
            decisions={decisionsMap[mtg.id] || []}
            actions={actionsMap[mtg.id] || []}
            onEdit={(m) => { setEditMeeting(m); setForm({ title: m.title, date: m.date?.split("T")[0] || "", time: m.time || "", notes: m.notes || "", participants: (m.participants || []).join(", ") }); setEditDialog(true); }}
            onDelete={async (mid) => { await projectApi.deleteSteercoMeeting(mid); fetchAll(); }}
            onAddDecision={(mid) => { setTargetMeetingId(mid); setDecisionForm({ title: "", description: "", owner: "", dueDate: "" }); setDecisionDialog(true); }}
            onAddAction={(mid) => { setTargetMeetingId(mid); setActionForm({ title: "", assignee: "", dueDate: "", notes: "" }); setActionDialog(true); }}
            onRefresh={fetchAll}
          />
        ))
      )}

      {/* Create Meeting Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule SteerCo Meeting</DialogTitle>
        <DialogContent>
          <TextField label="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" />
          <TextField label="Date" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Time" type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" multiline rows={3} />
          <TextField label="Participants (comma-separated)" value={form.participants} onChange={e => setForm(p => ({ ...p, participants: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { if (id) { await projectApi.createSteercoMeeting(id, { ...form, participants: form.participants.split(",").map(s => s.trim()).filter(Boolean) }); setCreateDialog(false); fetchAll(); } }}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Meeting Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit SteerCo Meeting</DialogTitle>
        <DialogContent>
          <TextField label="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" />
          <TextField label="Date" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Time" type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth sx={{ mt: 2 }} size="small">
            <InputLabel>Status</InputLabel>
            <Select value={editMeeting?.status || "SCHEDULED"} label="Status" onChange={e => setEditMeeting(p => p ? { ...p, status: e.target.value } : p)}>
              <MenuItem value="SCHEDULED">Scheduled</MenuItem>
              <MenuItem value="HELD">Held</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" multiline rows={3} />
          <TextField label="Participants (comma-separated)" value={form.participants} onChange={e => setForm(p => ({ ...p, participants: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { if (editMeeting) { await projectApi.updateSteercoMeeting(editMeeting.id, { ...form, participants: form.participants.split(",").map(s => s.trim()).filter(Boolean) }); setEditDialog(false); fetchAll(); } }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Decision Dialog */}
      <Dialog open={decisionDialog} onClose={() => setDecisionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Decision</DialogTitle>
        <DialogContent>
          <TextField label="Title" value={decisionForm.title} onChange={e => setDecisionForm(p => ({ ...p, title: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" />
          <TextField label="Description" value={decisionForm.description} onChange={e => setDecisionForm(p => ({ ...p, description: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" multiline rows={2} />
          <TextField label="Owner" value={decisionForm.owner} onChange={e => setDecisionForm(p => ({ ...p, owner: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" />
          <TextField label="Due Date" type="date" value={decisionForm.dueDate} onChange={e => setDecisionForm(p => ({ ...p, dueDate: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { await projectApi.createSteercoDecision(targetMeetingId, decisionForm); setDecisionDialog(false); fetchAll(); }}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Action Item Dialog */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Action Item</DialogTitle>
        <DialogContent>
          <TextField label="Title" value={actionForm.title} onChange={e => setActionForm(p => ({ ...p, title: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" />
          <TextField label="Assignee" value={actionForm.assignee} onChange={e => setActionForm(p => ({ ...p, assignee: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" />
          <TextField label="Due Date" type="date" value={actionForm.dueDate} onChange={e => setActionForm(p => ({ ...p, dueDate: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Notes" value={actionForm.notes} onChange={e => setActionForm(p => ({ ...p, notes: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { await projectApi.createSteercoActionItem(targetMeetingId, actionForm); setActionDialog(false); fetchAll(); }}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SteercoPage;
