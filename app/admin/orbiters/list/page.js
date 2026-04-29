"use client";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ActionButton from "@/components/ui/ActionButton";
import Tooltip from "@/components/ui/Tooltip";
import StatusBadge from "@/components/ui/StatusBadge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";
import { useToast } from "@/components/ui/ToastProvider";
import Pagination from "@/components/table/Pagination";
import { Trash2, Pencil, Download, Plus, Users, UserCheck, UserCog, AlertCircle } from "lucide-react";

export default function OrbitersListingPage() {
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nameFilter, setNameFilter] = useState("");
    const [phoneFilter, setPhoneFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [page, setPage] = useState(1);
    const perPage = 10;

    const columns = [
        { key: "sr", label: "#" },
        { key: "ujb", label: "UJB" },
        { key: "name", label: "Name" },
        { key: "mobile", label: "Mobile" },
        { key: "role", label: "Role" },
        { key: "status", label: "Status" },
        { key: "actions", label: "Actions" },
    ];

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/orbiters?view=full", {
                credentials: "include",
            });
            const payload = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(payload.message || "Failed to fetch users");
            }

            const rawUsers = Array.isArray(payload.users) ? payload.users : [];
            const list = rawUsers.map((data) => {

                const rawStatus =
                    data["ProfileStatus"] ||
                    data["profileStatus"] ||
                    data["Status"] ||
                    data["status"] ||
                    "";

                const cleaned = rawStatus.toString().trim().toLowerCase();

                const statusValue =
                    !cleaned || cleaned === "—" || cleaned === "-"
                        ? "incomplete"
                        : cleaned;

                return {
                    id: data.id || data["ujbCode"] || data["UJBCode"] || "",
                    name: data["Name"] || "",
                    phoneNumber: data["MobileNo"] || "",
                    role: data["Category"] || "",
                    status: statusValue,
                    ujbCode: data["ujbCode"] || data["UJBCode"] || data.id,
                };
            });

            setUsers(list);
        } catch (error) {
            toast.error(error.message || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchUsers();
    }, []);

    const clearFilters = () => {
        setNameFilter("");
        setPhoneFilter("");
        setRoleFilter("all");
        setStatusFilter("all");
        setPage(1);
    };

    const filtered = useMemo(() => {
        const nameSearch = nameFilter.toLowerCase().trim();
        const phoneSearch = phoneFilter.replace(/\s/g, "");

        return users.filter((u) => {
            const name = (u.name || "").toLowerCase();
            const phone = (u.phoneNumber || "").toString().replace(/\s/g, "");
            const role = (u.role || "").toLowerCase();
            const status = (u.status || "").toLowerCase();

            const matchName = !nameSearch || name.includes(nameSearch);
            const matchPhone = !phoneSearch || phone.includes(phoneSearch);
            const matchRole = roleFilter === "all" || role === roleFilter.toLowerCase();
            const matchStatus = statusFilter === "all" || status === statusFilter;

            return matchName && matchPhone && matchRole && matchStatus;
        });
    }, [users, nameFilter, phoneFilter, roleFilter, statusFilter]);

    const safeFiltered = Array.isArray(filtered) ? filtered : [];

    const totalPages = Math.max(
        1,
        Math.ceil(safeFiltered.length / (perPage || 1))
    );

    const startIndex = (page - 1) * perPage;

    const paginated = safeFiltered.slice(startIndex, startIndex + perPage);

    const openDelete = (u) => {
        setUserToDelete(u);
        setDeleteOpen(true);
    };

    useEffect(() => {
        if (!totalPages || isNaN(totalPages)) return;

        if (page > totalPages) {
            setPage(1);
        }
    }, [totalPages]);


    useEffect(() => {
        setPage(1);
    }, [nameFilter, phoneFilter, roleFilter, statusFilter]);

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            const res = await fetch(
                `/api/admin/orbiters?ujbCode=${encodeURIComponent(userToDelete.id)}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            const payload = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(payload.message || "Delete failed");
            }

            toast.success("User deleted");
            setDeleteOpen(false);
            fetchUsers();
        } catch (error) {
            toast.error(error.message || "Delete failed");
        }
    };

    const exportCSV = () => {
        if (!users.length) return;
        const rows = users.map((u) => ({ UJB: u.ujbCode, Name: u.name, Mobile: u.phoneNumber, Role: u.role, Status: u.status }));
        const header = Object.keys(rows[0]).join(",");
        const body = rows.map((r) => Object.values(r).join(",")).join("\n");
        const blob = new Blob([header + "\n" + body], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "orbiters.csv";
        a.click();
    };

    const exportExcel = () => {
        if (!users.length) return;
        const ws = XLSX.utils.json_to_sheet(users);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Orbiters");
        XLSX.writeFile(wb, "orbiters.xlsx");
    };

    const totalUsers = users.length;
    const totalOrbiters = users.filter((u) => u.role === "Orbiter").length;
    const totalCosm = users.filter((u) => u.role === "CosmOrbiter").length;
    const incomplete = users.filter((u) => u.status === "incomplete").length;

    return (
        <>
            {/* <Text variant="h1">Orbiters</Text> */}

            {/* Colored Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Card className="bg-blue-50 border border-blue-100">
                    <div className="flex items-center justify-stretch gap-2">
                        <Users className="text-blue-500" />
                        <div className="flex items-center gap-1">
                            <Text variant="h3">{totalUsers}</Text>
                            <Text variant="muted">Total Users</Text>
                        </div>
                    </div>
                </Card>
                <Card className="bg-green-50 border border-green-100">
                    <div className="flex items-center justify-stretch gap-2"><div className="flex items-center justify-stretch gap-2" ><UserCheck className="text-green-500" /><Text variant="h3">{totalOrbiters}</Text><Text variant="muted">Orbiter</Text></div></div></Card>
                <Card className="bg-purple-50 border border-purple-100">
                    <div className="flex items-center justify-stretch gap-2"><div className="flex items-center justify-stretch gap-2" ><UserCog className="text-purple-500" /><Text variant="h3">{totalCosm}</Text><Text variant="muted">CosmOrbiter</Text></div></div></Card>
                <Card className="bg-orange-50 border border-orange-100">
                    <div className="flex items-center justify-stretch gap-2"><div className="flex items-center justify-stretch gap-2" ><AlertCircle className="text-orange-500" /><Text variant="h3">{incomplete}</Text><Text variant="muted">Incomplete</Text></div></div></Card>
            </div>

            {/* Sticky Filter Bar */}
            <div className="sticky top-0 z-30 bg-white mb-4">
                <Card>
                    <div className="flex items-center justify-between gap-4">

                        {/* LEFT SIDE ACTIONS */}
                        <div className="flex items-center gap-2 shrink-0">
                            <Button onClick={() => (window.location.href = "/admin/orbiters/add")}>
                                <Plus size={16} /> Add User
                            </Button>

                            <Button variant="secondary" onClick={exportCSV}>
                                <Download size={16} /> CSV
                            </Button>

                            <Button variant="secondary" onClick={exportExcel}>
                                <Download size={16} /> Excel
                            </Button>
                        </div>

                        {/* RIGHT SIDE FILTERS - ONE LINE */}
                        <div className="flex items-center gap-2 flex-1 justify-end">

                            <div className="w-44">
                                <Input
                                    placeholder="Name"
                                    value={nameFilter}
                                    onChange={(e) => setNameFilter(e.target.value)}
                                />
                            </div>

                            <div className="w-44">
                                <Input
                                    placeholder="Mobile"
                                    value={phoneFilter}
                                    onChange={(e) => setPhoneFilter(e.target.value)}
                                />
                            </div>

                            <div className="w-40">
                                <Select
                                    value={roleFilter}
                                    onChange={setRoleFilter}
                                    options={[
                                        { label: "All Roles", value: "all" },
                                        { label: "Orbiter", value: "Orbiter" },
                                        { label: "CosmOrbiter", value: "CosmOrbiter" },
                                    ]}
                                />
                            </div>

                            <div className="w-40">
                                <Select
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    options={[
                                        { label: "All Status", value: "all" },
                                        { label: "Incomplete", value: "incomplete" },
                                        { label: "Verified", value: "verified" },
                                        { label: "Pending", value: "pending" },
                                    ]}
                                />
                            </div>

                            <Button variant="outline" onClick={clearFilters}>
                                Clear
                            </Button>

                        </div>
                    </div>
                </Card>
            </div>


            {/* Table */}
            <Card>
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-6 gap-4 h-12 items-center"
                            >
                                {Array.from({ length: 6 }).map((__, j) => (
                                    <div
                                        key={j}
                                        className="h-8 rounded-md bg-slate-100 animate-pulse"
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <Table>
                        <TableHeader columns={columns} />
                        <tbody>
                            {paginated.map((u, i) => (
                                <TableRow key={u.id} className="h-12">
                                    <td className="px-4 py-3">{(page - 1) * perPage + i + 1}</td>
                                    <td className="px-4 py-3 font-medium">{u.ujbCode}</td>
                                    <td className="px-4 py-3">{u.name}</td>
                                    <td className="px-4 py-3">{u.phoneNumber}</td>
                                    <td className="px-4 py-3">{u.role}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded-md text-xs font-medium ${u.status === "verified"
                                                ? "bg-green-100 text-green-700"
                                                : u.status === "submitted"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : u.status === "pending"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : u.status === "inactive"
                                                            ? "bg-red-100 text-red-700"
                                                            : u.status === "in process"
                                                                ? "bg-purple-100 text-purple-700"
                                                                : "bg-red-100 text-red-600"
                                                }`}
                                        >
                                            {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            <Tooltip content="Edit">
                                                <ActionButton
                                                    icon={Pencil}
                                                    onClick={() =>
                                                        (window.location.href = `/admin/orbiters/${u.ujbCode}`)
                                                    }
                                                />
                                            </Tooltip>

                                            <Tooltip content="Delete">
                                                <ActionButton
                                                    icon={Trash2}
                                                    variant="danger"
                                                    onClick={() => openDelete(u)}
                                                />
                                            </Tooltip>
                                        </div>
                                    </td>
                                </TableRow>
                            ))}
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


            <ConfirmModal open={deleteOpen} title="Delete User" description={`Delete ${userToDelete?.name}?`} onConfirm={confirmDelete} onClose={() => setDeleteOpen(false)} />
        </>
    );
}



