import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchBirthdayUsersForAdmin,
  markBirthdayMessageSent,
  sendBirthdayMessage,
} from "@/services/adminBirthdayService";

export function useBirthdayAdmin(toast) {
  const [users, setUsers] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [unsentList, setUnsentList] = useState([]);
  const [recentSentLogs, setRecentSentLogs] = useState([]);
  const [sendingUserId, setSendingUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [dates, setDates] = useState({
    dayBeforeYesterday: "",
    yesterday: "",
    today: "",
    tomorrow: "",
  });

  const loadBirthdays = useCallback(async () => {
    setLoading(true);

    try {
      const data = await fetchBirthdayUsersForAdmin();
      setUsers(data.users || []);
      setSentMessages(data.sentIds || []);
      setUnsentList(data.unsentList || []);
      setRecentSentLogs(data.recentSentLogs || []);
      setDates({
        dayBeforeYesterday: data.dayBeforeYesterday,
        yesterday: data.yesterday,
        today: data.today,
        tomorrow: data.tomorrow,
      });
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
        await markBirthdayMessageSent(user.id, dates.today);

        setSentMessages((prev) =>
          prev.includes(user.id) ? prev : [...prev, user.id]
        );
        
        setUnsentList((prev) => prev.filter((u) => u.id !== user.id));
        setRecentSentLogs((prev) => [
          {
            id: `${user.id}-${Date.now()}`,
            userId: user.id,
            name: user.name,
            phone: user.phone,
            imageUrl: user.imageUrl || "",
            photoURL: user.photoURL || "",
            sentDate: dates.today,
            status: "sent",
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);

        toast?.success(`WhatsApp sent to ${user.name}`);
      } catch (error) {
        console.error(error);
        toast?.error("Failed to send WhatsApp message");
      } finally {
        setSendingUserId(null);
      }
    },
    [toast, dates.today]
  );

  const lists = useMemo(() => {
    const filterByDate = (date) => users.filter((user) => user.dayMonth === date);
    
    return {
      dayBeforeYesterday: filterByDate(dates.dayBeforeYesterday),
      yesterday: filterByDate(dates.yesterday),
      today: filterByDate(dates.today),
      tomorrow: filterByDate(dates.tomorrow),
    };
  }, [dates, users]);

  return {
    loading,
    sendMessage,
    sendingUserId,
    sentMessages,
    unsentList,
    recentSentLogs,
    dates,
    lists,
    refresh: loadBirthdays,
  };
}
