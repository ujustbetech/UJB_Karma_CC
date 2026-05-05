"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProspectNeedTimeNotePage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params?.token || "");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitNote = async (event) => {
    event.preventDefault();
    const trimmed = note.trim();
    if (!trimmed) {
      setError("Please enter your note.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const res = await fetch(`/api/prospect-actions/${encodeURIComponent(token)}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit your note.");
      }
      router.replace("/prospect-actions/thanks");
    } catch (err) {
      setError(err?.message || "Failed to submit your note.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Need Some Time</h1>
        <p className="mt-3 text-slate-700">
          Please share a short note so we can follow up with you at the right time.
        </p>
        <form className="mt-5 space-y-4" onSubmit={submitNote}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-32 w-full rounded-lg border border-slate-300 p-3"
            placeholder="Write your note..."
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </main>
  );
}

