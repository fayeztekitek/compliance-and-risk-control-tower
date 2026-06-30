import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Chip, CircularProgress, Paper, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton,
} from "@mui/material";
import { Link as LinkIcon, Add, Delete } from "@mui/icons-material";
import { apiClient } from "../api/client";

export interface RelatedItem {
  id: string;
  type: string;
  name: string;
  relationship: string;
}

interface RelatedItemsPanelProps {
  entityType: string;
  entityId: string;
  title?: string;
}

const TYPE_ROUTES: Record<string, string> = {
  project: "/projects",
  roadmap: "/roadmaps",
  steerco_meeting: "",
  milestone: "",
  risk: "",
  decision: "",
  action_item: "",
};

const TYPE_LABELS: Record<string, string> = {
  project: "Project", roadmap: "Roadmap", milestone: "Milestone",
  risk: "Risk", steerco_meeting: "SteerCo", decision: "Decision",
  action_item: "Action Item", finding: "Finding", audit: "Audit",
  capa: "CAPA", committee: "Committee", application: "Application",
  vulnerability: "Vulnerability", obligation: "Obligation",
};

const RelatedItemsPanel: React.FC<RelatedItemsPanelProps> = ({ entityType, entityId, title }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkForm, setLinkForm] = useState({ targetType: "", targetId: "", label: "" });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get<{ data: RelatedItem[] }>(`/api/trace/${entityType}/${entityId}/related`);
      setItems(r.data.data);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [entityType, entityId]);

  const handleAddLink = async () => {
    await apiClient.post("/api/trace/links", {
      sourceType: entityType,
      sourceId: entityId,
      targetType: linkForm.targetType,
      targetId: linkForm.targetId,
      label: linkForm.label || undefined,
    });
    setLinkDialog(false);
    fetchItems();
  };

  const handleDeleteLink = async (item: RelatedItem) => {
    if (item.relationship === "FK") return;
    await apiClient.delete(`/api/trace/links/${item.id}`);
    fetchItems();
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" display="flex" alignItems="center" gap={0.5}>
          <LinkIcon fontSize="small" /> {title || "Related Items"}
        </Typography>
        <Button size="small" startIcon={<Add />} onClick={() => setLinkDialog(true)}>Link</Button>
      </Box>

      {loading ? (
        <Box textAlign="center" py={2}><CircularProgress size={20} /></Box>
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>No related items found.</Typography>
      ) : (
        <Box>
          {items.map((item, i) => {
            const route = TYPE_ROUTES[item.type];
            const isManual = item.relationship !== "FK";
            return (
              <Box key={`${item.type}-${item.id}-${i}`} display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip size="small" label={TYPE_LABELS[item.type] || item.type} variant="outlined" sx={{ minWidth: 70, fontSize: "0.65rem" }} />
                    {route ? (
                      <Typography
                        variant="body2"
                        color="primary"
                        sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                        onClick={() => navigate(`${route}/${item.id}`)}
                      >
                        {item.name || item.id}
                      </Typography>
                    ) : (
                      <Typography variant="body2">{item.name || item.id}</Typography>
                    )}
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  {isManual && (
                    <IconButton size="small" onClick={() => handleDeleteLink(item)}><Delete fontSize="small" /></IconButton>
                  )}
                  <Chip size="small" label={item.relationship} variant="outlined" sx={{ fontSize: "0.6rem", height: 18 }} />
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <Dialog open={linkDialog} onClose={() => setLinkDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Related Item Link</DialogTitle>
        <DialogContent>
          <TextField label="Target Type" value={linkForm.targetType} onChange={e => setLinkForm(p => ({ ...p, targetType: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" placeholder="e.g. finding, audit, committee" />
          <TextField label="Target ID" value={linkForm.targetId} onChange={e => setLinkForm(p => ({ ...p, targetId: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" placeholder="UUID of the related entity" />
          <TextField label="Label (optional)" value={linkForm.label} onChange={e => setLinkForm(p => ({ ...p, label: e.target.value }))} fullWidth sx={{ mt: 2 }} size="small" placeholder="e.g. Related audit finding" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddLink} disabled={!linkForm.targetType || !linkForm.targetId}>Add</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default RelatedItemsPanel;
