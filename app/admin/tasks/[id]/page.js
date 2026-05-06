"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Play, Square } from "lucide-react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FilePreview from "@/components/ui/FilePreview";
import Text from "@/components/ui/Text";
import Textarea from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/ToastProvider";

function formatDisplayDate(value) {
  if (!value) return "-";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year, month, day] = value.trim().split("-");
    return `${day}/${month}/${year.slice(-2)}`;
  }

  const parsed = new Date(value?.seconds ? value.seconds * 1000 : value);
  if (Number.isNaN(parsed.getTime())) return "-";

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function formatDisplayDateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value?.seconds ? value.seconds * 1000 : value);
  if (Number.isNaN(parsed.getTime())) return "-";

  const date = formatDisplayDate(parsed);
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${date} ${hours}:${minutes}`;
}

function formatMinutesAsDuration(value) {
  if (value === null || typeof value === "undefined" || value === "") {
    return "-";
  }

  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return "-";
  if (minutes < 60) return `${minutes} min`;

  const hoursPart = Math.floor(minutes / 60);
  const minutesPart = minutes % 60;

  return minutesPart ? `${hoursPart} hr ${minutesPart} min` : `${hoursPart} hr`;
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900">{value || "-"}</p>
    </div>
  );
}

function formatTimer(startTimeIso, nowTick) {
  if (!startTimeIso || !nowTick) return "00:00:00";
  const start = new Date(startTimeIso).getTime();
  if (Number.isNaN(start)) return "00:00:00";
  const elapsedSeconds = Math.max(0, Math.floor((nowTick - start) / 1000));
  const hours = String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export default function ViewTodoPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [todo, setTodo] = useState(null);
  const [docs, setDocs] = useState([]);
  const [linkedProfile, setLinkedProfile] = useState(null);
  const [recentTodos, setRecentTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startLoading, setStartLoading] = useState(false);
  const [stopLoading, setStopLoading] = useState(false);
  const [showStopNote, setShowStopNote] = useState(false);
  const [stopNote, setStopNote] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    let mounted = true;

    const loadTodo = async () => {
      setLoading(true);

      try {
        const [todoRes, docsRes, linkedRes] = await Promise.all([
          fetch(`/api/admin/todos/${params.id}`, { credentials: "include" }),
          fetch(`/api/admin/todos/${params.id}/docs`, { credentials: "include" }),
          fetch(`/api/admin/todos/${params.id}/linked`, { credentials: "include" }),
        ]);

        const todoData = await todoRes.json().catch(() => ({}));
        const docsData = await docsRes.json().catch(() => ({}));
        const linkedData = await linkedRes.json().catch(() => ({}));

        if (!todoRes.ok) {
          throw new Error(todoData.message || "Failed to load TODO");
        }

        if (!docsRes.ok) {
          throw new Error(docsData.message || "Failed to load TODO docs");
        }
        if (!linkedRes.ok) {
          throw new Error(linkedData.message || "Failed to load linked details");
        }

        if (!mounted) return;

        setTodo(todoData.todo || null);
        setDocs(Array.isArray(docsData.docs) ? docsData.docs : []);
        setLinkedProfile(linkedData.profile || null);
        setRecentTodos(Array.isArray(linkedData.recentTodos) ? linkedData.recentTodos : []);
      } catch (error) {
        if (mounted) {
          toast.error(error.message || "Failed to load TODO");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (params.id) {
      loadTodo();
    }

    return () => {
      mounted = false;
    };
  }, [params.id, toast]);

  useEffect(() => {
    if (todo?.status !== "In Progress") {
      return undefined;
    }

    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [todo?.status]);

  const liveTimer = useMemo(
    () => formatTimer(todo?.start_time, nowTick),
    [todo?.start_time, nowTick]
  );

  const handleStart = async () => {
    setStartLoading(true);
    try {
      const res = await fetch(`/api/admin/todos/${params.id}/start`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to start TODO");
      }
      setTodo((prev) => ({ ...prev, ...(data.todo || {}) }));
      toast.success("TODO started");
    } catch (error) {
      toast.error(error.message || "Failed to start TODO");
    } finally {
      setStartLoading(false);
    }
  };

  const handleStop = async () => {
    setStopLoading(true);
    try {
      const res = await fetch(`/api/admin/todos/${params.id}/done`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note: stopNote }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to stop TODO");
      }
      setTodo((prev) => ({ ...prev, ...(data.todo || {}) }));
      setShowStopNote(false);
      setStopNote("");
      toast.success("TODO completed");
    } catch (error) {
      toast.error(error.message || "Failed to stop TODO");
    } finally {
      setStopLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Text variant="h1">View TODO</Text>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/admin/tasks")}>
            <ArrowLeft size={16} /> Back to My TODO
          </Button>
          <Button onClick={() => router.push(`/admin/tasks/${params.id}/edit`)}>
            <Pencil size={16} /> Edit TODO
          </Button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <Card className="p-6 xl:col-span-3">
              <Text variant="h3">Prospect / Orbitor Info</Text>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailRow label="Name" value={linkedProfile?.name || todo?.linked_name} />
                <DetailRow label="Type" value={linkedProfile?.type || todo?.user_type} />
                <DetailRow label="Code" value={linkedProfile?.code} />
                <DetailRow label="Email" value={linkedProfile?.email} />
                <DetailRow label="Phone" value={linkedProfile?.phone} />
                <DetailRow label="Category" value={linkedProfile?.category} />
                <div className="md:col-span-2">
                  <DetailRow
                    label="Preferred Communication"
                    value={linkedProfile?.preferredCommunication}
                  />
                </div>
              </div>

              <div className="mt-6">
                <Text variant="h3">Last 5 TODO</Text>
                <div className="mt-4 space-y-3">
                  {recentTodos.length === 0 ? (
                    <p className="text-sm text-slate-500">No previous TODOs found.</p>
                  ) : (
                    recentTodos.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-slate-200 p-4">
                        <p className="text-sm font-medium text-slate-900">{entry.purpose || "-"}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDisplayDate(entry.follow_up_date)} | {entry.status || "-"}
                        </p>
                        <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
                          {entry.discussion_details || "-"}
                        </p>
                        <div className="mt-3 space-y-2">
                          {Array.isArray(entry.docs) && entry.docs.length > 0 ? (
                            entry.docs.map((doc) => (
                              <div key={doc.id} className="rounded-lg border border-slate-200 p-3">
                                <FilePreview file={doc.docs_file} />
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-500">No files uploaded.</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6 xl:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <Text variant="h3">Current TODO</Text>
                <div className="flex items-center gap-2">
                  {todo?.status === "Pending" && (
                    <Button onClick={handleStart} disabled={startLoading}>
                      <Play size={16} /> {startLoading ? "Starting..." : "Start"}
                    </Button>
                  )}
                  {todo?.status === "In Progress" && (
                    <Button onClick={() => setShowStopNote(true)} disabled={stopLoading}>
                      <Square size={16} /> Stop
                    </Button>
                  )}
                  <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                    {todo?.status === "In Progress" ? liveTimer : formatMinutesAsDuration(todo?.completion_time)}
                  </span>
                </div>
              </div>

              {showStopNote && todo?.status === "In Progress" && (
                <div className="mt-4 rounded-xl border border-slate-200 p-4 space-y-3">
                  <p className="text-sm font-medium text-slate-800">Add stop note</p>
                  <Textarea
                    rows={4}
                    value={stopNote}
                    onChange={(event) => setStopNote(event.target.value)}
                    placeholder="Write completion note..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowStopNote(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleStop} disabled={stopLoading}>
                      {stopLoading ? "Saving..." : "Submit & Stop"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-4">
                <DetailRow label="Purpose" value={todo?.purpose} />
                <DetailRow label="Follow-up Date" value={formatDisplayDate(todo?.follow_up_date)} />
                <DetailRow label="OPS Owner" value={todo?.assign_to_name || todo?.assign_to} />
                <DetailRow label="Status" value={todo?.status} />
                <DetailRow label="Start Time" value={formatDisplayDateTime(todo?.start_time)} />
                <DetailRow label="Completion Date" value={formatDisplayDateTime(todo?.completion_date)} />
                <DetailRow label="Time Spent" value={formatMinutesAsDuration(todo?.completion_time)} />
                <DetailRow label="Discussion Details" value={todo?.discussion_details} />
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Documents</p>
                  <div className="mt-3 space-y-3">
                    {docs.length === 0 ? (
                      <p className="text-sm text-slate-500">No documents uploaded yet.</p>
                    ) : (
                      docs.map((doc) => (
                        <div key={doc.id} className="rounded-lg border border-slate-200 p-3">
                          <FilePreview file={doc.docs_file} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => router.push(`/admin/tasks/${params.id}/edit`)}>
                    <Pencil size={16} /> Edit TODO
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
