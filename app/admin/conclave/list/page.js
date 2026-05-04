"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deleteAdminConclave,
  fetchAdminConclaves,
  fetchAdminConclaveUsers,
} from "@/services/adminConclaveService";

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
  const [userDirectory, setUserDirectory] = useState([]);
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

  const fetchConclavesData = async () => {
    setLoading(true);
    try {
      const [list, users] = await Promise.all([
        fetchAdminConclaves(),
        fetchAdminConclaveUsers(),
      ]);
      setConclaves(list);
      setUserDirectory(users);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch conclaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConclavesData();
  }, []);

  const filtered = useMemo(() => {
    const search = nameFilter.toLowerCase();
    return conclaves.filter((item) =>
      String(item.name || "").toLowerCase().includes(search)
    );
  }, [conclaves, nameFilter]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    setPage(1);
  }, [nameFilter]);

  const confirmDelete = async () => {
    if (!conclaveToDelete?.id) {
      return;
    }

    try {
      await deleteAdminConclave(conclaveToDelete.id);
      toast.success("Conclave deleted");
      setDeleteOpen(false);
      setConclaveToDelete(null);
      await fetchConclavesData();
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const dateObj = new Date(value);
    if (Number.isNaN(dateObj.getTime())) return "-";

    return dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const resolveMemberName = (rawValue) => {
    const value = String(rawValue || "").trim();
    if (!value) return "-";

    const match = userDirectory.find(
      (user) =>
        String(user?.id || "").trim() === value ||
        String(user?.value || "").trim() === value ||
        String(user?.phone || "").trim() === value
    );

    return String(match?.label || value);
  };

  return (
    <>
      <div className="sticky top-0 z-30 bg-white mb-4">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <Button onClick={() => (window.location.href = "/admin/conclave/add")}>
              Add Conclave
            </Button>

            <div className="w-64">
              <Input
                placeholder="Search Conclave"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader columns={columns} />

          <tbody>
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full rounded-md bg-slate-200 animate-pulse" />
                    </td>
                  ))}
                </TableRow>
              ))}

            {!loading &&
              paginated.map((item, i) => (
                <TableRow key={item.id}>
                  <td className="px-4 py-3">{(page - 1) * perPage + i + 1}</td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{resolveMemberName(item.leader)}</td>
                  <td className="px-4 py-3">{formatDate(item.startDate)}</td>
                  <td className="px-4 py-3">{formatDate(item.initiationDate)}</td>
                  <td className="px-4 py-3">{item.ntMembers.length}</td>
                  <td className="px-4 py-3 font-semibold">{item.orbiters.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tooltip content="Edit Conclave">
                        <ActionButton
                          icon={Pencil}
                          onClick={() =>
                            (window.location.href = `/admin/conclave/edit/${item.id}`)
                          }
                        />
                      </Tooltip>

                      <Tooltip content="Delete">
                        <ActionButton
                          icon={Trash2}
                          variant="danger"
                          onClick={() => {
                            setConclaveToDelete(item);
                            setDeleteOpen(true);
                          }}
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


