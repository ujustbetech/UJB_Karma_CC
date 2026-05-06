"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  deleteBirthdayEntry,
  fetchAllUserBirthdays,
} from "@/services/adminBirthdayService";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";
import Badge from "@/components/ui/Badge";
import { Plus, Edit, Trash2, Search, X, Maximize2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

const PAGE_SIZE = 10;

/* ---------------- PREVIEW MODAL ---------------- */

const PreviewModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{user.name}</h3>
            <p className="text-sm text-slate-500">{user.phone}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* PROFILE PIC */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Profile Picture</div>
              <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-slate-200">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            {/* CANVA PIC */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Birthday Canva</div>
              <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {user.canva?.imageUrl ? (
                  <img src={user.canva.imageUrl} alt="Canva" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-400">
                    No Creative Added
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
          <Link href={`/admin/birthday/add?id=${user.id}&name=${encodeURIComponent(user.name)}`}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update Creative
          </Link>
        </div>
      </div>
    </div>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */

export default function BirthdayListClient() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [previewUser, setPreviewUser] = useState(null);

  const getDaysUntilNextBirthday = (dob) => {
    if (!dob) return 999;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let birthDate;
      if (dob.includes("/")) {
        const [d, m, y] = dob.split("/");
        birthDate = new Date(`${y}-${m}-${d}`);
      } else {
        birthDate = new Date(dob);
      }
      const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
      const diffTime = nextBirthday - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch { return 999; }
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUserBirthdays();
      setRows(data.map(row => ({ ...row, daysUntil: getDaysUntilNextBirthday(row.dob) })));
    } catch (err) {
      toast.error("Failed to fetch birthday data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This Canva will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;
    try {
      await deleteBirthdayEntry(id);
      setRows(prev => prev.map(row => row.id === id ? { ...row, canva: null } : row));
      toast.success("Deleted successfully");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const getDaysLeftLabel = (days) => {
    if (days === 999) return "-";
    if (days === 0) return "Today";
    return `${days} days`;
  };

  const filteredRows = useMemo(() => {
    let result = rows.filter((row) => {
      const matchesSearch = row.name.toLowerCase().includes(search.toLowerCase()) || row.phone.includes(search);
      if (!matchesSearch) return false;

      if (statusFilter !== "all") {
        if (statusFilter === "none" && row.canva) return false;
        if (statusFilter === "exists" && !row.canva) return false;
      }

      if (startDate || endDate) {
        if (!row.dob) return false;
        let birthDate;
        if (row.dob.includes("/")) {
          const [d, m] = row.dob.split("/");
          birthDate = new Date(1900, parseInt(m) - 1, parseInt(d));
        } else {
          const d = new Date(row.dob);
          birthDate = new Date(1900, d.getMonth(), d.getDate());
        }
        if (startDate) {
          const start = new Date(startDate);
          const startComp = new Date(1900, start.getMonth(), start.getDate());
          if (birthDate < startComp) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          const endComp = new Date(1900, end.getMonth(), end.getDate());
          if (birthDate > endComp) return false;
        }
      }
      return true;
    });
    return result.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [rows, search, statusFilter, startDate, endDate]);

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  return (
    <Card className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <Text variant="h2">Birthday & Canva Status</Text>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="flex items-center gap-2 border border-slate-200 rounded-md bg-slate-50 px-2 py-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Date Range:</span>
            <input type="date" className="bg-transparent text-xs cursor-pointer focus:outline-none" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
            <span className="text-slate-300">-</span>
            <input type="date" className="bg-transparent text-xs cursor-pointer focus:outline-none" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />
            {(startDate || endDate) && <button onClick={() => { setStartDate(""); setEndDate(""); setPage(1); }} className="text-slate-400 hover:text-rose-500"><X size={14} /></button>}
          </div>

          <select
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Users</option>
            <option value="exists">Has Canva</option>
            <option value="none">No Canva</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <Table>
          <TableHeader columns={[{ label: "User Info" }, { label: "Birthday" }, { label: "Upcoming" }, { label: "Canva Preview" }, { label: "Status" }, { label: "Action" }]} />
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-20 text-center"><div className="flex flex-col items-center gap-2"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /><div className="text-sm font-medium text-slate-500">Loading directory...</div></div></td></tr>
            ) : paginatedRows.length === 0 ? (
              <tr><td colSpan={6} className="py-20 text-center text-slate-400 italic">No members match your filters</td></tr>
            ) : (
              paginatedRows.map((row) => (
                <TableRow key={row.id}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm bg-slate-50 shrink-0">
                        {row.photoURL ? <img src={row.photoURL} alt="" className="h-full w-full object-contain" /> : <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-300">{row.name.charAt(0)}</div>}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{row.name}</div>
                        <div className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">{row.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {row.dob ? (row.dob.includes("/") ? row.dob.split("/").slice(0, 2).join("/") : new Date(row.dob).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })) : "-"}
                  </td>
                  <td className="px-4 py-4"><span className={`text-sm font-bold ${row.daysUntil === 0 ? "text-rose-600 animate-pulse" : "text-slate-700"}`}>{getDaysLeftLabel(row.daysUntil)}</span></td>
                  <td className="px-4 py-4">
                    {row.canva?.imageUrl ? (
                      <div
                        onClick={() => setPreviewUser(row)}
                        className="group relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200 cursor-pointer hover:border-blue-400 transition-all shadow-sm"
                      >
                        <img src={row.canva.imageUrl} alt="" className="h-full w-full object-contain transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 size={16} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <Badge variant="neutral" size="table">No Image</Badge>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {row.canva ? <Badge variant="success" size="table">Creative Active</Badge> : <Badge variant="neutral" size="table">Pending Creation</Badge>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {!row.canva ? (
                        <Link href={`/admin/birthday/add?id=${row.id}&name=${encodeURIComponent(row.name)}`} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 shadow-sm shadow-blue-100"><Plus size={14} />Create</Link>
                      ) : (
                        <>
                          <Link href={`/admin/birthday/add?id=${row.id}&name=${encodeURIComponent(row.name)}`} className="rounded-full p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit"><Edit size={18} /></Link>
                          <button onClick={() => handleDelete(row.id)} className="rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Delete"><Trash2 size={18} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <PreviewModal isOpen={!!previewUser} onClose={() => setPreviewUser(null)} user={previewUser} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-6">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">Showing {paginatedRows.length} of {filteredRows.length} members</div>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all">Previous</button>
            <div className="px-4 text-sm font-bold text-slate-900">{page} <span className="text-slate-300 mx-1">/</span> {totalPages}</div>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all">Next</button>
          </div>
        </div>
      )}
    </Card>
  );
}
