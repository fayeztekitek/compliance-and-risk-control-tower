import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Chip, CircularProgress, Button, Tabs, Tab, IconButton,
} from "@mui/material";
import { CheckCheck, Bell, AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import { useNotificationStore, AppNotification } from "../store/notification.store";
import { PageHeader, KpiCardGrid, StatCard } from "../components/ui/DashboardGrid";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  error: <AlertCircle className="w-4 h-4 text-red-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  info: <Info className="w-4 h-4 text-blue-500" />,
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
};

const NotificationCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, fetchNotifications, markRead, markAllRead } = useNotificationStore();
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filtered = tab === 0 ? notifications : tab === 1 ? notifications.filter(n => !n.read) : notifications.filter(n => n.read);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <Box p={3}>
      <PageHeader title="Notification Center" subtitle="Centralized alerts and reminders across all domains">
        <Box display="flex" gap={1} alignItems="center">
          <Button size="small" variant="outlined" startIcon={<CheckCheck className="w-4 h-4" />}
            onClick={markAllRead} disabled={unreadCount === 0}>
            Mark All Read
          </Button>
          <Button size="small" variant="outlined" startIcon={<Bell className="w-4 h-4" />}
            onClick={() => fetchNotifications()}>
            Refresh
          </Button>
        </Box>
      </PageHeader>

      <KpiCardGrid>
        <StatCard title="Total" value={notifications.length} icon={undefined as any} color="text-blue-600 bg-blue-50" />
        <StatCard title="Unread" value={unreadCount} icon={undefined as any} color="text-amber-600 bg-amber-50" />
        <StatCard title="Errors" value={notifications.filter(n => n.type === "error").length} icon={undefined as any} color="text-red-600 bg-red-50" />
        <StatCard title="Warnings" value={notifications.filter(n => n.type === "warning").length} icon={undefined as any} color="text-orange-600 bg-orange-50" />
      </KpiCardGrid>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`All (${notifications.length})`} />
          <Tab label={`Unread (${unreadCount})`} />
          <Tab label={`Read (${notifications.length - unreadCount})`} />
        </Tabs>
      </Paper>

      {loading ? <CircularProgress sx={{ display: "block", mx: "auto", mt: 4 }} /> : (
        <Paper>
          {filtered.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <Typography color="text.secondary">No notifications</Typography>
            </Box>
          ) : (
            filtered.map((n: AppNotification) => (
              <Box key={n.id}
                sx={{
                  display: "flex", alignItems: "flex-start", gap: 2, px: 3, py: 2.5,
                  borderBottom: "1px solid", borderColor: "divider",
                  bgcolor: n.read ? "transparent" : "action.hover",
                  cursor: n.link ? "pointer" : "default",
                  "&:hover": { bgcolor: "action.selected" },
                  transition: "background-color 0.15s",
                }}
                onClick={() => { if (!n.read) markRead(n.id); if (n.link) navigate(n.link); }}
              >
                <Box sx={{ mt: 0.3 }}>{TYPE_ICONS[n.type] || <Info className="w-4 h-4 text-blue-500" />}</Box>
                <Box flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="body2" fontWeight={n.read ? 400 : 600} noWrap>
                      {n.title}
                    </Typography>
                    {!n.read && <Chip size="small" label="New" color="primary" sx={{ height: 18, fontSize: 10 }} />}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{
                    overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {n.body}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
                    {timeAgo(n.createdAt)}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                  sx={{ opacity: n.read ? 0.3 : 0.6 }}>
                  <CheckCheck className="w-4 h-4" />
                </IconButton>
              </Box>
            ))
          )}
        </Paper>
      )}
    </Box>
  );
};

export default NotificationCenterPage;
