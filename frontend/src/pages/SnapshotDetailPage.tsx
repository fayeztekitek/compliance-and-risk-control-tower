import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Chip, CircularProgress, Grid,
} from "@mui/material";
import { snapshotApi, SnapshotDetail } from "../api/snapshot.api";
import { PageHeader, StatCard } from "../components/ui/DashboardGrid";
import { format } from "date-fns";
import RAGBadge from "../components/ui/RAGBadge";

const SnapshotDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [snap, setSnap] = useState<SnapshotDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    snapshotApi.get(id).then(r => { setSnap(r.data.data); setLoading(false); });
  }, [id]);

  if (loading) return <Box p={3}><CircularProgress /></Box>;
  if (!snap) return <Box p={3}><Typography>Snapshot not found.</Typography></Box>;

  return (
    <Box p={3}>
      <PageHeader
        title={snap.label || `Snapshot ${format(new Date(snap.snapshotDate), "MMM yyyy")}`}
        subtitle={`Taken on ${format(new Date(snap.createdAt), "MMM dd, yyyy HH:mm")}`}
      />

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 6, md: 3 }}><StatCard title="Progress" value={`${snap.progress}%`} unit="milestone" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><StatCard title="Projects" value={snap.totalProjects} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><StatCard title="On Track" value={snap.onTrackCount} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><StatCard title="Deviating" value={snap.deviatingCount} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><StatCard title="High Risk" value={snap.highRiskCount} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><StatCard title="Avg RTD" value={snap.avgRtd} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><StatCard title="Budget" value={`$${snap.totalConsumed?.toLocaleString()}`} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><StatCard title="Budget Remaining" value={`$${((snap.totalBudget || 0) - (snap.totalConsumed || 0)).toLocaleString()}`} /></Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>RTD</TableCell>
              <TableCell>Slippage (md)</TableCell>
              <TableCell>Test Automation</TableCell>
              <TableCell>Go-Live</TableCell>
              <TableCell>Budget</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {snap.items.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.projectName} ({p.projectCode})</TableCell>
                <TableCell><RAGBadge type="project" value={p.status} /></TableCell>
                <TableCell>{p.rtdValue}</TableCell>
                <TableCell>{p.slippageMd}</TableCell>
                <TableCell>{p.testAutomationRate}%</TableCell>
                <TableCell><RAGBadge type="compliance" value={p.goLiveReadinessState} /></TableCell>
                <TableCell>${p.consumedBudget?.toLocaleString()} / ${p.initialBudget?.toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {!snap.items.length && (
              <TableRow><TableCell colSpan={7} align="center">No project data in this snapshot.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SnapshotDetailPage;
