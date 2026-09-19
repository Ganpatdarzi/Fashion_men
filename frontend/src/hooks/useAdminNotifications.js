import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function useAdminNotifications(intervalMs = 15000) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = () => {
    api.get("/admin/notifications").then((data) => {
      setItems(data.items);
      setUnread(data.unread);
    }).catch(() => {});
  };

  useEffect(() => {
    load();
    const t = setInterval(load, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  const markRead = async (id) => {
    try { await api.put(`/admin/notifications/${id}/read`); } catch {}
    load();
  };

  const markAllRead = async () => {
    try { await api.put("/admin/notifications/read-all"); } catch {}
    load();
  };

  return { items, unread, markRead, markAllRead };
}