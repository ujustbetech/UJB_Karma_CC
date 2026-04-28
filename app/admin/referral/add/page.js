'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/ui/FormField';
import { useToast } from '@/components/ui/ToastProvider';
import { UserPlus, Users, Briefcase, Settings } from 'lucide-react';

export default function AddReferralPage() {
  const toast = useToast();
  const firstFieldRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [orbiterSearch, setOrbiterSearch] = useState('');
  const [cosmoSearch, setCosmoSearch] = useState('');
  const [selectedOrbiter, setSelectedOrbiter] = useState(null);
  const [selectedCosmo, setSelectedCosmo] = useState(null);
  const [selectedServiceName, setSelectedServiceName] = useState('');
  const [selectedProductName, setSelectedProductName] = useState('');
  const [dealStatus, setDealStatus] = useState('Pending');
  const [refType, setRefType] = useState('Self');
  const [leadDescription, setLeadDescription] = useState('');
  const [referralSource, setReferralSource] = useState('MonthlyMeeting');
  const [otherReferralSource, setOtherReferralSource] = useState('');
  const [otherName, setOtherName] = useState('');
  const [otherPhone, setOtherPhone] = useState('');
  const [otherEmail, setOtherEmail] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch('/api/admin/orbiters?view=full', {
          credentials: 'include',
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.message || 'Failed to load users');
        setUsers(Array.isArray(payload.users) ? payload.users : []);
      } catch (error) {
        toast.error(error.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [toast]);

  const filteredOrbiters = useMemo(() => {
    const term = orbiterSearch.toLowerCase();
    if (!term || selectedOrbiter) return [];
    return users
      .filter((u) => String(u.Name || '').toLowerCase().includes(term))
      .slice(0, 8);
  }, [users, orbiterSearch, selectedOrbiter]);

  const filteredCosmos = useMemo(() => {
    const term = cosmoSearch.toLowerCase();
    if (!term || selectedCosmo) return [];
    return users
      .filter((u) => String(u.Category || '').toLowerCase().includes('cosmo'))
      .filter((u) => String(u.Name || '').toLowerCase().includes(term))
      .slice(0, 8);
  }, [users, cosmoSearch, selectedCosmo]);

  const serviceOptions = useMemo(() => {
    const list = Array.isArray(selectedCosmo?.services) ? selectedCosmo.services : [];
    return [{ label: 'Select Service', value: '' }, ...list.map((s) => ({ label: s.name || s.serviceName || '', value: s.name || s.serviceName || '' }))];
  }, [selectedCosmo]);

  const productOptions = useMemo(() => {
    const list = Array.isArray(selectedCosmo?.products) ? selectedCosmo.products : [];
    return [{ label: 'Select Product', value: '' }, ...list.map((p) => ({ label: p.name || p.productName || '', value: p.name || p.productName || '' }))];
  }, [selectedCosmo]);

  const resetForm = () => {
    setOrbiterSearch('');
    setCosmoSearch('');
    setSelectedOrbiter(null);
    setSelectedCosmo(null);
    setSelectedServiceName('');
    setSelectedProductName('');
    setDealStatus('Pending');
    setRefType('Self');
    setLeadDescription('');
    setReferralSource('MonthlyMeeting');
    setOtherReferralSource('');
    setOtherName('');
    setOtherPhone('');
    setOtherEmail('');
    setErrors({});
  };

  const validate = () => {
    const next = {};
    if (!selectedOrbiter) next.orbiter = 'Select orbiter';
    if (!selectedCosmo) next.cosmo = 'Select cosmo';
    if (!selectedServiceName && !selectedProductName) next.service = 'Select service or product';
    if (refType === 'Others') {
      if (!otherName.trim()) next.otherName = 'Name required';
      if (!otherPhone.trim()) next.otherPhone = 'Phone required';
      if (!otherEmail.trim()) next.otherEmail = 'Email required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const selectedService =
        (Array.isArray(selectedCosmo?.services) ? selectedCosmo.services : []).find(
          (s) => (s.name || s.serviceName || '') === selectedServiceName
        ) || null;
      const selectedProduct =
        (Array.isArray(selectedCosmo?.products) ? selectedCosmo.products : []).find(
          (p) => (p.name || p.productName || '') === selectedProductName
        ) || null;

      const selectedItem = selectedService
        ? { type: 'service', label: selectedServiceName, raw: selectedService }
        : { type: 'product', label: selectedProductName, raw: selectedProduct };

      const res = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          selectedOrbiterId: selectedOrbiter.id,
          selectedCosmoId: selectedCosmo.id,
          selectedItem,
          leadDescription,
          refType,
          referralSource,
          otherReferralSource,
          otherName,
          otherPhone,
          otherEmail,
          dealStatus,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || 'Referral creation failed');
      }
      toast.success('Referral submitted successfully');
      resetForm();
      firstFieldRef.current?.focus();
    } catch (error) {
      toast.error(error.message || 'Submission failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-blue-600" />
        <Text as="h1">Add Referral</Text>
      </div>

      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <Text as="h2">Select People</Text>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Search Orbiter" error={errors.orbiter} required>
            <div className="relative">
              <Input
                ref={firstFieldRef}
                value={orbiterSearch}
                onChange={(e) => {
                  setOrbiterSearch(e.target.value);
                  setSelectedOrbiter(null);
                }}
                placeholder="Type member name"
              />
              {filteredOrbiters.length > 0 && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow max-h-56 overflow-auto">
                  {filteredOrbiters.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSelectedOrbiter({ id: u.id, name: u.Name || '', phone: u.MobileNo || '' });
                        setOrbiterSearch(u.Name || '');
                        setErrors((p) => ({ ...p, orbiter: '' }));
                      }}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="text-sm font-medium">{u.Name}</div>
                      <div className="text-xs text-gray-500">{u.MobileNo}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          <FormField label="Search Cosmo Orbiter" error={errors.cosmo} required>
            <div className="relative">
              <Input
                value={cosmoSearch}
                onChange={(e) => {
                  setCosmoSearch(e.target.value);
                  setSelectedCosmo(null);
                }}
                placeholder="Type cosmo name"
              />
              {filteredCosmos.length > 0 && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow max-h-56 overflow-auto">
                  {filteredCosmos.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSelectedCosmo(u);
                        setCosmoSearch(u.Name || '');
                        setSelectedServiceName('');
                        setSelectedProductName('');
                        setErrors((p) => ({ ...p, cosmo: '' }));
                      }}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="text-sm font-medium">{u.Name}</div>
                      <div className="text-xs text-gray-500">{u.MobileNo}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>
        </div>
      </Card>

      {selectedCosmo && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <Text as="h2">Offering</Text>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Service" error={errors.service}>
              <Select
                value={selectedServiceName}
                onChange={(val) => {
                  setSelectedServiceName(val);
                  setSelectedProductName('');
                  setErrors((p) => ({ ...p, service: '' }));
                }}
                options={serviceOptions}
              />
            </FormField>
            <FormField label="Product" error={errors.service}>
              <Select
                value={selectedProductName}
                onChange={(val) => {
                  setSelectedProductName(val);
                  setSelectedServiceName('');
                  setErrors((p) => ({ ...p, service: '' }));
                }}
                options={productOptions}
              />
            </FormField>
          </div>
          {(selectedServiceName || selectedProductName) && (
            <FormField label="Lead Description">
              <Textarea value={leadDescription} onChange={(e) => setLeadDescription(e.target.value)} />
            </FormField>
          )}
        </Card>
      )}

      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600" />
          <Text as="h2">Deal Details</Text>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Deal Status">
            <Select
              value={dealStatus}
              onChange={setDealStatus}
              options={[
                { label: 'Pending', value: 'Pending' },
                { label: 'Deal Won', value: 'Deal Won' },
                { label: 'Deal Lost', value: 'Deal Lost' },
                { label: 'Work in Progress', value: 'Work in Progress' },
                { label: 'Work Completed', value: 'Work Completed' },
              ]}
            />
          </FormField>
          <FormField label="Referral Type">
            <Select
              value={refType}
              onChange={setRefType}
              options={[
                { label: 'Self', value: 'Self' },
                { label: 'Others', value: 'Others' },
              ]}
            />
          </FormField>
        </div>

        {refType === 'Others' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Referrer Name" error={errors.otherName}>
              <Input value={otherName} onChange={(e) => setOtherName(e.target.value)} />
            </FormField>
            <FormField label="Referrer Phone" error={errors.otherPhone}>
              <Input value={otherPhone} onChange={(e) => setOtherPhone(e.target.value)} />
            </FormField>
            <FormField label="Referrer Email" error={errors.otherEmail}>
              <Input value={otherEmail} onChange={(e) => setOtherEmail(e.target.value)} />
            </FormField>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Referral Source">
            <Select
              value={referralSource}
              onChange={setReferralSource}
              options={[
                { label: 'Monthly Meeting', value: 'MonthlyMeeting' },
                { label: 'Conclave Meeting', value: 'ConclaveMeeting' },
                { label: 'OTC Meeting', value: 'OTCMeeting' },
                { label: 'Phone', value: 'Phone' },
                { label: 'Other', value: 'Other' },
              ]}
            />
          </FormField>
          {referralSource === 'Other' && (
            <FormField label="Other Source">
              <Input value={otherReferralSource} onChange={(e) => setOtherReferralSource(e.target.value)} />
            </FormField>
          )}
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 pb-4">
          <Card className="flex items-center justify-between px-4 py-3 shadow-lg border">
            <Text className="text-sm text-slate-600">Do not forget to save your changes</Text>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : 'Submit Referral'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
