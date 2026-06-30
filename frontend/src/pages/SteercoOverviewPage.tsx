import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Chip, CircularProgress, Button,
} from "@mui/material";
import { projectApi, SteercoMeeting } from "../api/project.api";
import { PageHeader } from "../components/ui/DashboardGrid";
import { format } from "date-fns";

const SteercoOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<(SteercoMeeting & { projectName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await projectApi.listSteercoMeetings();
      const meetings = r.data.data;
      // Enrich with project names
      const enriched = await Promise.all(meetings.map(async (m) => {
        try {
          const p = await projectApi.getById(m.projectId);
          return { ...m, projectName: p.data.data.name };
        } catch {
          return { ...m, projectName: "Unknown" };
        }
      }));
      setMeetings(enriched);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Box p={3} textAlign="center"><CircularProgress /></Box>;

  return (
    <Box p={3}>
      <PageHeader title="SteerCo Overview" subtitle="All steering committee meetings across projects" />

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Participants</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {meetings.map(m => (
              <TableRow key={m.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/projects/${m.projectId}/steerco`)}>
                <TableCell>{format(new Date(m.date), "MMM dd, yyyy")}</TableCell>
                <TableCell>{m.time || "—"}</TableCell>
                <TableCell>
                  <Button size="small" variant="text" sx={{ textTransform: "none", p: 0, minWidth: 0 }} onClick={(e) => { e.stopPropagation(); navigate(`/projects/${m.projectId}`); }}>
                    {m.projectName || "Loading..."}
                  </Button>
                </TableCell>
                <TableCell>{m.title}</TableCell>
                <TableCell>
                  <Chip size="small" label={m.status} color={m.status === "HELD" ? "success" : m.status === "CANCELLED" ? "error" : "default"} />
                </TableCell>
                <TableCell>{m.participants?.length || 0}</TableCell>
              </TableRow>
            ))}
            {!meetings.length && (
              <TableRow><TableCell colSpan={6} align="center">No SteerCo meetings found across projects.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SteercoOverviewPage;
