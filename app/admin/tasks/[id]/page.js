"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FilePreview from "@/components/ui/FilePreview";
import Text from "@/components/ui/Text";
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

export default function ViewTodoPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [todo, setTodo] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadTodo = async () => {
      setLoading(true);

      try {
        const [todoRes, docsRes] = await Promise.all([
          fetch(`/api/admin/todos/${params.id}`, { credentials: "include" }),
          fetch(`/api/admin/todos/${params.id}/docs`, { credentials: "include" }),
        ]);

        const todoData = await todoRes.json().catch(() => ({}));
        const docsData = await docsRes.json().catch(() => ({}));

        if (!todoRes.ok) {
          throw new Error(todoData.message || "Failed to load TODO");
        }

        if (!docsRes.ok) {
          throw new Error(docsData.message || "Failed to load TODO docs");
        }

        if (!mounted) return;

        setTodo(todoData.todo || null);
        setDocs(Array.isArray(docsData.docs) ? docsData.docs : []);
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
          <Card className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailRow label="Linked Person" value={todo?.linked_name} />
              <DetailRow label="Type" value={todo?.user_type} />
              <DetailRow label="Purpose" value={todo?.purpose} />
              <DetailRow label="Follow-up Date" value={formatDisplayDate(todo?.follow_up_date)} />
              <DetailRow label="OPS Owner" value={todo?.assign_to_name || todo?.assign_to} />
              <DetailRow label="Status" value={todo?.status} />
              <DetailRow label="Start Time" value={formatDisplayDateTime(todo?.start_time)} />
              <DetailRow
                label="Completion Date"
                value={formatDisplayDateTime(todo?.completion_date)}
              />
              <DetailRow
                label="Time Spent"
                value={formatMinutesAsDuration(todo?.completion_time)}
              />
              <div className="md:col-span-2">
                <DetailRow label="Discussion Details" value={todo?.discussion_details} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <Text variant="h3">Documents</Text>

            <div className="mt-6 space-y-4">
              {docs.length === 0 ? (
                <p className="text-sm text-slate-500">No documents uploaded yet.</p>
              ) : (
                docs.map((doc) => (
                  <div key={doc.id} className="rounded-xl border border-slate-200 p-4">
                    <FilePreview file={doc.docs_file} />
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
