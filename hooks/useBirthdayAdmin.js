import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchBirthdayUsersForAdmin,
  markBirthdayMessageSent,
  sendBirthdayMessage,
} from "@/services/birthdayService";

export function useBirthdayAdmin(toast) {
  const [users, setUsers] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [sendingUserId, setSendingUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState("");
  const [tomorrow, setTomorrow] = useState("");

  const loadBirthdays = useCallback(async () => {
    setLoading(true);

    try {
      const data = await fetchBirthdayUsersForAdmin();
      setUsers(data.users);
      setSentMessages(data.sentIds);
      setToday(data.today);
      setTomorrow(data.tomorrow);
    } catch (error) {
      console.error(error);
      toast?.error("Failed to load birthday users");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadBirthdays();
  }, [loadBirthdays]);

  const sendMessage = useCallback(
    async (user) => {
      setSendingUserId(user.id);

      try {
        await sendBirthdayMessage(user);
        await markBirthdayMessageSent(user.id, today);

        setSentMessages((prev) =>
          prev.includes(user.id) ? prev : [...prev, user.id]
        );

        toast?.success(`WhatsApp sent to ${user.name}`);
      } catch (error) {
        console.error(error);
        toast?.error("Failed to send WhatsApp message");
      } finally {
        setSendingUserId(null);
      }
    },
    [toast, today]
  );

  const todayList = useMemo(
    () => users.filter((user) => user.dayMonth === today),
    [today, users]
  );

  const tomorrowList = useMemo(
    () => users.filter((user) => user.dayMonth === tomorrow),
    [tomorrow, users]
  );

  return {
    loading,
    sendMessage,
    sendingUserId,
    sentMessages,
    today,
    todayList,
    tomorrow,
    tomorrowList,
  };
}
