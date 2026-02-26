'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    updateDoc,
    Timestamp,
    query,
    orderBy,
    arrayUnion,
    where,
    getDocs
} from 'firebase/firestore';

import { auth, db } from '@/firebaseConfig';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import Table from '@/components/table/Table';

import {
    Plus,
    Trash2,
    Pencil,
    Search,
    GripVertical,
    FolderPlus,
    List
} from 'lucide-react';
import Pagination from '@/components/table/Pagination';
import TableHeader from '@/components/table/TableHeader';
import TableRow from '@/components/table/TableRow';

const PAGE_SIZE = 8;

export default function ContentCategoryPage() {
    const [name, setName] = useState('');
    const [categories, setCategories] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [page, setPage] = useState(1);

    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');

    const [selected, setSelected] = useState([]);

    const [toast, setToast] = useState(null);

    const [deleteModal, setDeleteModal] = useState({
        open: false,
        id: null,
    });

    const perPage = 10;
    // const [loading, setLoading] = useState(true);

    // const [page, setPage] = useState(1);

    const ref = query(
        collection(db, 'ContentCategory'),
        orderBy('order', 'asc')
    );

    /* Debounce search */
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    /* Realtime sync */
    useEffect(() => {
        const ref = collection(db, 'ContentCategory');

        const unsub = onSnapshot(ref, async (snap) => {
            const data = snap.docs.map((d, index) => {
                const docData = d.data();

                return {
                    id: d.id,
                    usage: 0,
                    order: docData.order ?? index, // fallback if order missing
                    isActive: docData.isActive ?? true,
                    contentCategoryLower:
                        docData.contentCategoryLower ??
                        (docData.contentCategory || '').toLowerCase(),
                    ...docData,
                };
            });

            setCategories(data);
            setLoading(false);
        });

        return () => unsub();
    }, []);


    /* Toast auto hide */
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2000);
        return () => clearTimeout(t);
    }, [toast]);

    /* Add */
    const handleAdd = async () => {
        if (!name.trim()) return;

        setSaving(true);
        try {
            await addDoc(collection(db, 'ContentCategory'), {
                contentCategory: name,
                contentCategoryLower: name.toLowerCase().trim(),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                order: categories.length,
                isActive: true,
                createdBy: auth?.currentUser?.email || 'admin',
                activity: [
                    {
                        type: 'created',
                        at: Timestamp.now(),
                    },
                ],
            });

            setName('');
            setToast('Category created');
        } finally {
            setSaving(false);
        }
    };

    /* Edit save */
    const handleEditSave = async (id) => {
        if (!editingName.trim()) return;

        await updateDoc(doc(db, 'ContentCategory', id), {
            contentCategory: editingName,
            contentCategoryLower: editingName.toLowerCase().trim(),
            updatedAt: Timestamp.now(),
            activity: arrayUnion({
                type: 'edited',
                at: Timestamp.now(),
            }),
        });

        setEditingId(null);
        setToast('Updated');
    };

    /* Toggle status */
    const toggleStatus = async (cat) => {
        await updateDoc(doc(db, 'ContentCategory', cat.id), {
            isActive: !cat.isActive,
            updatedAt: Timestamp.now(),
        });
        setToast('Status changed');
    };

    /* Delete */
    const confirmDelete = async () => {
        await deleteDoc(doc(db, 'ContentCategory', deleteModal.id));
        setDeleteModal({ open: false, id: null });
        setToast('Deleted');
    };

    /* Bulk delete */
    const bulkDelete = async () => {
        await Promise.all(
            selected.map((id) =>
                deleteDoc(doc(db, 'ContentCategory', id))
            )
        );
        setSelected([]);
        setToast('Bulk deleted');
    };

    /* Search */
    const filtered = categories.filter((c) =>
        c.contentCategoryLower?.includes(debouncedSearch.toLowerCase())
    );

    /* Pagination */
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    /* Move */
    const move = async (globalIndex, dir) => {
        const newIndex = globalIndex + dir;
        if (newIndex < 0 || newIndex >= categories.length) return;

        const current = categories[globalIndex];
        const target = categories[newIndex];

        await updateDoc(doc(db, 'ContentCategory', current.id), {
            order: newIndex,
        });

        await updateDoc(doc(db, 'ContentCategory', target.id), {
            order: globalIndex,
        });
    };

    const columns = [
        { label: "Sr no" },
        { label: "Category Name" },
        { label: "Updated" },
        { label: "Status" },
        { label: "Usage" },
        { label: "Actions" },
    ];

    return (
        <>
            {toast && (
                <div className="fixed bottom-6 right-6 bg-black text-white px-4 py-2 rounded-lg shadow">
                    {toast}
                </div>
            )}
            <div className="w-full">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="lg:w-[300px] flex-shrink-0">
                        {/* LEFT CARD - CREATE */}
                        <Card >
                            <div className="space-y-4">
                                {/* HEADER WITH ICON */}
                                <div className="flex items-center gap-2">
                                    <FolderPlus className="text-indigo-600" size={18} />
                                    <Text variant="h3">Create Category</Text>
                                </div>

                                <FormField label="Category Name">
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter category name"
                                        className="w-full border border-slate-200 px-3 py-2 rounded-lg"
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' && handleAdd()
                                        }
                                    />
                                </FormField>

                                <Button onClick={handleAdd} disabled={saving}>
                                    <Plus size={16} />
                                    {saving ? 'Adding…' : 'Add Category'}
                                </Button>
                            </div>
                        </Card>
                    </div>
                    <div className="flex-1 min-w-0">
                        {/* RIGHT CARD - MANAGER */}
                        <Card>
                            <div className="space-y-4">

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <List className="text-indigo-600" size={18} />
                                        <Text variant="h3">Category Manager</Text>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Search size={16} />
                                        <input
                                            placeholder="Search"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="border border-slate-200 px-2 py-1 rounded"
                                        />
                                    </div>
                                </div>

                                {selected.length > 0 && (
                                    <Button variant="danger" onClick={bulkDelete}>
                                        Delete Selected ({selected.length})
                                    </Button>
                                )}

                                <Table className="text-sm">
                                    <TableHeader columns={columns} />

                                    <tbody className="divide-y">
                                        {loading ? (
                                            [...Array(6)].map((_, i) => (
                                                <tr key={i} className='border-0'>
                                                    <td colSpan={6} className="px-4 py-4">
                                                        <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            paginated.map((cat, i) => (
                                                <TableRow key={cat.id} className="hover:bg-slate-50 transition">

                                                    <td className="px-4 py-3 text-slate-600">
                                                        {(page - 1) * perPage + i + 1}
                                                    </td>

                                                    <td className="px-4 py-3 font-medium text-slate-800">
                                                        {cat.contentCategory}
                                                    </td>

                                                    <td className="px-4 py-3 text-slate-600">
                                                        {cat.updatedAt?.seconds
                                                            ? new Date(cat.updatedAt.seconds * 1000).toLocaleString()
                                                            : "—"}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`px-2 py-1 text-xs rounded-md font-medium ${cat.isActive
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-gray-100 text-gray-600"
                                                                }`}
                                                        >
                                                            {cat.isActive ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3 font-semibold text-slate-800">
                                                        {cat.usage || 0}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <Button size="sm" variant="ghost">
                                                                <Pencil size={16} />
                                                            </Button>
                                                            <Button size="sm" variant="ghost">
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </div>
                                                    </td>

                                                </TableRow>
                                            ))
                                        )}
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


                                <div className="flex justify-between">
                                    <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
                                        Prev
                                    </Button>

                                    <Text>
                                        Page {page} / {totalPages || 1}
                                    </Text>

                                    <Button
                                        disabled={page === totalPages}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
            <Modal
                open={deleteModal.open}
                onClose={() => setDeleteModal({ open: false })}
                title="Delete Category"
            >
                <div className="space-y-4">
                    <Text>Are you sure you want to delete?</Text>

                    <div className="flex justify-end gap-2">
                        <Button onClick={() => setDeleteModal({ open: false })}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
