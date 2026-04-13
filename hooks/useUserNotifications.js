"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchUserNotifications,
  getReadNotificationIds,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notificationService";

export default function useUserNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const ujbCode = user?.profile?.ujbCode;
  const phone = user?.phone;
  const category = user?.profile?.category;

  const refresh = useCallback(async () => {
    if (!ujbCode) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const items = await fetchUserNotifications({ ujbCode, phone, category });
      const readIds = new Set(getReadNotificationIds(ujbCode));

      setNotifications(
        items.map((item) => ({
          ...item,
          read: readIds.has(item.id),
        }))
      );
    } catch (error) {
      console.error("Failed to load notifications", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [category, phone, ujbCode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const markOneRead = useCallback(
    (notificationId) => {
      if (!ujbCode) return;

      markNotificationAsRead(ujbCode, notificationId);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item
        )
      );
    },
    [ujbCode]
  );

  const markAllRead = useCallback(() => {
    if (!ujbCode) return;

    const ids = notifications.map((item) => item.id);
    markAllNotificationsAsRead(ujbCode, ids);
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, [notifications, ujbCode]);

  return {
    notifications,
    unreadCount,
    loading,
    refresh,
    markOneRead,
    markAllRead,
  };
}
