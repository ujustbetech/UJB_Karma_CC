"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getReadNotificationIds,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/userNotificationReadState";
import { fetchApiUserNotifications } from "@/services/userNotificationApiService";

const refreshIntervalMs = 30000;

export default function useUserNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const ujbCode = user?.profile?.ujbCode;
  const intervalRef = useRef(null);

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (!ujbCode) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        if (!silent) {
          setLoading(true);
        }

        const items = await fetchApiUserNotifications();
        const readIds = new Set(getReadNotificationIds(ujbCode));

        setNotifications(
          items.map((item) => ({
            ...item,
            read: readIds.has(item.id),
          }))
        );
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    },
    [ujbCode]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!ujbCode) {
      return undefined;
    }

    intervalRef.current = window.setInterval(() => {
      refresh({ silent: true });
    }, refreshIntervalMs);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [refresh, ujbCode]);

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
