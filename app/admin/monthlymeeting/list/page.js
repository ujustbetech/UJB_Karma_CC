"use client";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/firebaseConfig";
import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "firebase/firestore";
import { COLLECTIONS } from "@/lib/utility_collection";

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

import {
    Pencil,
    Trash2,
    Users,
    UserPlus,
    Copy
} from "lucide-react";

export default function EventsListingPage() {
    const toast = useToast();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nameFilter, setNameFilter] = useState("");
    const [page, setPage] = useState(1);
    const perPage = 10;

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);

    const columns = [
        { key: "sr", label: "Sr no" },
        { key: "name", label: "Event Name" },
        { key: "time", label: "Time" },
        { key: "status", label: "Status" },
        { key: "registered", label: "Registered" },
        { key: "zoom", label: "Zoom Link" },
        { key: "copy", label: "Copy Event Link" },
        { key: "actions", label: "Actions" },
    ];


    const fetchEvents = async () => {
        setLoading(true);

        try {
            const snap = await getDocs(
                collection(db, COLLECTIONS.monthlyMeeting)
            );

            const list = await Promise.all(
                snap.docs.map(async (d) => {
                    const data = d.data();
                    const rawTime = data.time;

                    let registeredCount = 0;

                    try {
                        const regSnap = await getDocs(
                            collection(
                                db,
                                COLLECTIONS.monthlyMeeting,
                                d.id,
                                "registeredUsers"
                            )
                        );
                        registeredCount = regSnap.size;
                    } catch (e) {
                        console.warn("Subcollection read failed:", d.id);
                    }

                    return {
                        id: d.id,
                        name: data.Eventname || data.eventName || "Untitled",
                        time: rawTime || "",
                        zoom: data.zoomLink || "",
                        registeredCount,
                        status: data.status || getEventStatus(rawTime),
                    };
                })
            );

            setEvents(list);
        } catch (err) {
            console.error("Fetch events error:", err);
            toast.error("Failed to fetch events");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchEvents();
    }, []);

    const filtered = useMemo(() => {
        const search = nameFilter.toLowerCase();
        return events.filter((e) =>
            (e.name || "").toLowerCase().includes(search)
        );
    }, [events, nameFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginated = filtered.slice(
        (page - 1) * perPage,
        page * perPage
    );

    useEffect(() => {
        setPage(1);
    }, [nameFilter]);

    const copyEventLink = (id) => {
        const link = `${window.location.origin}/events/${id}`;
        navigator.clipboard.writeText(link);
        toast.success("Event link copied");
    };

    const openRegistrations = (id) =>
        (window.location.href = `/admin/event/${id}?tab=registered`);

    const openAddUser = (id) =>
        (window.location.href = `/admin/event/${id}?tab=add-users`);

    const openDelete = (e) => {
        setEventToDelete(e);
        setDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!eventToDelete) return;

        try {
            await deleteDoc(
                doc(db, COLLECTIONS.monthlyMeeting, eventToDelete.id)
            );
            toast.success("Event deleted");
            setDeleteOpen(false);
            fetchEvents();
        } catch {
            toast.error("Delete failed");
        }
    };

    const formatEventTime = (time) => {
        if (!time) return "—";

        let dateObj = null;

        // Firestore Timestamp
        if (time?.seconds) {
            dateObj = new Date(time.seconds * 1000);
        }
        // ISO string / normal string
        else if (typeof time === "string" || typeof time === "number") {
            dateObj = new Date(time);
        }
        // Already Date object
        else if (time instanceof Date) {
            dateObj = time;
        }

        if (!dateObj || isNaN(dateObj.getTime())) return "—";

        return dateObj.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };


    const getEventStatus = (time) => {
        if (!time) return "draft";

        let eventDate;

        if (time?.seconds) {
            eventDate = new Date(time.seconds * 1000);
        } else if (typeof time === "string" || typeof time === "number") {
            eventDate = new Date(time);
        } else if (time instanceof Date) {
            eventDate = time;
        }

        if (!eventDate || isNaN(eventDate.getTime())) return "draft";

        const now = new Date();
        const diff = eventDate - now;

        if (Math.abs(diff) < 3 * 60 * 60 * 1000) return "live";
        if (diff > 0) return "upcoming";
        return "completed";
    };



    return (
        <>
            {/* <Text variant="h1">Events</Text> */}

            {/* Sticky Filter Bar */}
            <div className="sticky top-0 z-30 bg-white mb-4">
                <Card>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() =>
                                    (window.location.href = "/admin/events/add")
                                }
                            >
                                Add Event
                            </Button>
                        </div>

                        <div className="w-64">
                            <Input
                                placeholder="Search Event"
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Table */}
            <Card>
                {loading ? (
                    <div className="space-y-3 p-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-8 gap-4 h-12 items-center"
                            >
                                {Array.from({ length: 8 }).map((__, j) => (
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
                            {paginated.map((e, i) => (
                                <TableRow key={e.id}>
                                    <td className="px-4 py-3">
                                        {(page - 1) * perPage + i + 1}
                                    </td>

                                    <td className="px-4 py-3 font-medium">
                                        {e.name}
                                    </td>

                                    <td className="px-4 py-3">
                                        {formatEventTime(e.time)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={e.status} />
                                    </td>

                                    <td className="px-4 py-3 font-semibold">
                                        {e.registeredCount}
                                    </td>

                                    <td className="px-4 py-3">
                                        {e.zoom ? (
                                            <a
                                                href={e.zoom}
                                                target="_blank"
                                                className="text-blue-600 underline"
                                            >
                                                Open
                                            </a>
                                        ) : (
                                            "—"
                                        )}
                                    </td>

                                    <td className="px-4 py-3">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => copyEventLink(e.id)}
                                        >
                                            <Copy size={14} />
                                        </Button>
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Tooltip content="Open Event">
                                                <ActionButton
                                                    icon={Pencil}
                                                    onClick={() =>
                                                        (window.location.href = `/admin/event/${e.id}`)
                                                    }
                                                />
                                            </Tooltip>

                                            <Tooltip content="Registered Users">
                                                <ActionButton
                                                    icon={Users}
                                                    onClick={() =>
                                                        openRegistrations(e.id)
                                                    }
                                                />
                                            </Tooltip>

                                            <Tooltip content="Add User">
                                                <ActionButton
                                                    icon={UserPlus}
                                                    onClick={() =>
                                                        openAddUser(e.id)
                                                    }
                                                />
                                            </Tooltip>

                                            <Tooltip content="Delete">
                                                <ActionButton
                                                    icon={Trash2}
                                                    variant="danger"
                                                    onClick={() => openDelete(e)}
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

            <ConfirmModal
                open={deleteOpen}
                title="Delete Event"
                description={`Delete ${eventToDelete?.name}?`}
                onConfirm={confirmDelete}
                onClose={() => setDeleteOpen(false)}
            />
        </>
    );
}
