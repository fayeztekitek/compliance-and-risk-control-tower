import React, { useEffect, useState } from "react";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Chip, CircularProgress, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
} from "@mui/material";
import { Add, Edit, Delete, Science } from "@mui/icons-material";
import { apiClient } from "../api/client";
import { PageHeader } from "../components/ui/DashboardGrid";

interface KpiDefinition {
  id: string;
  name: string;
  description: string;
  formula: string;
  owner: string;
  frequency: string;
  domain: string;
  unit: string;
  higherIsBetter: boolean;
  thresholds: Record<string, number>;
  ragRules: { rule: string; condition: string }[];
  explanation: string;
  active: boolean;
  createdAt: string;
}

const DOMAIN_OPTIONS = ["roadmap", "project", "risk", "milestone", "snapshot", "security", "compliance", "veg", "audit"];
const FREQ_OPTIONS = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"];

const KpiDefinitionsPage: React.FC = () => {
  const [defs, setDefs] = useState<KpiDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<KpiDefinition | null>(null);
  const [form, setForm] = useState<any>({
    name: "", description: "", formula: "", owner: "", frequency: "MONTHLY",
    domain: "project", unit: "", higherIsBetter: true, thresholds: "{}",
    ragRules: "[]", explanation: "",
  });
  const [evaluateDialog, setEvaluateDialog] = useState(false);
  const [evalKpi, setEvalKpi] = useState<KpiDefinition | null>(null);
  const [evalValue, setEvalValue] = useState("");
  const [evalResult, setEvalResult] = useState<{ rag: string } | null>(null);

  const fetch = async () => {
    setLoading(true);
    const r = await apiClient.get<{ data: KpiDefinition[] }>("/api/kpi-definitions");
    setDefs(r.data.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async () => {
    const payload = {
      ...form,
      thresholds: JSON.parse(form.thresholds || "{}"),
      ragRules: JSON.parse(form.ragRules || "[]"),
    };
    if (editing) {
      await apiClient.patch(`/api/kpi-definitions/${editing.id}`, payload);
    } else {
      await apiClient.post("/api/kpi-definitions", payload);
    }
    setDialog(false);
    fetch();
  };

  const handleEvaluate = async () => {
    if (!evalKpi) return;
    const r = await apiClient.get(`/api/kpi-definitions/${evalKpi.id}/evaluate?value=${evalValue}`);
    setEvalResult(r.data.data);
  };

  const openEdit = (kpi: KpiDefinition) => {
    setEditing(kpi);
    setForm({
      name: kpi.name, description: kpi.description || "", formula: kpi.formula || "",
      owner: kpi.owner || "", frequency: kpi.frequency, domain: kpi.domain,
      unit: kpi.unit || "", higherIsBetter: kpi.higherIsBetter,
      thresholds: JSON.stringify(kpi.thresholds || {}, null, 2),
      ragRules: JSON.stringify(kpi.ragRules || [], null, 2),
      explanation: kpi.explanation || "",
    });
    setDialog(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", formula: "", owner: "", frequency: "MONTHLY", domain: "project", unit: "", higherIsBetter: true, thresholds: "{}", ragRules: "[]", explanation: "" });
    setDialog(true);
  };

  const RAG_COLOR: Record<string, string> = { GREEN: "#22c55e", AMBER: "#f59e0b", RED: "#ef4444" };

  return (
    <Box p={3}>
      <PageHeader title="KPI Definitions" subtitle="Centralized registry of all KPI/KRI definitions with thresholds, RAG rules, and AI explanations">
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add KPI</Button>
      </PageHeader>

      {loading ? <CircularProgress sx={{ display: "block", mx: "auto", mt: 4 }} /> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>RAG Rules</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {defs.map(kpi => (
                <TableRow key={kpi.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{kpi.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{kpi.description}</Typography>
                  </TableCell>
                  <TableCell><Chip size="small" label={kpi.domain} variant="outlined" /></TableCell>
                  <TableCell>{kpi.owner || "—"}</TableCell>
                  <TableCell>{kpi.frequency}</TableCell>
                  <TableCell>{kpi.unit || "—"}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      {(kpi.ragRules || []).map((r, i) => (
                        <Chip key={i} size="small" label={r.rule} sx={{ bgcolor: RAG_COLOR[r.rule], color: "#fff", fontWeight: 600, fontSize: "0.65rem", height: 20 }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={kpi.active ? "Active" : "Inactive"} color={kpi.active ? "success" : "default"} />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(kpi)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={async () => { if (confirm("Delete?")) { await apiClient.delete(`/api/kpi-definitions/${kpi.id}`); fetch(); } }}><Delete fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => { setEvalKpi(kpi); setEvalValue(""); setEvalResult(null); setEvaluateDialog(true); }}><Science fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!defs.length && (
                <TableRow><TableCell colSpan={8} align="center">No KPI definitions found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? "Edit KPI Definition" : "New KPI Definition"}</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" />
          <TextField label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" multiline rows={2} />
          <TextField label="Formula (SQL)" value={form.formula} onChange={e => setForm(p => ({ ...p, formula: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" multiline rows={2} fontFamily="monospace" />
          <Box display="flex" gap={2} mt={2}>
            <TextField label="Owner" value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} fullWidth size="small" />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Domain</InputLabel>
              <Select value={form.domain} label="Domain" onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}>
                {DOMAIN_OPTIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Frequency</InputLabel>
              <Select value={form.frequency} label="Frequency" onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}>
                {FREQ_OPTIONS.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box display="flex" gap={2} mt={2} alignItems="center">
            <TextField label="Unit" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} size="small" sx={{ minWidth: 100 }} />
            <FormControlLabel control={<Switch checked={form.higherIsBetter} onChange={e => setForm(p => ({ ...p, higherIsBetter: e.target.checked }))} />} label="Higher is better" />
          </Box>
          <TextField label="Thresholds (JSON)" value={form.thresholds} onChange={e => setForm(p => ({ ...p, thresholds: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" multiline rows={2} fontFamily="monospace" helperText='e.g. {"warning": 50, "critical": 25}' />
          <TextField label="RAG Rules (JSON)" value={form.ragRules} onChange={e => setForm(p => ({ ...p, ragRules: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" multiline rows={3} fontFamily="monospace" helperText='e.g. [{"rule": "GREEN", "condition": "value >= 75"}, {"rule": "RED", "condition": "value < 50"}]' />
          <TextField label="AI Explanation" value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name || !form.domain}>{editing ? "Update" : "Create"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={evaluateDialog} onClose={() => setEvaluateDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Evaluate RAG: {evalKpi?.name}</DialogTitle>
        <DialogContent>
          <TextField label="Value" type="number" value={evalValue} onChange={e => setEvalValue(e.target.value)} fullWidth sx={{ mt: 2 }} size="small" />
          {evalResult && (
            <Box mt={2} textAlign="center">
              <Chip label={`RAG: ${evalResult.rag}`} sx={{ bgcolor: RAG_COLOR[evalResult.rag] || "#94a3b8", color: "#fff", fontWeight: 700, fontSize: "1rem", px: 2 }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvaluateDialog(false)}>Close</Button>
          <Button variant="contained" onClick={handleEvaluate}>Evaluate</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KpiDefinitionsPage;
