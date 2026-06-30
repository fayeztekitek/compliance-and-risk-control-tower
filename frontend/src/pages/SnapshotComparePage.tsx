import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Chip, CircularProgress, Grid,
} from "@mui/material";
import { ArrowUpward, ArrowDownward, Remove } from "@mui/icons-material";
import { snapshotApi, SnapshotComparison } from "../api/snapshot.api";
import { PageHeader, StatCard } from "../components/ui/DashboardGrid";
import { format } from "date-fns";

const DeltaChip: React.FC<{ value: number; suffix?: string; reverse?: boolean }> = ({ value, suffix, reverse }) => {
  if (value === 0) return <Chip icon={<Remove />} size="small" label="0" variant="outlined" />;
  const isPositive = reverse ? value < 0 : value > 0;
  return (
    <Chip
      icon={isPositive ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
      size="small"
      label={`${isPositive ? "+" : ""}${value}${suffix || ""}`}
      color={isPositive ? "success" : "error"}
    />
  );
};

const SnapshotComparePage: React.FC = () => {
  const { id1, id2 } = useParams<{ id1: string; id2: string }>();
  const [data, setData] = useState<SnapshotComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id1 || !id2) return;
    setLoading(true);
    snapshotApi.compare(id1, id2).then(r => { setData(r.data.data); setLoading(false); });
  }, [id1, id2]);

  if (loading) return <Box p={3}><CircularProgress /></Box>;
  if (!data) return <Box p={3}><Typography>No comparison data.</Typography></Box>;

  const { snap1, snap2, deltas, added, removed, changed } = data;
  const d = deltas;

  return (
    <Box p={3}>
      <PageHeader
        title="Snapshot Comparison"
        subtitle={`${format(new Date(snap1.snapshotDate), "MMM yyyy")} vs ${format(new Date(snap2.snapshotDate), "MMM yyyy")}`}
      />

      <Grid container spacing={2} mb={3}>
        <Grid size={3}><StatCard title="Progress" value={`${d.progressDelta > 0 ? "+" : ""}${d.progressDelta}%`} unit="change" /></Grid>
        <Grid size={3}><StatCard title="Avg RTD" value={`${d.rtdDelta > 0 ? "+" : ""}${d.rtdDelta}`} unit="change" /></Grid>
        <Grid size={3}><StatCard title="Budget Δ" value={`${d.budgetDelta > 0 ? "+$" : "$"}${Math.abs(d.budgetDelta).toLocaleString()}`} unit="change" /></Grid>
        <Grid size={3}>
          <StatCard
            title="Project Count"
            value={`${snap1.totalProjects || 0} → ${snap2.totalProjects || 0}`}
            unit={`${d.projectsDelta > 0 ? "+" : ""}${d.projectsDelta}`}
          />
        </Grid>
        <Grid size={3}><StatCard title="On Track Δ" value={`${d.onTrackDelta > 0 ? "+" : ""}${d.onTrackDelta}`} unit="projects" /></Grid>
        <Grid size={3}><StatCard title="Deviating Δ" value={`${d.deviatingDelta > 0 ? "+" : ""}${d.deviatingDelta}`} unit="projects" /></Grid>
        <Grid size={3}><StatCard title="High Risk Δ" value={`${d.highRiskDelta > 0 ? "+" : ""}${d.highRiskDelta}`} unit="projects" /></Grid>
        <Grid size={3}><StatCard title="RTD Deviation Δ" value={`${d.rtdDeviationDelta > 0 ? "+" : ""}${d.rtdDeviationDelta}`} unit="change" /></Grid>
      </Grid>

      {(added.length > 0 || removed.length > 0) && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Projects Added / Removed</Typography>
          {added.length > 0 && (
            <Box mb={1}>
              <Typography variant="subtitle2" color="success.main">Added ({added.length})</Typography>
              {added.map(p => <Chip key={p.projectId} label={p.projectName} size="small" color="success" variant="outlined" sx={{ mr: 1, mb: 0.5 }} />)}
            </Box>
          )}
          {removed.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="error.main">Removed ({removed.length})</Typography>
              {removed.map(p => <Chip key={p.projectId} label={p.projectName} size="small" color="error" variant="outlined" sx={{ mr: 1, mb: 0.5 }} />)}
            </Box>
          )}
        </Paper>
      )}

      {changed.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Field</TableCell>
                <TableCell>Before</TableCell>
                <TableCell>After</TableCell>
                <TableCell>Delta</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {changed.map((c, i) => (
                <TableRow key={i}>
                  <TableCell>{c.projectName}</TableCell>
                  <TableCell>
                    <Chip size="small" label={c.field.replace(/([A-Z])/g, " $1")} variant="outlined" />
                  </TableCell>
                  <TableCell>{String(c.from)}</TableCell>
                  <TableCell>{String(c.to)}</TableCell>
                  <TableCell>
                    <DeltaChip value={typeof c.from === "number" && typeof c.to === "number" ? +(c.to - c.from).toFixed(2) : 0} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!changed.length && !added.length && !removed.length && (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">No changes detected between these snapshots.</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SnapshotComparePage;
