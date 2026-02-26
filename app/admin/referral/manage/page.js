'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    limit,
    startAfter,
} from 'firebase/firestore';

import { db } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';

import AdminLayout from '@/components/layout/AdminLayout';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ActionButton from '@/components/ui/ActionButton';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/ToastProvider';
import Select from '@/components/ui/Select';
import StatusBadge from '@/components/ui/StatusBadge';

import Table from '@/components/table/Table';
import TableHeader from '@/components/table/TableHeader';
import TableRow from '@/components/table/TableRow';

import ReferralExportButton from '@/components/admin/referral/ReferralExportButton';

import {
    BarChart3,
    User,
    Users,
    Clock,
    Pencil,
    Trash2,
} from 'lucide-react';

export default function ManageReferralsPage() {
    const router = useRouter();
    const toast = useToast();

    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);

    const [lastDoc, setLastDoc] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // search + filters
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [orbiterFilter, setOrbiterFilter] = useState('');

    /* ================= Debounce ================= */
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    /* ================= Initial Fetch ================= */
    useEffect(() => {
        const fetchReferrals = async () => {
            try {
                setLoading(true);

                const q = query(
                    collection(db, COLLECTIONS.referral),
                    orderBy('timestamp', 'desc'),
                    limit(50)
                );

                const snap = await getDocs(q);

                const data = snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));

                setReferrals(data);
                setLastDoc(snap.docs[snap.docs.length - 1] || null);
            } catch {
                toast.error('Failed to load referrals');
            } finally {
                setLoading(false);
            }
        };

        fetchReferrals();
    }, []);

    /* ================= Load More ================= */
    const loadMore = async () => {
        if (!lastDoc) return;

        try {
            setLoadingMore(true);

            const q = query(
                collection(db, COLLECTIONS.referral),
                orderBy('timestamp', 'desc'),
                startAfter(lastDoc),
                limit(50)
            );

            const snap = await getDocs(q);

            const data = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));

            setReferrals((prev) => [...prev, ...data]);
            setLastDoc(snap.docs[snap.docs.length - 1] || null);
        } catch {
            toast.error('Failed to load more');
        } finally {
            setLoadingMore(false);
        }
    };

    /* ================= Unique Orbiters ================= */
    const orbiterOptions = useMemo(() => {
        const names = Array.from(
            new Set(referrals.map((r) => r.orbiter?.name).filter(Boolean))
        );

        return [
            { label: 'All Orbiters', value: '' },
            ...names.map((n) => ({ label: n, value: n })),
        ];
    }, [referrals]);

    /* ================= Filtered ================= */
    const filtered = useMemo(() => {
        const s = debouncedSearch.toLowerCase();

        return referrals.filter((r) => {
            const text = `${r.orbiter?.name || ''} ${r.cosmoOrbiter?.name || ''} ${r.referralId || ''}`
                .toLowerCase();

            const matchSearch = !s || text.includes(s);
            const matchType = !typeFilter || r.referralType === typeFilter;
            const matchStatus = !statusFilter || r.dealStatus === statusFilter;
            const matchOrbiter = !orbiterFilter || r.orbiter?.name === orbiterFilter;

            return matchSearch && matchType && matchStatus && matchOrbiter;
        });
    }, [referrals, debouncedSearch, typeFilter, statusFilter, orbiterFilter]);

    /* ================= Counters ================= */
    const total = filtered.length;
    const selfCount = filtered.filter((r) => r.referralType === 'Self').length;
    const othersCount = filtered.filter((r) => r.referralType === 'Others').length;
    const pendingCount = filtered.filter((r) => r.dealStatus === 'Pending').length;

    /* ================= Delete ================= */
    const askDelete = (id) => {
        setDeleteId(id);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            await deleteDoc(doc(db, COLLECTIONS.referral, deleteId));
            setReferrals((prev) => prev.filter((r) => r.id !== deleteId));
            toast.success('Referral deleted');
        } catch {
            toast.error('Delete failed');
        } finally {
            setConfirmOpen(false);
            setDeleteId(null);
        }
    };

    const handleEdit = (id) => {
        router.push(`/referral/${id}`);
    };


    const getServiceProductName = (ref) => {
        if (ref.service?.name && ref.product?.name)
            return `${ref.service.name} / ${ref.product.name}`;
        return ref.service?.name || ref.product?.name || '—';
    };

    const columns = [
        { label: '#', key: 'index' },
        { label: 'Orbiter', key: 'orbiter' },
        { label: 'Cosmo', key: 'cosmo' },
        { label: 'Type', key: 'type' },
        { label: 'Deal Status', key: 'dealStatus' },
        { label: 'Referral ID', key: 'referralId' },
        { label: 'Deal Value', key: 'dealValue' },
        { label: 'Next Follow-up', key: 'followUp' },
        { label: 'Referral Date', key: 'referralDate' },
        { label: 'Updated', key: 'updated' },
        { label: 'Actions', key: 'actions' },
    ];

    const formatCurrency = (val) => {
        if (!val) return '—';
        return `₹ ${Number(val).toLocaleString()}`;
    };

    const formatDate = (ts) => {
        if (!ts?.seconds) return '—';
        return new Date(ts.seconds * 1000).toLocaleDateString();
    };

    const getLatestStatus = (ref) => {
        if (!ref.statusLogs || ref.statusLogs.length === 0) {
            return 'Pending';
        }
        return ref.statusLogs[ref.statusLogs.length - 1].status || 'Pending';
    };

    const getDealValue = (ref) => {
        if (!ref.dealLogs || ref.dealLogs.length === 0) return '—';

        const latest = ref.dealLogs[ref.dealLogs.length - 1];
        const value = latest?.dealValue ?? latest?.agreedAmount ?? null;

        if (!value) return '—';
        return `₹ ${Number(value).toLocaleString()}`;
    };

    const getReferralType = (ref) => {
        return (
            ref?.referralType ||
            ref?.refType ||
            ref?.type ||
            '—'
        );
    };

    const getDealStatus = (ref) => {
        if (!ref?.statusLogs) return 'Pending';

        if (!Array.isArray(ref.statusLogs)) return 'Pending';

        if (ref.statusLogs.length === 0) return 'Pending';

        const last = ref.statusLogs[ref.statusLogs.length - 1];

        return last?.status || 'Pending';
    };

    const mapStatusColor = (status) => {
        if (!status) return 'secondary';

        const s = status.toLowerCase();

        if (s.includes('won')) return 'success';
        if (s.includes('completed')) return 'success';
        if (s.includes('progress')) return 'info';
        if (s.includes('lost')) return 'danger';
        if (s.includes('pending')) return 'warning';

        return 'secondary';
    };

    return (
        <>
            <div className="p-6 space-y-6">
                {/* Header */}
                <Text as="h1">Manage Referrals</Text>

                {/* ================= STAT CARDS ================= */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card
                        className="p-4 cursor-pointer"
                        onClick={() => {
                            setTypeFilter('');
                            setStatusFilter('');
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            <div>
                                <Text as="h3">Total</Text>
                                <Text>{total}</Text>
                            </div>
                        </div>
                    </Card>

                    <Card
                        className="p-4 cursor-pointer"
                        onClick={() => setTypeFilter('Self')}
                    >
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-green-600" />
                            <div>
                                <Text as="h3">Self</Text>
                                <Text>{selfCount}</Text>
                            </div>
                        </div>
                    </Card>

                    <Card
                        className="p-4 cursor-pointer"
                        onClick={() => setTypeFilter('Others')}
                    >
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-purple-600" />
                            <div>
                                <Text as="h3">Others</Text>
                                <Text>{othersCount}</Text>
                            </div>
                        </div>
                    </Card>

                    <Card
                        className="p-4 cursor-pointer"
                        onClick={() => setStatusFilter('Pending')}
                    >
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-orange-600" />
                            <div>
                                <Text as="h3">Pending</Text>
                                <Text>{pendingCount}</Text>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ================= FILTERS (HORIZONTAL) ================= */}
                <div className="sticky top-[64px] z-20">
                    <Card className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                            {/* LEFT: Export */}
                            <div className="flex items-center">
                                <ReferralExportButton />
                            </div>

                            {/* RIGHT: Horizontal Filters */}
                            <div className="flex flex-wrap items-center gap-3">

                                <div className="w-[240px]">
                                    <Input
                                        placeholder="Search name / ID"
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
                                        value={typeFilter}
                                        onChange={setTypeFilter}
                                        options={[
                                            { label: 'All Types', value: '' },
                                            { label: 'Self', value: 'Self' },
                                            { label: 'Others', value: 'Others' },
                                        ]}
                                    />
                                </div>

                                <div className="w-[180px]">
                                    <Select
                                        value={statusFilter}
                                        onChange={setStatusFilter}
                                        options={[
                                            { label: 'All Status', value: '' },
                                            { label: 'Pending', value: 'Pending' },
                                            { label: 'Deal Won', value: 'Deal Won' },
                                            { label: 'Deal Lost', value: 'Deal Lost' },
                                            { label: 'Work in Progress', value: 'Work in Progress' },
                                            { label: 'Work Completed', value: 'Work Completed' },
                                        ]}
                                    />
                                </div>

                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearch('');
                                        setOrbiterFilter('');
                                        setTypeFilter('');
                                        setStatusFilter('');
                                    }}
                                >
                                    Clear
                                </Button>

                            </div>

                        </div>
                    </Card>
                </div>


                {/* RESULT COUNT */}
                <Text className="text-sm text-gray-500">
                    Showing {filtered.length} results
                </Text>

                {/* ================= TABLE ================= */}
                <Card className="p-0">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            <div className="h-10 bg-gray-200 rounded animate-pulse" />
                            <div className="h-10 bg-gray-200 rounded animate-pulse" />
                            <div className="h-10 bg-gray-200 rounded animate-pulse" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-auto max-h-[65vh]">
                                <Table>
                                    <TableHeader columns={columns} />
                                    <tbody>
                                        {filtered.map((ref, index) => (
                                            <TableRow
                                                key={ref.id}
                                                className="cursor-pointer"
                                                onClick={() => handleEdit(ref.id)}
                                            >
                                                <td className="px-4 py-3">{index + 1}</td>

                                                <td className="px-4 py-3">
                                                    {ref.orbiter?.name || '—'}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {ref.cosmoOrbiter?.name || '—'}
                                                </td>

                                                {/* TYPE */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge status="info" />
                                                        <span>{getReferralType(ref)}</span>
                                                    </div>
                                                </td>

                                                {/* DEAL STATUS (from statusLogs[]) */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge status={mapStatusColor(getDealStatus(ref))} />
                                                        <span>{getDealStatus(ref)}</span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    {ref.referralId || '—'}
                                                </td>

                                                {/* DEAL VALUE (from dealLogs[]) */}
                                                <td className="px-4 py-3 font-semibold">
                                                    {getDealValue(ref)}
                                                </td>

                                                {/* NEXT FOLLOW-UP (only if you add this field later) */}
                                                <td className="px-4 py-3">
                                                    {ref.nextFollowUpDate
                                                        ? new Date(ref.nextFollowUpDate.seconds * 1000).toLocaleDateString()
                                                        : '—'}
                                                </td>

                                                {/* REFERRAL DATE */}
                                                <td className="px-4 py-3">
                                                    {ref.timestamp?.seconds
                                                        ? new Date(ref.timestamp.seconds * 1000).toLocaleDateString()
                                                        : '—'}
                                                </td>

                                                {/* UPDATED */}
                                                <td className="px-4 py-3">
                                                    {ref.lastUpdated?.seconds
                                                        ? new Date(ref.lastUpdated.seconds * 1000).toLocaleDateString()
                                                        : '—'}
                                                </td>

                                                {/* ACTIONS */}
                                                <td
                                                    className="px-4 py-3"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <ActionButton
                                                            icon={Pencil}
                                                            label="Edit"
                                                            variant="ghost"
                                                            onClick={() => handleEdit(ref.id)}
                                                        />
                                                        <ActionButton
                                                            icon={Trash2}
                                                            label="Delete"
                                                            variant="ghostDanger"
                                                            onClick={() => askDelete(ref.id)}
                                                        />
                                                    </div>
                                                </td>
                                            </TableRow>

                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                            <div className="flex justify-center p-4">
                                <Button
                                    variant="secondary"
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? 'Loading…' : 'Load More'}
                                </Button>
                            </div>
                        </>
                    )}
                </Card>

                <ConfirmModal
                    open={confirmOpen}
                    title="Delete this referral?"
                    description="This referral will be permanently removed."
                    onConfirm={confirmDelete}
                    onClose={() => setConfirmOpen(false)}
                />
            </div>
        </>
    );
}
