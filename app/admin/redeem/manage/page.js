"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, ShieldCheck, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import {
  approveRedeemDeal,
  fetchRedeemDeals,
  rejectRedeemDeal,
  updateRedeemDeal,
} from "@/services/redeemService";

function getItemName(request) {
  if (request.mode === "all") return "All items";
  if (request.mode === "single") return request.selectedItem?.name || "-";
  if (request.mode === "multiple") {
    return request.multipleItems?.map((item) => item.name).join(", ") || "-";
  }
  return "-";
}

export default function AdminManageRedeemPage() {
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({
    category: "",
    enhancedPercent: 0,
    minPoints: 0,
    maxPoints: 0,
    originalPercent: 0,
    finalPercent: 0,
  });

  const loadRequests = async () => {
    try {
      setLoading(true);
      setRequests(await fetchRedeemDeals());
    } catch (error) {
      console.error(error);
      toast.error("Unable to load redeem deals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const searchMatch = (request.cosmo?.Name || "")
        .toLowerCase()
        .includes(search.toLowerCase());

      const statusMatch =
        statusFilter === "All" || request.status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [requests, search, statusFilter]);

  const startEdit = (request) => {
    const originalPercent = Number(request.agreedPercentage?.originalPercent || 0);
    const enhancedPercent = Number(request.agreedPercentage?.enhancedPercent || 0);

    setEditingId(request.id);
    setEditForm({
      category: request.redemptionCategory || request.category || "",
      enhancedPercent,
      minPoints: Number(request.redeemPointsRequired?.minPoints || 0),
      maxPoints: Number(request.redeemPointsRequired?.maxPoints || 0),
      originalPercent,
      finalPercent: originalPercent + enhancedPercent,
    });
  };

  const handleApprove = async (id, category) => {
    if (!category) {
      toast.error("Choose a category before approval.");
      return;
    }

    try {
      await approveRedeemDeal(id, category);
      toast.success("Redeem deal approved.");
      await loadRequests();
    } catch (error) {
      console.error(error);
      toast.error("Unable to approve deal.");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectRedeemDeal(id);
      toast.success("Redeem deal rejected.");
      await loadRequests();
    } catch (error) {
      console.error(error);
      toast.error("Unable to reject deal.");
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    if (Number(editForm.minPoints) > Number(editForm.maxPoints)) {
      toast.error("Min points cannot exceed max points.");
      return;
    }

    try {
      await updateRedeemDeal(editingId, editForm);
      toast.success("Redeem deal updated.");
      setEditingId("");
      await loadRequests();
    } catch (error) {
      console.error(error);
      toast.error("Unable to update deal.");
    }
  };

  return (
    <main className="space-y-6">
  QQQQQQQQQQQQQQQQQQQQQQQQQQQqQqQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQqqqqqqqqqqqQ

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <EditableField
            label="Search"
            value={search}
            onChange={setSearch}
            placeholder="Search by cosmo name"
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
            >
              <option value="All">All statuses</option>
              <option value="Requested">Requested</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate-500">Loading redeem deals...</div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const isEditing = editingId === request.id;
              const categoryValue =
                isEditing ? editForm.category : request.redemptionCategory || request.category || "";

              return (
                <div
                  key={request.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-800">
                        {request.cosmo?.Name || "Unknown"}
                      </p>
                      <p className="text-sm text-slate-500">{getItemName(request)}</p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                      {request.status || "Pending"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <InfoCard
                      label="Original %"
                      value={request.agreedPercentage?.originalPercent ?? "-"}
                    />
                    <InfoCard
                      label="Enhanced %"
                      value={request.agreedPercentage?.enhancedPercent ?? "-"}
                    />
                    <InfoCard
                      label="Final %"
                      value={request.agreedPercentage?.finalAgreedPercent ?? "-"}
                    />
                    <InfoCard
                      label="Points"
                      value={`${request.redeemPointsRequired?.minPoints ?? "-"} - ${
                        request.redeemPointsRequired?.maxPoints ?? "-"
                      }`}
                    />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Category
                      </label>
                      <select
                        value={categoryValue}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (isEditing) {
                            setEditForm((prev) => ({ ...prev, category: value }));
                          }
                        }}
                        disabled={!isEditing && request.status !== "Requested"}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                      >
                        <option value="">Select</option>
                        <option value="H">Health</option>
                        <option value="W">Wealth</option>
                        <option value="R">Relationship</option>
                      </select>
                    </div>

                    {isEditing && (
                      <>
                        <EditableField
                          label="Enhanced %"
                          type="number"
                          value={editForm.enhancedPercent}
                          onChange={(value) =>
                            setEditForm((prev) => ({
                              ...prev,
                              enhancedPercent: Number(value || 0),
                              finalPercent:
                                Number(prev.originalPercent || 0) + Number(value || 0),
                            }))
                          }
                        />
                        <EditableField
                          label="Min Points"
                          type="number"
                          value={editForm.minPoints}
                          onChange={(value) =>
                            setEditForm((prev) => ({ ...prev, minPoints: value }))
                          }
                        />
                        <EditableField
                          label="Max Points"
                          type="number"
                          value={editForm.maxPoints}
                          onChange={(value) =>
                            setEditForm((prev) => ({ ...prev, maxPoints: value }))
                          }
                        />
                      </>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {request.status === "Requested" && (
                      <>
                        <button
                          onClick={() => handleApprove(request.id, categoryValue)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    )}

                    {request.status === "Approved" && !isEditing && (
                      <button
                        onClick={() => startEdit(request)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                    )}

                    {isEditing && (
                      <>
                        <button
                          onClick={handleUpdate}
                          className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingId("")}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4 border border-slate-200">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function EditableField({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
      />
    </div>
  );
}
