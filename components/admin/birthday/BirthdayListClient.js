"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import StatusBadge from "@/components/ui/StatusBadge";
import ActionButton from "@/components/ui/ActionButton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";

import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";

const PAGE_SIZE = 10;

export default function BirthdayListClient() {
  const router = useRouter();
  const toast = useToast();

  /* ---------------- STATE ---------------- */

  const [rows, setRows] = useState([]);

  const [monthFilter, setMonthFilter] = useState("");
  const [imageFilter, setImageFilter] = useState("");
  const [mentorFilter, setMentorFilter] = useState("");

  const [page, setPage] = useState(1);

  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ---------------- FETCH ---------------- */

  useEffect(() => {
    async function load() {
      const snap = await getDocs(
        collection(db, COLLECTIONS.birthdayCanva)
      );

      setRows(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    }

    load();
  }, []);

  /* ---------------- DATE HELPERS ---------------- */

  const isToday = (dob) => {
    if (!dob) return false;
    const d = new Date(dob);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth()
    );
  };

  const isTomorrow = (dob) => {
    if (!dob) return false;
    const d = new Date(dob);
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return (
      d.getDate() === t.getDate() &&
      d.getMonth() === t.getMonth()
    );
  };

  const isThisWeek = (dob) => {
    if (!dob) return false;
    const now = new Date();
    const d = new Date(dob);
    d.setFullYear(now.getFullYear());
    const end = new Date(now);
    end.setDate(now.getDate() + 7);
    return d > now && d <= end;
  };

  const formatDob = (dob) => {
    if (!dob) return "—";
    return new Date(dob).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

  /* ---------------- FILTERED DATA ---------------- */

  const mentors = Array.from(
    new Set(rows.map((r) => r.mentorName).filter(Boolean))
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const dobDate = row.dob ? new Date(row.dob) : null;

      if (monthFilter && dobDate) {
        if (dobDate.getMonth() + 1 !== Number(monthFilter)) {
          return false;
        }
      }

      if (imageFilter === "yes" && !row.imageUrl) return false;
      if (imageFilter === "no" && row.imageUrl) return false;

      if (mentorFilter && row.mentorName !== mentorFilter) {
        return false;
      }

      return true;
    });
  }, [rows, monthFilter, imageFilter, mentorFilter]);

  /* ---------------- COUNTS ---------------- */

  const totalCount = rows.length;
  const filteredCount = filteredRows.length;

  /* ---------------- PAGINATION ---------------- */

  const totalPages = Math.ceil(filteredCount / PAGE_SIZE);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  useEffect(() => {
    setPage(1);
  }, [monthFilter, imageFilter, mentorFilter]);

  /* ---------------- CLEAR FILTERS ---------------- */

  const clearFilters = () => {
    setMonthFilter("");
    setImageFilter("");
    setMentorFilter("");
  };

  /* ---------------- DELETE ---------------- */

  const handleDelete = async () => {
    if (!deleteRow) return;

    setDeleting(true);
    try {
      await deleteDoc(
        doc(db, COLLECTIONS.birthdayCanva, deleteRow.id)
      );

      setRows((prev) =>
        prev.filter((r) => r.id !== deleteRow.id)
      );

      toast.success(
        `Birthday Canva revoked for ${deleteRow.name}`
      );
    } catch {
      toast.error("Failed to revoke Birthday Canva");
    } finally {
      setDeleting(false);
      setDeleteRow(null);
    }
  };

  /* ---------------- TABLE COLUMNS ---------------- */

  const columns = [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "dob", label: "DOB" },
    { key: "upcoming", label: "Upcoming" },
    { key: "mentor", label: "Mentor" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "status", label: "Status" },
    { key: "actions", label: "" },
  ];

  /* ---------------- UI ---------------- */

  return (
    <>
      {/* <Text variant="h1">Birthday List</Text> */}

      <Card>
        {/* FILTERS + COUNT */}
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Month */}
            <div>
              <Text variant="muted">Month</Text>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                <option value="">All</option>
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("en-US", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>

            {/* Image */}
            <div>
              <Text variant="muted">Image</Text>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={imageFilter}
                onChange={(e) => setImageFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="yes">Uploaded</option>
                <option value="no">Missing</option>
              </select>
            </div>

            {/* Mentor */}
            <div>
              <Text variant="muted">Mentor</Text>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={mentorFilter}
                onChange={(e) => setMentorFilter(e.target.value)}
              >
                <option value="">All</option>
                {mentors.map((mentor) => (
                  <option key={mentor} value={mentor}>
                    {mentor}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Text variant="muted">
              Showing {filteredCount} of {totalCount}
            </Text>

            {(monthFilter || imageFilter || mentorFilter) && (
              <button
                onClick={clearFilters}
                className="text-sm underline text-slate-600 hover:text-slate-900"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* TABLE */}
        <Table>
          <TableHeader columns={columns} />

          <tbody>
            {paginatedRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6">
                  <Text variant="muted">
                    {rows.length === 0
                      ? "No birthday records available"
                      : "No birthdays match the selected filters"}
                  </Text>
                </td>
              </tr>
            )}

            {paginatedRows.map((row) => (
              <TableRow key={row.id}>
                <td className="px-4 py-4">
                  <Text variant="h3">{row.name || "—"}</Text>
                </td>

                <td className="px-4 py-4">
                  <Text variant="muted">{row.phone || "—"}</Text>
                </td>

                <td className="px-4 py-4">
                  <Text variant="muted">{formatDob(row.dob)}</Text>
                </td>

                <td className="px-4 py-4">
                  {isToday(row.dob) && (
                    <StatusBadge status="success" label="Today" tone="table" />
                  )}
                  {isTomorrow(row.dob) && (
                    <StatusBadge status="warning" label="Tomorrow" tone="table" />
                  )}
                  {!isToday(row.dob) &&
                    !isTomorrow(row.dob) &&
                    isThisWeek(row.dob) && (
                      <StatusBadge status="pending" label="This Week" tone="table" />
                    )}
                </td>

                <td className="px-4 py-4">
                  <Text variant="muted">{row.mentorName || "—"}</Text>
                </td>

                <td className="px-4 py-4">
                  <StatusBadge
                    tone="table"
                    status={
                      row.whatsappStatus === "sent"
                        ? "success"
                        : row.whatsappStatus === "failed"
                        ? "danger"
                        : "pending"
                    }
                    label={
                      row.whatsappStatus === "sent"
                        ? "Sent"
                        : row.whatsappStatus === "failed"
                        ? "Failed"
                        : "Pending"
                    }
                  />
                </td>

                <td className="px-4 py-4">
                  <StatusBadge
                    status={row.imageUrl ? "complete" : "incomplete"}
                    tone="table"
                  />
                </td>

                <td className="px-4 py-4 text-right">
                  <ActionButton
                    icon={Pencil}
                    label="Edit Birthday Canva"
                    onClick={() =>
                      router.push(`/admin/birthday/edit/${row.id}`)
                    }
                  />

                  <ActionButton
                    icon={Trash2}
                    label="Revoke Birthday Canva"
                    variant="ghostDanger"
                    onClick={() => setDeleteRow(row)}
                  />
                </td>
              </TableRow>
            ))}
          </tbody>
        </Table>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-3">
            <ActionButton
              icon={ChevronLeft}
              label="Previous page"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            />

            <Text variant="muted">
              Page {page} of {totalPages}
            </Text>

            <ActionButton
              icon={ChevronRight}
              label="Next page"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </div>
        )}
      </Card>

      {/* CONFIRM DELETE */}
      <ConfirmModal
        open={!!deleteRow}
        title="Revoke Birthday Canva"
        description={`This will permanently remove Birthday Canva for ${deleteRow?.name}`}
        confirmText="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteRow(null)}
      />
    </>
  );
}
