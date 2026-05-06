"use client";

import { useMemo, useState, useEffect } from "react";
import {
  CalendarDays,
  CalendarClock,
  CheckCircle,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  History,
  Plus,
  ChevronLeft,
  ChevronRight,
  Phone,
} from "lucide-react";
import Link from "next/link";

import { useToast } from "@/components/ui/ToastProvider";
import { useBirthdayAdmin } from "@/hooks/useBirthdayAdmin";
import { getDateLabel } from "@/services/birthdayShared";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";

/* ---------------- STATUS COMPONENT ---------------- */

const Status = ({ sent, sending }) => {
  if (sending) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
        <Loader2 size={12} className="animate-spin" />
        Sending
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
        <CheckCircle size={12} />
        Sent
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
      <Clock size={12} />
      Pending
    </div>
  );
};

/* ---------------- BIRTHDAY TABLE COMPONENT ---------------- */

const BirthdayTable = ({ title, date, list, tone = "slate", loading, sentMessages, sendingUserId, sendMessage }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const toneStyles = {
    slate: {
      badge: "bg-slate-50 text-slate-600 border-slate-200",
      row: "hover:bg-slate-50/70",
    },
    blue: {
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      row: "hover:bg-blue-50/40",
    },
    amber: {
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      row: "hover:bg-amber-50/40",
    },
    rose: {
      badge: "bg-rose-50 text-rose-700 border-rose-200",
      row: "hover:bg-rose-50/40",
    },
  };

  const styles = toneStyles[tone] || toneStyles.slate;

  // Reset page when list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [list.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
        <Loader2 size={20} className="animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading data...</span>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="py-12 text-center text-sm italic text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm">
        No records found.
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedList = list.slice((activePage - 1) * pageSize, activePage * pageSize);

  return (
    <div className="space-y-4">
      {/* MOBILE CARD VIEW */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {paginatedList.map((user) => {
          const isSent = sentMessages.includes(user.id);
          const isSending = sendingUserId === user.id;

          return (
            <div key={`card-${title}-${user.id}`} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:border-blue-100 transition-all">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-full border border-slate-200 bg-white shrink-0">
                    {user.imageUrl || user.photoURL ? (
                      <img src={user.imageUrl || user.photoURL} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-300">
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase truncate tracking-widest mb-0.5">
                      {title} • {date}
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 truncate">{user.name}</div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-slate-500">
                      <Phone size={11} className="text-slate-300" />
                      <span className="truncate">{user.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 pt-1">
                  {!user.hasCanva ? (
                    <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded whitespace-nowrap">
                      Missing
                    </div>
                  ) : (
                    <div className="whitespace-nowrap">
                      <Status sent={isSent} sending={isSending} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                 {!user.hasCanva ? (
                    <Link
                      href={`/admin/birthday/add?id=${user.id}&name=${encodeURIComponent(user.name)}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <Plus size={14} />
                      Add Canva
                    </Link>
                  ) : (
                    <button
                      onClick={() => sendMessage(user)}
                      disabled={isSent || isSending}
                      className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all shadow-sm ${
                        isSent 
                          ? "bg-emerald-50 text-emerald-600" 
                          : isSending 
                            ? "bg-blue-50 text-blue-600" 
                            : "bg-blue-600 text-white"
                      } disabled:opacity-50`}
                    >
                      {isSending ? <Loader2 size={16} className="animate-spin" /> : isSent ? <CheckCircle size={16} /> : <Send size={16} />}
                      {isSent ? "Completed" : isSending ? "Sending..." : "Send WhatsApp"}
                    </button>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              <th className="hidden lg:table-cell px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Window</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone</th>
              <th className="hidden md:table-cell px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Member</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedList.map((user) => {
              const isSent = sentMessages.includes(user.id);
              const isSending = sendingUserId === user.id;

              return (
                <tr key={`${title}-${user.id}`} className={`transition-colors group ${styles.row}`}>
                  <td className="hidden lg:table-cell px-4 py-3 align-top">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${styles.badge}`}>
                        {title}
                      </span>
                      <span className="text-xs font-medium text-slate-500">{date}</span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-sm font-medium text-slate-600">
                    {user.phone}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-white shrink-0">
                        {user.imageUrl || user.photoURL ? (
                          <img src={user.imageUrl || user.photoURL} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-300">
                            {user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{user.name}</div>
                        <div className="text-[10px] font-medium text-slate-400 uppercase lg:hidden truncate max-w-[120px]">
                          {title} • {date}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {!user.hasCanva ? (
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        <AlertCircle size={12} />
                        Missing
                      </div>
                    ) : (
                      <Status sent={isSent} sending={isSending} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!user.hasCanva ? (
                      <Link
                        href={`/admin/birthday/add?id=${user.id}&name=${encodeURIComponent(user.name)}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        <Plus size={14} />
                        Add Canva
                      </Link>
                    ) : (
                      <button
                        onClick={() => sendMessage(user)}
                        disabled={isSent || isSending}
                        className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
                          isSent 
                            ? "bg-emerald-50 text-emerald-600" 
                            : isSending 
                              ? "bg-blue-50 text-blue-600" 
                              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200"
                        } disabled:opacity-50`}
                      >
                        {isSending ? <Loader2 size={14} className="animate-spin" /> : isSent ? <CheckCircle size={14} /> : <Send size={14} />}
                        {isSent ? "Sent" : isSending ? "Sending..." : "Send"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center sm:text-left">
            Showing {paginatedList.length} of {list.length} records
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={activePage === 1}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <div className="min-w-[60px] text-center text-[10px] font-bold text-slate-900 bg-slate-50 py-1.5 rounded-lg border border-slate-100">
              {activePage} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={activePage === totalPages}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------- STAT ITEM ---------------- */

const StatItem = ({ icon: Icon, label, value, color = "text-slate-600" }) => (
  <Card className="flex flex-1 items-center gap-3 sm:gap-4 p-3 sm:p-4 shadow-sm border border-slate-100 hover:border-blue-100 transition-colors">
    <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-slate-50 ${color} shrink-0`}>
      <Icon size={16} className="sm:w-5 sm:h-5" />
    </div>
    <div className="min-w-0">
      <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{label}</div>
      <div className="text-lg sm:text-xl font-bold text-slate-900">{value}</div>
    </div>
  </Card>
);

const SectionHeader = ({ title, date, icon: Icon, count, color = "text-slate-700" }) => (
  <div className="mb-3 flex flex-wrap items-center justify-between gap-y-2 px-1">
    <div className="flex items-center gap-2 font-bold text-slate-800">
      <div className={`rounded-lg bg-slate-50 p-1.5 ${color}`}>
        <Icon size={16} />
      </div>
      <span className="text-sm sm:text-base">{title}</span>
      <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {date}
      </span>
    </div>
    <div className="rounded-md bg-slate-50 px-2 py-1 text-[10px] sm:text-xs font-bold text-slate-400">
      {count} Records
    </div>
  </div>
);

/* ---------------- MAIN COMPONENT ---------------- */

export default function BirthdayClient() {
  const toast = useToast();
  const {
    loading,
    sendMessage,
    sendingUserId,
    sentMessages,
    unsentList,
    recentSentLogs,
    dates,
    lists,
  } = useBirthdayAdmin(toast);
  
  const [logPageSize, setLogPageSize] = useState(10);
  const [logPage, setLogPage] = useState(1);

  const recentLogRows = useMemo(() => recentSentLogs.slice(0, 200), [recentSentLogs]);
  const logTotalPages = Math.max(1, Math.ceil(recentLogRows.length / logPageSize));
  const activeLogPage = Math.min(logPage, logTotalPages);
  const paginatedRecentLogs = useMemo(() => {
    const startIndex = (activeLogPage - 1) * logPageSize;
    return recentLogRows.slice(startIndex, startIndex + logPageSize);
  }, [activeLogPage, logPageSize, recentLogRows]);

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4">
      <div className="mb-10 pt-4 gap-1 flex flex-col">
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <CalendarDays size={20} />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">Management</span>
        </div>
        <Text variant="h1" className="text-2xl sm:text-3xl">Birthday Dashboard</Text>
        <Text variant="muted" className="text-sm sm:text-base">Monitor upcoming celebrations and distribute approved creatives to members.</Text>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-12">
        <StatItem icon={History} label={getDateLabel(-2)} value={lists.dayBeforeYesterday.length} />
        <StatItem icon={History} label={getDateLabel(-1)} value={lists.yesterday.length} />
        <StatItem icon={CalendarDays} label="Today" value={lists.today.length} color="text-blue-600" />
        <StatItem icon={CalendarClock} label="Tomorrow" value={lists.tomorrow.length} color="text-amber-500" />
        <StatItem icon={AlertCircle} label="Unsent" value={unsentList.length} color="text-rose-500" />
      </div>

      {/* UNSENT SECTION */}
      {unsentList.length > 0 && (
        <div className="mb-10">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-y-2 px-1">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600">
                <AlertCircle size={16} />
              </div>
              <span className="text-sm sm:text-base text-rose-700">Priority: Unsent Messages</span>
            </div>
            <div className="rounded-md bg-rose-50 px-2 py-1 text-[10px] sm:text-xs font-bold text-rose-400">
              {unsentList.length} Records
            </div>
          </div>
          <BirthdayTable
            title="Unsent"
            date="Action Required"
            list={unsentList}
            tone="rose"
            loading={loading}
            sentMessages={sentMessages}
            sendingUserId={sendingUserId}
            sendMessage={sendMessage}
          />
        </div>
      )}

      <div className="mb-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-y-2 px-1">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <div className="rounded-lg bg-slate-50 p-1.5 text-slate-700">
              <History size={16} />
            </div>
            <span className="text-sm sm:text-base">Birthday Schedule</span>
          </div>
          <div className="rounded-md bg-slate-50 px-2 py-1 text-[10px] sm:text-xs font-bold text-slate-400">
            {lists.today.length + lists.tomorrow.length + lists.yesterday.length + lists.dayBeforeYesterday.length} Records
          </div>
        </div>

        <div className="space-y-12">
          {lists.today.length > 0 && (
            <div>
              <SectionHeader
                title="Today"
                date={dates.today}
                icon={CalendarDays}
                count={lists.today.length}
                color="text-blue-600"
              />
              <BirthdayTable
                title="Today"
                date={dates.today}
                list={lists.today}
                tone="blue"
                loading={loading}
                sentMessages={sentMessages}
                sendingUserId={sendingUserId}
                sendMessage={sendMessage}
              />
            </div>
          )}
          {lists.tomorrow.length > 0 && (
            <div>
              <SectionHeader
                title="Tomorrow"
                date={dates.tomorrow}
                icon={CalendarClock}
                count={lists.tomorrow.length}
                color="text-amber-500"
              />
              <BirthdayTable
                title="Tomorrow"
                date={dates.tomorrow}
                list={lists.tomorrow}
                tone="amber"
                loading={loading}
                sentMessages={sentMessages}
                sendingUserId={sendingUserId}
                sendMessage={sendMessage}
              />
            </div>
          )}
          {lists.yesterday.length > 0 && (
            <div>
              <SectionHeader
                title="Yesterday"
                date={dates.yesterday}
                icon={History}
                count={lists.yesterday.length}
              />
              <BirthdayTable
                title="Yesterday"
                date={dates.yesterday}
                list={lists.yesterday}
                tone="slate"
                loading={loading}
                sentMessages={sentMessages}
                sendingUserId={sendingUserId}
                sendMessage={sendMessage}
              />
            </div>
          )}
          {lists.dayBeforeYesterday.length > 0 && (
            <div>
              <SectionHeader
                title="Day Before Yesterday"
                date={dates.dayBeforeYesterday}
                icon={History}
                count={lists.dayBeforeYesterday.length}
              />
              <BirthdayTable
                title="Day Before Yesterday"
                date={dates.dayBeforeYesterday}
                list={lists.dayBeforeYesterday}
                tone="slate"
                loading={loading}
                sentMessages={sentMessages}
                sendingUserId={sendingUserId}
                sendMessage={sendMessage}
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <CheckCircle size={16} />
            </div>
            <span className="text-sm sm:text-base">Last Sent Log</span>
            <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Last 200 Logs
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm self-end sm:self-auto">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Rows
            </label>
            <select
              value={logPageSize}
              onChange={(event) => {
                setLogPageSize(Number(event.target.value));
                setLogPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none shadow-sm"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* MOBILE VIEW FOR LOGS */}
        <div className="grid grid-cols-1 gap-4 sm:hidden mb-4">
           {loading ? (
             <div className="py-12 text-center text-slate-400">
               <Loader2 size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
               <span className="text-sm font-medium">Loading logs...</span>
             </div>
           ) : paginatedRecentLogs.length === 0 ? (
             <div className="py-12 text-center text-sm italic text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm">
               No sent messages found.
             </div>
           ) : (
             paginatedRecentLogs.map((log) => (
               <div key={`log-card-${log.id}`} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-white shrink-0">
                        {log.imageUrl || log.photoURL ? (
                          <img src={log.imageUrl || log.photoURL} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-300">
                            {log.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{log.name}</div>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 uppercase">
                          <CheckCircle size={10} className="text-emerald-500" />
                          {log.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="text-xs font-bold text-slate-800">{log.sentDate}</div>
                       <div className="text-[9px] text-slate-400">
                         {log.timestamp ? new Date(log.timestamp).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }) : ""}
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50 text-slate-500">
                    <Phone size={12} className="text-slate-300" />
                    <span className="text-[10px] font-medium tracking-wider">{log.phone}</span>
                  </div>
               </div>
             ))
           )}
        </div>

        {/* DESKTOP VIEW FOR LOGS */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm mb-4">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Sent On</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Member</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden sm:table-cell">Phone</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin text-blue-600" />
                      <span className="text-sm font-medium">Loading logs...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRecentLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm italic text-slate-400">
                    No sent messages found.
                  </td>
                </tr>
              ) : (
                paginatedRecentLogs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-slate-50/70 group">
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-800">{log.sentDate}</div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }) : "Time unavailable"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-white shrink-0">
                          {log.imageUrl || log.photoURL ? (
                            <img src={log.imageUrl || log.photoURL} className="h-full w-full object-cover" alt="" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-300">
                              {log.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 line-clamp-1">{log.name}</div>
                          <div className="text-[10px] text-slate-400 sm:hidden">{log.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-600 hidden sm:table-cell">{log.phone}</td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-600">
                        <CheckCircle size={12} />
                        {log.status}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center sm:text-left">
            Showing {paginatedRecentLogs.length} of {recentLogRows.length} logs
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setLogPage((prev) => Math.max(1, prev - 1))}
              disabled={activeLogPage === 1}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <div className="min-w-[88px] text-center text-sm font-bold text-slate-900 bg-slate-50 py-2 rounded-lg border border-slate-100">
              {activeLogPage} / {logTotalPages}
            </div>
            <button
              type="button"
              onClick={() => setLogPage((prev) => Math.min(logTotalPages, prev + 1))}
              disabled={activeLogPage === logTotalPages}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
