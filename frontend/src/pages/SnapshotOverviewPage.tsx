import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, CircularProgress, Checkbox,
} from "@mui/material";
import { Add, CompareArrows, Refresh } from "@mui/icons-material";
import { snapshotApi, SnapshotSummary } from "../api/snapshot.api";
import { PageHeader } from "../components/ui/DashboardGrid";
import { format } from "date-fns";

const SnapshotOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [roadmapOptions, setRoadmapOptions] = useState<{ id: string; name: string }[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const fetch = useCallback(async () => {
    setLoading(true);
    const r = await snapshotApi.list();
    setSnapshots(r.data.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCreateOpen = async () => {
    setOpenCreate(true);
  };

  const handleCreate = async () => {
    if (!selectedRoadmap) return;
    await snapshotApi.create(selectedRoadmap, newLabel || undefined);
    setOpenCreate(false);
    setNewLabel("");
    setSelectedRoadmap("");
    fetch();
  };

  return (
    <Box p={3}>
      <PageHeader title="Roadmap Snapshots" subtitle="Immutable monthly and ad-hoc snapshots for delta analysis">
        <Button variant="contained" startIcon={<Add />} onClick={handleCreateOpen}>
          Create Snapshot
        </Button>
        {selectedForCompare.length === 2 && (
          <Button
            variant="outlined"
            startIcon={<CompareArrows />}
            onClick={() => navigate(`/snapshots/compare/${selectedForCompare[0]}/${selectedForCompare[1]}`)}
          >
            Compare Selected
          </Button>
        )}
        <IconButton onClick={fetch}><Refresh /></IconButton>
      </PageHeader>

      {loading ? <CircularProgress sx={{ display: "block", mx: "auto", mt: 4 }} /> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Date</TableCell>
                <TableCell>Label</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Projects</TableCell>
                <TableCell>On Track</TableCell>
                <TableCell>Avg RTD</TableCell>
                <TableCell>Budget</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {snapshots.map(s => (
                <TableRow key={s.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/snapshots/${s.id}`)}>
                  <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      size="small"
                      checked={selectedForCompare.includes(s.id)}
                      onChange={() =>
                        setSelectedForCompare(prev =>
                          prev.includes(s.id) ? prev.filter(x => x !== s.id) : prev.length < 2 ? [...prev, s.id] : [s.id]
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>{format(new Date(s.snapshotDate), "MMM yyyy")}</TableCell>
                  <TableCell>{s.label || "—"}</TableCell>
                  <TableCell>{s.progress}%</TableCell>
                  <TableCell>
                    <Chip size="small" label={s.milestoneStatus || "N/A"} color={s.milestoneStatus === "ON_TRACK" ? "success" : s.milestoneStatus === "DEVIATING" ? "warning" : "default"} />
                  </TableCell>
                  <TableCell>{s.totalProjects}</TableCell>
                  <TableCell>{s.onTrackCount}</TableCell>
                  <TableCell>{s.avgRtd}</TableCell>
                  <TableCell>${s.totalConsumed?.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!snapshots.length && (
                <TableRow>
                  <TableCell colSpan={9} align="center">No snapshots yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Snapshot</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Roadmap</InputLabel>
            <Select value={selectedRoadmap} label="Roadmap" onChange={e => setSelectedRoadmap(e.target.value)}>
              {roadmapOptions.map(rm => (
                <MenuItem key={rm.id} value={rm.id}>{rm.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Label (optional)" value={newLabel} onChange={e => setNewLabel(e.target.value)} fullWidth sx={{ mt: 2 }} placeholder="e.g. Monthly snapshot June 2026" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!selectedRoadmap}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SnapshotOverviewPage;
