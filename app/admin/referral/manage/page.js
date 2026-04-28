'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { BarChart3, User, Users, Clock, Plus, Pencil, Trash2 } from 'lucide-react';

export default function ManageReferralsPage() {
  const router = useRouter();
  const toast = useToast();

  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orbiterFilter, setOrbiterFilter] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/referrals', { credentials: 'include' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.message || 'Failed to load referrals');
      setReferrals(Array.isArray(payload.referrals) ? payload.referrals : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const orbiterOptions = useMemo(() => {
    const names = Array.from(new Set(referrals.map((r) => r.orbiter?.name).filter(Boolean)));
    return [{ label: 'All Orbiters', value: '' }, ...names.map((n) => ({ label: n, value: n }))];
  }, [referrals]);

  const filtered = useMemo(() => {
    const s = debouncedSearch.toLowerCase();
    return referrals.filter((r) => {
      const text = `${r.orbiter?.name || ''} ${r.cosmoOrbiter?.name || ''} ${r.referralId || ''}`.toLowerCase();
      const matchSearch = !s || text.includes(s);
      const matchType = !typeFilter || getReferralType(r) === typeFilter;
      const matchStatus = !statusFilter || getDealStatus(r) === statusFilter;
      const matchOrbiter = !orbiterFilter || r.orbiter?.name === orbiterFilter;
      return matchSearch && matchType && matchStatus && matchOrbiter;
    });
  }, [referrals, debouncedSearch, typeFilter, statusFilter, orbiterFilter]);

  const total = filtered.length;
  const selfCount = filtered.filter((r) => getReferralType(r) === 'Self').length;
  const othersCount = filtered.filter((r) => getReferralType(r) === 'Others').length;
  const pendingCount = filtered.filter((r) => getDealStatus(r) === 'Pending').length;

  const askDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/referrals?id=${encodeURIComponent(deleteId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.message || 'Delete failed');
      setReferrals((prev) => prev.filter((r) => r.id !== deleteId));
      toast.success('Referral deleted');
    } catch (error) {
      toast.error(error.message || 'Delete failed');
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (id) => router.push(`/admin/referral/${id}`);

  const columns = [
    { label: '#', key: 'index' },
    { label: 'Orbiter', key: 'orbiter' },
    { label: 'Cosmo', key: 'cosmo' },
    { label: 'Type', key: 'type' },
    { label: 'Deal Status', key: 'dealStatus' },
    { label: 'Referral ID', key: 'referralId' },
    { label: 'Deal Value', key: 'dealValue' },
    { label: 'Actions', key: 'actions' },
  ];

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 cursor-pointer" onClick={() => { setTypeFilter(''); setStatusFilter(''); }}>
            <div className="flex items-center gap-3"><BarChart3 className="w-5 h-5 text-blue-600" /><div><Text as="h3">Total</Text><Text>{total}</Text></div></div>
          </Card>
          <Card className="p-4 cursor-pointer" onClick={() => setTypeFilter('Self')}>
            <div className="flex items-center gap-3"><User className="w-5 h-5 text-green-600" /><div><Text as="h3">Self</Text><Text>{selfCount}</Text></div></div>
          </Card>
          <Card className="p-4 cursor-pointer" onClick={() => setTypeFilter('Others')}>
            <div className="flex items-center gap-3"><Users className="w-5 h-5 text-purple-600" /><div><Text as="h3">Others</Text><Text>{othersCount}</Text></div></div>
          </Card>
          <Card className="p-4 cursor-pointer" onClick={() => setStatusFilter('Pending')}>
            <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-orange-600" /><div><Text as="h3">Pending</Text><Text>{pendingCount}</Text></div></div>
          </Card>
        </div>

        <div className="sticky top-[64px] z-20">
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button onClick={() => (window.location.href = '/admin/referral/add')}>
                  <Plus size={16} /> Add Referral
                </Button>
                <ReferralExportButton />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="w-[240px]"><Input placeholder="Search name / ID" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                <div className="w-[180px]"><Select value={orbiterFilter} onChange={setOrbiterFilter} options={orbiterOptions} /></div>
                <div className="w-[150px]"><Select value={typeFilter} onChange={setTypeFilter} options={[{ label: 'All Types', value: '' }, { label: 'Self', value: 'Self' }, { label: 'Others', value: 'Others' }]} /></div>
                <div className="w-[180px]"><Select value={statusFilter} onChange={setStatusFilter} options={[{ label: 'All Status', value: '' }, { label: 'Pending', value: 'Pending' }, { label: 'Deal Won', value: 'Deal Won' }, { label: 'Deal Lost', value: 'Deal Lost' }, { label: 'Work in Progress', value: 'Work in Progress' }, { label: 'Work Completed', value: 'Work Completed' }]} /></div>
                <Button variant="ghost" onClick={() => { setSearch(''); setOrbiterFilter(''); setTypeFilter(''); setStatusFilter(''); }}>Clear</Button>
              </div>
            </div>
          </Card>
        </div>

        <Text className="text-sm text-gray-500">Showing {filtered.length} results</Text>

        <Card className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <div className="overflow-auto max-h-[65vh]">
              <Table>
                <TableHeader columns={columns} />
                <tbody>
                  {filtered.map((ref, index) => (
                    <TableRow key={ref.id} className="cursor-pointer" onClick={() => handleEdit(ref.id)}>
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">{ref.orbiter?.name || '-'}</td>
                      <td className="px-4 py-3">{ref.cosmoOrbiter?.name || '-'}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><StatusBadge status="info" /><span>{getReferralType(ref)}</span></div></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><StatusBadge status={mapStatusColor(getDealStatus(ref))} /><span>{getDealStatus(ref)}</span></div></td>
                      <td className="px-4 py-3">{ref.referralId || '-'}</td>
                      <td className="px-4 py-3 font-semibold">{getDealValue(ref)}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <ActionButton icon={Pencil} label="Edit" variant="ghost" onClick={() => handleEdit(ref.id)} />
                          <ActionButton icon={Trash2} label="Delete" variant="ghostDanger" onClick={() => askDelete(ref.id)} />
                        </div>
                      </td>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </div>
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

function getReferralType(ref) {
  return ref?.referralType || ref?.refType || ref?.type || '-';
}

function getDealStatus(ref) {
  const logs = Array.isArray(ref?.statusLogs) ? ref.statusLogs : [];
  if (!logs.length) return 'Pending';
  return logs[logs.length - 1]?.status || 'Pending';
}

function getDealValue(ref) {
  const logs = Array.isArray(ref?.dealLogs) ? ref.dealLogs : [];
  if (!logs.length) return '-';
  const latest = logs[logs.length - 1];
  const value = latest?.dealValue ?? latest?.agreedAmount ?? null;
  if (!value) return '-';
  return `INR ${Number(value).toLocaleString()}`;
}

function mapStatusColor(status) {
  if (!status) return 'secondary';
  const s = String(status).toLowerCase();
  if (s.includes('won') || s.includes('completed')) return 'success';
  if (s.includes('progress')) return 'info';
  if (s.includes('lost')) return 'danger';
  if (s.includes('pending')) return 'warning';
  return 'secondary';
}
