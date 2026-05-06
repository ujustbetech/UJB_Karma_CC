"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import * as XLSX from "xlsx";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ActionButton from "@/components/ui/ActionButton";
import Tooltip from "@/components/ui/Tooltip";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";
import Pagination from "@/components/table/Pagination";
import { useToast } from "@/components/ui/ToastProvider";

import {
  BarChart3,
  User,
  Users,
  Clock,
  Trash2,
  Pencil,
  Download,
  Plus,
} from "lucide-react";

function getLifecycleStatus(prospect) {
  return String(prospect?.recordStatus || "Active").trim() || "Active";
}

export default function ProspectsListingPage() {
  const router = useRouter();
  const toast = useToast();

  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orbiterFilter, setOrbiterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [prospectToDelete, setProspectToDelete] = useState(null);

  const [page, setPage] = useState(1);
  const perPage = 10;

  const columns = [
    { key: "sr", label: "#" },
    { key: "name", label: "Prospect Name" },
    { key: "occupation", label: "Occupation" },
    { key: "orbiter", label: "MentOrbiter" },
    { key: "ops", label: "OPS" },
    { key: "stage", label: "Current Stage" },
    { key: "status", label: "Status" },
    { key: "last", label: "Last Engagement" },
    { key: "note", label: "Note" },
    { key: "actions", label: "Actions" },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const getProspectStage = (prospect) => {
    if (String(prospect.currentStage || "").trim()) {
      return { stage: String(prospect.currentStage).trim(), progress: 35 };
    }

    if (prospect.status === "Choose to enroll") {
      return { stage: "Enrolled", progress: 100 };
    }

    if (prospect.enrollmentStages?.some((stage) => stage.status === "Completed")) {
      return { stage: "Enrollment Process", progress: 90 };
    }

    if (prospect.assessmentMail?.sent) {
      return { stage: "Assessment Completed", progress: 80 };
    }

    if (prospect.caseStudy2?.sent) {
      return { stage: "Case Study 2", progress: 75 };
    }

    if (prospect.caseStudy1?.sent) {
      return { stage: "Case Study 1", progress: 70 };
    }

    if (prospect.knowledgeSeries10_evening?.sent) {
      return { stage: "Knowledge Series 10", progress: 65 };
    }

    if (prospect.knowledgeSeries5_morning?.sent) {
      return { stage: "Knowledge Series", progress: 55 };
    }

    if (prospect.ntIntro?.sent) {
      return { stage: "NT Intro", progress: 45 };
    }

    if (prospect.sections?.length > 0) {
      return { stage: "Assessment Form", progress: 35 };
    }

    if (prospect.introevent?.length > 0) {
      return { stage: "Intro Meeting", progress: 20 };
    }

    return { stage: "Prospect Created", progress: 5 };
  };

  const fetchProspects = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/prospects", {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch prospects");
      }

      setProspects(Array.isArray(data.prospects) ? data.prospects : []);
    } catch {
      toast.error("Failed to fetch prospects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    if (typeof dateValue === "string") {
      const date = new Date(dateValue);
      return Number.isNaN(date.getTime()) ? "-" : format(date, "dd/MM/yyyy HH:mm");
    }

    if (dateValue?.seconds) {
      return format(new Date(dateValue.seconds * 1000), "dd/MM/yyyy HH:mm");
    }

    return "-";
  };

  const orbiterOptions = useMemo(() => {
    const names = Array.from(
      new Set(prospects.map((prospect) => prospect.orbiterName).filter(Boolean))
    );

    return [
      { label: "All MentOrbiters", value: "" },
      ...names.map((name) => ({ label: name, value: name })),
    ];
  }, [prospects]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();

    return prospects
      .filter((prospect) => {
        const searchText = `${prospect.prospectName || ""} ${prospect.orbiterName || ""} ${prospect.occupation || ""} ${prospect.assignedOpsName || ""}`.toLowerCase();
        const matchesSearch = !term || searchText.includes(term);
        const matchesOrbiter = !orbiterFilter || prospect.orbiterName === orbiterFilter;
        const matchesStatus = !statusFilter || getLifecycleStatus(prospect) === statusFilter;

        return matchesSearch && matchesOrbiter && matchesStatus;
      })
      .filter(
        (prospect) =>
          prospect.userType !== "orbiter" || getLifecycleStatus(prospect) === "Archive"
      );
  }, [prospects, debouncedSearch, orbiterFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, orbiterFilter, statusFilter]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openDelete = (prospect) => {
    setProspectToDelete(prospect);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!prospectToDelete?.id) return;

    try {
      const res = await fetch(`/api/admin/prospects?id=${prospectToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Delete failed");
      }

      toast.success("Prospect deleted");
      fetchProspects();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteOpen(false);
      setProspectToDelete(null);
    }
  };

  const exportExcel = () => {
    if (!prospects.length) return;

    const worksheet = XLSX.utils.json_to_sheet(prospects);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Prospects");
    XLSX.writeFile(workbook, "prospects.xlsx");
  };

  const totalProspects = prospects.length;
  const activeProspects = prospects.filter((prospect) => getLifecycleStatus(prospect) === "Active").length;
  const archivedProspects = prospects.filter((prospect) => getLifecycleStatus(prospect) === "Archive").length;
  const assignedOpsCount = new Set(
    prospects
      .map((prospect) => String(prospect.assignedOpsEmail || "").trim().toLowerCase())
      .filter(Boolean)
  ).size;

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card
            className="p-4 cursor-pointer"
            onClick={() => {
              setSearch("");
              setOrbiterFilter("");
              setStatusFilter("");
            }}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <div>
                <Text as="h3">Total</Text>
                <Text>{totalProspects}</Text>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer"
            onClick={() => setStatusFilter("Active")}
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-green-600" />
              <div>
                <Text as="h3">Active</Text>
                <Text>{activeProspects}</Text>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer"
            onClick={() => setStatusFilter("Archive")}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <Text as="h3">Archive</Text>
                <Text>{archivedProspects}</Text>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <Text as="h3">OPS Assigned</Text>
                <Text>{assignedOpsCount}</Text>
              </div>
            </div>
          </Card>
        </div>

        <div className="sticky top-[64px] z-20">
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => router.push("/admin/prospect/add")}>
                  <Plus size={16} /> Add Prospect
                </Button>

                <Button onClick={exportExcel}>
                  <Download size={16} /> Excel
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="w-[280px]">
                  <Input
                    placeholder="Search prospect / MentOrbiter / OPS / occupation"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="w-[180px]">
                  <Select
                    value={orbiterFilter}
                    onChange={setOrbiterFilter}
                    options={orbiterOptions}
                  />
                </div>

                <div className="w-[150px]">
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { label: "All", value: "" },
                      { label: "Draft", value: "Draft" },
                      { label: "Active", value: "Active" },
                      { label: "Archive", value: "Archive" },
                    ]}
                  />
                </div>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setOrbiterFilter("");
                    setStatusFilter("");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Text className="text-sm text-gray-500">
          Showing {filtered.length} results
        </Text>

        <Card>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader columns={columns} />

              <tbody>
                {paginated.map((prospect, index) => {
                  const { stage } = getProspectStage(prospect);

                  return (
                    <TableRow key={prospect.id}>
                      <td className="px-4 py-3">
                        {(page - 1) * perPage + index + 1}
                      </td>

                      <td className="px-4 py-3">
                        {prospect.prospectName || "-"}
                      </td>

                      <td className="px-4 py-3">
                        {prospect.occupation || "-"}
                      </td>

                      <td className="px-4 py-3">
                        {prospect.orbiterName || "-"}
                      </td>

                      <td className="px-4 py-3">
                        {prospect.assignedOpsName || "-"}
                      </td>

                      <td className="px-4 py-3 text-blue-600 font-medium">
                        {stage}
                      </td>

                      <td className="px-4 py-3">
                        {getLifecycleStatus(prospect)}
                      </td>

                      <td className="px-4 py-3">
                        {formatDate(prospect.lastEngagementDate)}
                      </td>

                      <td className="px-4 py-3">
                        {prospect.lastEngagementNote || "-"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Tooltip content="Edit">
                            <ActionButton
                              icon={Pencil}
                              onClick={() =>
                                router.push(`/admin/prospect/edit/${prospect.id}`)
                              }
                            />
                          </Tooltip>

                          <Tooltip content="Delete">
                            <ActionButton
                              icon={Trash2}
                              variant="danger"
                              onClick={() => openDelete(prospect)}
                            />
                          </Tooltip>
                        </div>
                      </td>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          )}

          <div className="mt-4 flex justify-end">
            <Pagination
              page={page}
              pageSize={perPage}
              total={filtered.length}
              onPageChange={setPage}
            />
          </div>
        </Card>
      </div>

      <ConfirmModal
        open={deleteOpen}
        title="Delete Prospect"
        description={`Delete ${prospectToDelete?.prospectName || "this prospect"}?`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}
