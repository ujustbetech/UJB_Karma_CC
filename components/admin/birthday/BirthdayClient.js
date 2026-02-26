"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import axios from "axios";
import {
  CalendarDays,
  CalendarClock,
  CheckCircle,
  Clock,
  Send,
  Loader2,
  User,
} from "lucide-react";

import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

import AdminLayout from "@/components/layout/AdminLayout";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";

/* ---------------- HELPERS ---------------- */

const getFormattedDate = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}`;
};

/* ---------------- SMALL UI PARTS ---------------- */

const StatItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 text-sm text-slate-600">
    <Icon size={16} />
    <span>{label}:</span>
    <span className="font-medium text-slate-900">{value}</span>
  </div>
);

const Status = ({ sent, sending }) => {
  if (sending) {
    return (
      <div className="flex items-center gap-1 text-sm text-slate-500">
        <Loader2 size={14} className="animate-spin" />
        Sending
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex items-center gap-1 text-sm text-green-600">
        <CheckCircle size={14} />
        Sent
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-sm text-slate-500">
      <Clock size={14} />
      Pending
    </div>
  );
};

/* ---------------- COMPONENT ---------------- */

export default function BirthdayClient() {
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [confirmUser, setConfirmUser] = useState(null);
  const [sendingUserId, setSendingUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = getFormattedDate(0);
  const tomorrow = getFormattedDate(1);

  /* ---------------- FETCH USERS ---------------- */

  const fetchBirthdayUsers = async () => {
    setLoading(true);

    const snapshot = await getDocs(
      collection(db, COLLECTIONS.birthdayCanva)
    );

    const result = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.dob) return;

      const dobDate =
        data.dob?.toDate ? data.dob.toDate() : new Date(data.dob);

      const dayMonth = `${String(dobDate.getDate()).padStart(
        2,
        "0"
      )}/${String(dobDate.getMonth() + 1).padStart(2, "0")}`;

      if (dayMonth === today || dayMonth === tomorrow) {
        result.push({ id: docSnap.id, ...data, dayMonth });
      }
    });

    setUsers(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchBirthdayUsers();
  }, []);

  /* ---------------- SEND WHATSAPP ---------------- */

  const sendWhatsAppMessage = async (user) => {
    setSendingUserId(user.id);

    try {
      await axios.post("/api/send-birthday", { user });
      setSentMessages((prev) => [...prev, user.id]);
      toast.success(`Message sent to ${user.name}`);
    } catch {
      toast.error("Failed to send WhatsApp message");
    } finally {
      setSendingUserId(null);
      setConfirmUser(null);
    }
  };

  /* ---------------- FILTERS ---------------- */

  const todayList = users.filter((u) => u.dayMonth === today);
  const tomorrowList = users.filter((u) => u.dayMonth === tomorrow);

  /* ---------------- ROW ---------------- */

  const BirthdayRow = (user) => {
    const isSent = sentMessages.includes(user.id);
    const isSending = sendingUserId === user.id;

    return (
      <div
        key={user.id}
        className="flex items-center justify-between px-4 py-3 border-b border-slate-200 hover:bg-slate-50"
      >
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center">
            <User size={16} className="text-slate-600" />
          </div>

          <div>
            <div className="text-sm font-medium text-slate-900">
              {user.name}
            </div>
            <div className="text-xs text-slate-500">
              {user.phone}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-6">
          <Status sent={isSent} sending={isSending} />

          <button
            onClick={() => setConfirmUser(user)}
            disabled={isSent || isSending}
            className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-40"
            title={isSent ? "Already sent" : "Send WhatsApp"}
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isSent ? (
              <CheckCircle size={16} />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    );
  };

  /* ---------------- SECTION ---------------- */

  const Section = ({ title, icon: Icon, list }) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-700">
        <Icon size={16} />
        {title}
      </div>

      <div className="border border-slate-200 rounded-md bg-white">
        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-500">
            Loading...
          </div>
        ) : list.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">
            No birthdays scheduled
          </div>
        ) : (
          list.map(BirthdayRow)
        )}
      </div>
    </div>
  );

  /* ---------------- RENDER ---------------- */

  return (
    <>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Birthday Messages
        </h1>
        <p className="text-sm text-slate-500">
          Send WhatsApp birthday wishes to customers
        </p>
      </div>

      {/* STATS */}
      <div className="flex gap-6 mb-8">
        <StatItem
          icon={CalendarDays}
          label="Today"
          value={todayList.length}
        />
        <StatItem
          icon={CalendarClock}
          label="Tomorrow"
          value={tomorrowList.length}
        />
        <StatItem
          icon={CheckCircle}
          label="Sent"
          value={sentMessages.length}
        />
      </div>

      {/* SECTIONS */}
      <Section
        title="Today"
        icon={CalendarDays}
        list={todayList}
      />

      <Section
        title="Tomorrow"
        icon={CalendarClock}
        list={tomorrowList}
      />

      {/* CONFIRM */}
      {confirmUser && (
        <ConfirmModal
          title="Send WhatsApp message?"
          message={
            <div className="space-y-1">
              <div className="font-medium">{confirmUser.name}</div>
              <div className="text-sm text-slate-500">
                {confirmUser.phone}
              </div>
            </div>
          }
          confirmText="Send"
          loading={sendingUserId === confirmUser.id}
          onConfirm={() => sendWhatsAppMessage(confirmUser)}
          onCancel={() => setConfirmUser(null)}
        />
      )}
    </>
  );
}
