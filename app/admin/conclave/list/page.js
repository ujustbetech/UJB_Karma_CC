"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/firebaseConfig";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ActionButton from "@/components/ui/ActionButton";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";
import Pagination from "@/components/table/Pagination";
import { useToast } from "@/components/ui/ToastProvider";

import { Pencil, Trash2 } from "lucide-react";

export default function ConclavesListingPage() {
  const toast = useToast();

  const [conclaves, setConclaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [conclaveToDelete, setConclaveToDelete] = useState(null);

  const columns = [
    { key: "sr", label: "Sr No" },
    { key: "name", label: "Conclave Name" },
    { key: "leader", label: "Leader" },
    { key: "start", label: "Start Date" },
    { key: "initiation", label: "Initiation Date" },
    { key: "nt", label: "NT Members" },
    { key: "orbiters", label: "# Orbiters" },
    { key: "actions", label: "Actions" },
  ];

  const fetchConclaves = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        collection(db, COLLECTIONS.conclaves)
      );

      const list = snap.docs.map((d) => {
        const data = d.data();

        return {
          id: d.id,
          name: data.conclaveStream || "—",
          leader: data.leader || "—",
          startDate: data.startDate,
          initiationDate: data.initiationDate,
          ntMembers: data.ntMembers || [],
          orbiters: data.orbiters || [],
        };
      });

      setConclaves(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch conclaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConclaves();
  }, []);

  const filtered = useMemo(() => {
    const search = nameFilter.toLowerCase();
    return conclaves.filter((c) =>
      (c.name || "").toLowerCase().includes(search)
    );
  }, [conclaves, nameFilter]);

  const paginated = filtered.slice(
    (page - 1) * perPage,
    page * perPage
  );

  useEffect(() => {
    setPage(1);
  }, [nameFilter]);

  const openDelete = (c) => {
    setConclaveToDelete(c);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!conclaveToDelete) return;

    try {
      await deleteDoc(
        doc(db, COLLECTIONS.conclaves, conclaveToDelete.id)
      );

      toast.success("Conclave deleted");
      setDeleteOpen(false);
      fetchConclaves();
    } catch {
      toast.error("Delete failed");
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const dateObj = new Date(value);
    if (isNaN(dateObj.getTime())) return "—";

    return dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Filter Bar */}
      <div className="sticky top-0 z-30 bg-white mb-4">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={() =>
                (window.location.href =
                  "/admin/conclaves/create")
              }
            >
              Add Conclave
            </Button>

            <div className="w-64">
              <Input
                placeholder="Search Conclave"
                value={nameFilter}
                onChange={(e) =>
                  setNameFilter(e.target.value)
                }
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader columns={columns} />

          <tbody>
            {/* ✅ Skeleton Loader */}
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full rounded-md bg-slate-200 animate-pulse" />
                    </td>
                  ))}
                </TableRow>
              ))
            }

            {/* ✅ Actual Data */}
            {!loading &&
              paginated.map((c, i) => (
                <TableRow key={c.id}>
                  <td className="px-4 py-3">
                    {(page - 1) * perPage + i + 1}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {c.name}
                  </td>

                  <td className="px-4 py-3">
                    {c.leader}
                  </td>

                  <td className="px-4 py-3">
                    {formatDate(c.startDate)}
                  </td>

                  <td className="px-4 py-3">
                    {formatDate(c.initiationDate)}
                  </td>

                  <td className="px-4 py-3">
                    {c.ntMembers.length}
                  </td>

                  <td className="px-4 py-3 font-semibold">
                    {c.orbiters.length}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tooltip content="Edit Conclave">
                        <ActionButton
                          icon={Pencil}
                          onClick={() =>
                            (window.location.href =
                              `/admin/conclave/edit/${c.id}`)
                          }
                        />
                      </Tooltip>

                      <Tooltip content="Delete">
                        <ActionButton
                          icon={Trash2}
                          variant="danger"
                          onClick={() => openDelete(c)}
                        />
                      </Tooltip>
                    </div>
                  </td>
                </TableRow>
              ))}
          </tbody>
        </Table>

        <div className="mt-4 flex justify-end">
          <Pagination
            page={page}
            pageSize={perPage}
            total={filtered.length}
            onPageChange={setPage}
          />
        </div>
      </Card>

      <ConfirmModal
        open={deleteOpen}
        title="Delete Conclave"
        description={`Delete ${conclaveToDelete?.name}?`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}