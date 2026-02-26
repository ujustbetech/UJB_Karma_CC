"use client";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ActionButton from "@/components/ui/ActionButton";
import Tooltip from "@/components/ui/Tooltip";
import StatusBadge from "@/components/ui/StatusBadge";
import Input from "@/components/ui/Input";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";
import Pagination from "@/components/table/Pagination";
import { useToast } from "@/components/ui/ToastProvider";

import { Pencil, Trash2, Copy } from "lucide-react";
import * as XLSX from "xlsx";
import Select from "@/components/ui/Select";

export default function ContentListingPage() {

    const toast = useToast();

    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [partnerFilter, setPartnerFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [page, setPage] = useState(1);
    const perPage = 10;

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [contentToDelete, setContentToDelete] = useState(null);

    const columns = [
        { key: "sr", label: "Sr no" },
        { key: "partner", label: "Partner Name" },
        { key: "type", label: "Partner Type" },
        { key: "name", label: "Content Name" },
        { key: "format", label: "Format" },
        { key: "ctype", label: "Type" },
        { key: "views", label: "Views" },
        { key: "likes", label: "Likes" },
        { key: "status", label: "Status" },
        { key: "actions", label: "Actions" },
    ];

    const statusOptions = [
        { label: "All Status", value: "" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
    ];
    const fetchContent = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "ContentData"));

            const list = snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    partner: data.partnerNamelp || "",
                    partnerType: data.partnerDesig || "",
                    name: data.contentName || "",
                    format: data.contentFormat || "",
                    type: data.contentType || "",
                    views: data.totalViews || 0,
                    likes: data.totallike || 0,
                    status: data.switchValue ? "active" : "inactive",
                };
            });

            setContent(list);
        } catch {
            toast.error("Failed to fetch content");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    /* ---------------- ADVANCED FILTER ---------------- */
    const filtered = useMemo(() => {
        return content.filter((c) => {
            const nameMatch = (c.name || "")
                .toLowerCase()
                .includes(search.toLowerCase());

            const partnerMatch = partnerFilter
                ? c.partnerType.toLowerCase().includes(partnerFilter.toLowerCase())
                : true;

            const typeMatch = typeFilter
                ? c.type.toLowerCase().includes(typeFilter.toLowerCase())
                : true;

            const statusMatch = statusFilter
                ? c.status === statusFilter
                : true;

            return nameMatch && partnerMatch && typeMatch && statusMatch;
        });
    }, [content, search, partnerFilter, typeFilter, statusFilter]);

    const paginated = filtered.slice(
        (page - 1) * perPage,
        page * perPage
    );

    useEffect(() => {
        setPage(1);
    }, [search, partnerFilter, typeFilter, statusFilter]);

    /* ---------------- EXPORT CSV ---------------- */
    const exportCSV = () => {
        if (!filtered.length) return toast.error("No data");

        const headers = [
            "Partner Name",
            "Partner Type",
            "Content Name",
            "Format",
            "Type",
            "Views",
            "Likes",
            "Status",
        ];

        const rows = filtered.map((c) => [
            c.partner,
            c.partnerType,
            c.name,
            c.format,
            c.type,
            c.views,
            c.likes,
            c.status,
        ]);

        const csv =
            "data:text/csv;charset=utf-8," +
            [headers, ...rows].map((r) => r.join(",")).join("\n");

        const link = document.createElement("a");
        link.href = encodeURI(csv);
        link.download = "content_export.csv";
        link.click();

        toast.success("CSV Exported");
    };

    /* ---------------- EXPORT EXCEL ---------------- */
    const exportExcel = () => {
        if (!filtered.length) return toast.error("No data");

        const data = filtered.map((c, i) => ({
            "Sr No": i + 1,
            "Partner Name": c.partner,
            "Partner Type": c.partnerType,
            "Content Name": c.name,
            "Format": c.format,
            "Type": c.type,
            "Views": c.views,
            "Likes": c.likes,
            "Status": c.status,
        }));

        const sheet = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, "Content");

        XLSX.writeFile(wb, "content_export.xlsx");
        toast.success("Excel Exported");
    };

    const resetFilters = () => {
        setSearch("");
        setPartnerFilter("");
        setTypeFilter("");
        setStatusFilter("");
    };

    const openDelete = (item) => {
        setContentToDelete(item);
        setDeleteOpen(true);
    };

    const confirmDelete = async () => {
        await deleteDoc(doc(db, "ContentData", contentToDelete.id));
        toast.success("Content deleted");
        setDeleteOpen(false);
        fetchContent();
    };

    const copyContentLink = (id) => {
        navigator.clipboard.writeText(`${window.location.origin}/content/${id}`);
        toast.success("Link copied");
    };

    return (
        <>
            {/* FILTER BAR */}
            <div className="sticky top-0 z-30 bg-white mb-4">
                <Card>
                    <div className="flex flex-wrap items-center gap-3">

                        {/* Search */}
                        <div className="w-[220px]">
                            <Input
                                placeholder="Search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Partner Type */}
                        <div className="w-[180px]">
                            <Input
                                placeholder="Partner Type"
                                value={partnerFilter}
                                onChange={(e) => setPartnerFilter(e.target.value)}
                            />
                        </div>

                        {/* Content Type */}
                        <div className="w-[180px]">
                            <Input
                                placeholder="Content Type"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            />
                        </div>

                        {/* Status */}
                        <div className="w-[180px]">
                            <Select
                                options={statusOptions}
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(val)}
                                placeholder="Status"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-auto">
                            <Button variant="secondary" onClick={resetFilters}>
                                Reset
                            </Button>

                            <Button variant="secondary" onClick={exportCSV}>
                                Export CSV
                            </Button>

                            <Button onClick={exportExcel}>
                                Export Excel
                            </Button>
                        </div>

                    </div>
                </Card>
            </div>


            {/* TABLE */}
            <Card>
                {loading ? (
                    <div className="p-4 space-y-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-10 gap-4 h-12">
                                {Array.from({ length: 10 }).map((__, j) => (
                                    <div key={j} className="h-8 bg-slate-100 rounded animate-pulse" />
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <Table>
                        <TableHeader columns={columns} />
                        <tbody>
                            {paginated.map((c, i) => (
                                <TableRow key={c.id}>
                                    <td className="px-4 py-3">
                                        {(page - 1) * perPage + i + 1}
                                    </td>
                                    <td className="px-4 py-3">{c.partner}</td>
                                    <td className="px-4 py-3">{c.partnerType}</td>
                                    <td className="px-4 py-3 font-medium">{c.name}</td>
                                    <td className="px-4 py-3">{c.format}</td>
                                    <td className="px-4 py-3">{c.type}</td>
                                    <td className="px-4 py-3 font-semibold">{c.views}</td>
                                    <td className="px-4 py-3">{c.likes}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={c.status} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <Tooltip content="Edit">
                                                <ActionButton
                                                    icon={Pencil}
                                                    onClick={() =>
                                                        (window.location.href = `/admin/content/${c.id}`)
                                                    }
                                                />
                                            </Tooltip>

                                            <Tooltip content="Copy Link">
                                                <ActionButton
                                                    icon={Copy}
                                                    onClick={() => copyContentLink(c.id)}
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
                )}

                <div className="mt-4 flex justify-between">
                    <Button variant="secondary" onClick={resetFilters}>
                        Reset Filters
                    </Button>

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
                title="Delete Content"
                description={`Delete ${contentToDelete?.name}?`}
                onConfirm={confirmDelete}
                onClose={() => setDeleteOpen(false)}
            />
        </>
    );
}
