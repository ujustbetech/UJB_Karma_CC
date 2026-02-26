'use client';

import { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  arrayUnion
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import FormField from '@/components/ui/FormField';
import ActionButton from '@/components/ui/ActionButton';
import Tooltip from '@/components/ui/Tooltip';
import StatusBadge from '@/components/ui/StatusBadge';
import Table from '@/components/table/Table';
import TableHeader from '@/components/table/TableHeader';
import TableRow from '@/components/table/TableRow';
import { useToast } from '@/components/ui/ToastProvider';
// import { Network, Users } from 'lucide-react';
import { Send, Check, Clock, Network, Users } from 'lucide-react';

export default function ConclaveSection({ eventId, fetchData }) {
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState({ id: '', name: '' });
  const [search, setSearch] = useState('');

  const [conclaves, setConclaves] = useState([]);
  const [selectedConclaveId, setSelectedConclaveId] = useState('');

  const [invitedList, setInvitedList] = useState([]);
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!eventId) return;
    loadData();
  }, [eventId]);

  const loadData = async () => {
    const eventSnap = await getDoc(doc(db, COLLECTIONS.monthlyMeeting, eventId));
    if (eventSnap.exists()) {
      const data = eventSnap.data();
      setInvitedList(data.invitedUsers || []);
    }

    const userSnap = await getDocs(collection(db, COLLECTIONS.userDetail));
    const userList = userSnap.docs.map(d => ({
      ujbCode: d.id,
      name: d.data()['Name'] || 'Unnamed',
      phone: d.data().MobileNo || ''
    }));
    setUsers(userList);

    const conclaveSnap = await getDocs(collection(db, COLLECTIONS.conclaves));
    const conclaveList = conclaveSnap.docs.map(d => ({
      label: d.data().conclaveStream || 'Unnamed Stream',
      value: d.id,
    }));
    setConclaves(conclaveList);
  };

  const handleSearch = (value) => {
    setSearch(value);
    setSelectedUser({ id: '', name: value });

    if (!value) {
      setFilteredUsers([]);
      return;
    }

    const filtered = users.filter(u =>
      u.name?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user) => {
    setSelectedUser({ id: user.phone, name: user.name });
    setSearch(user.name);
    setFilteredUsers([]);
    setErrors(prev => ({ ...prev, user: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedUser.id) newErrors.user = 'Select an orbiter';
    if (!selectedConclaveId) newErrors.conclave = 'Select a stream';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveInvitation = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const eventRef = doc(db, COLLECTIONS.monthlyMeeting, eventId);

      await updateDoc(eventRef, {
        invitedUsers: arrayUnion({
          id: selectedUser.id,
          name: selectedUser.name,
          invitedAt: new Date(),
          sent: false
        })
      });

      const conclaveRef = doc(db, COLLECTIONS.conclaves, selectedConclaveId);
      await updateDoc(conclaveRef, {
        orbiters: arrayUnion(selectedUser.id)
      });

      toast.success('Invitation saved');

      setSelectedUser({ id: '', name: '' });
      setSearch('');
      setSelectedConclaveId('');

      await loadData();
      fetchData?.();
    } catch {
      toast.error('Failed to save invitation');
    }
    setSaving(false);
  };

  const handleSendWhatsApp = async (user) => {
    try {
      const eventRef = doc(db, COLLECTIONS.monthlyMeeting, eventId);
      const snap = await getDoc(eventRef);
      const data = snap.data();

      const updated = (data.invitedUsers || []).map(u =>
        u.id === user.id ? { ...u, sent: true } : u
      );

      await updateDoc(eventRef, { invitedUsers: updated });
      setInvitedList(updated);

      toast.success('Message sent');
    } catch {
      toast.error('Failed to send message');
    }
  };

  const tabs = [
    {
      id: 'invite',
      label: 'Invite',
      content: (
        <Card className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Network className="w-5 h-5 text-blue-600" />
            <Text as="h2">Conclave</Text>
            {/* <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
            {documentUploads.length}
          </span> */}
          </div>

          <div className="space-y-5">

            {/* Search Orbiter */}
            <FormField label="Search Orbiter" error={errors.user} required>
              <div className="relative">
                <Input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  error={!!errors.user}
                  placeholder="Type member name"
                  autoFocus
                />

                {filteredUsers.length > 0 && (
                  <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    {filteredUsers.map(u => (
                      <div
                        key={u.ujbCode}
                        className="px-4 py-2.5 cursor-pointer hover:bg-blue-50 transition"
                        onClick={() => handleSelectUser(u)}
                      >
                        <div className="text-sm font-medium text-slate-800">
                          {u.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {u.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            {/* Conclave Stream */}
            <FormField label="Conclave Stream" error={errors.conclave} required>
              <Select
                value={selectedConclaveId}
                onChange={(val) => {
                  setSelectedConclaveId(val);
                  setErrors(prev => ({ ...prev, conclave: null }));
                }}
                options={[
                  { label: '-- Select Stream --', value: '' },
                  ...conclaves
                ]}
                error={!!errors.conclave}
              />
            </FormField>

            {/* CTA */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="primary"
                onClick={handleSaveInvitation}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Invitation'}
              </Button>
            </div>

          </div>
        </Card>
      )
    },
    {
      label: 'Invited List',
      id: 'invited-list',
      content: (
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Network className="w-5 h-5 text-blue-600" />
            <Text as="h2">Conclave Invited in conclave</Text>
            {/* <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
            {documentUploads.length}
          </span> */}
          </div>

          <Table>
            <TableHeader
              columns={[
                { key: 'index', label: '#' },
                { key: 'name', label: 'Member' },
                { key: 'invitedAt', label: 'Invited At' },
                { key: 'status', label: 'Status' },
                { key: 'action', label: 'Action' },
              ]}
            />

            <tbody>
              {invitedList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">
                    No invitations yet
                  </td>
                </tr>
              ) : (
                invitedList.map((user, index) => {
                  const isSent = user.sent === true;
                  const date = user.invitedAt?.seconds
                    ? new Date(user.invitedAt.seconds * 1000)
                    : null;

                  return (
                    <TableRow
                      key={user.id + index}
                      className="hover:bg-slate-50 transition"
                    >
                      {/* Index */}
                      <td className="text-slate-400 text-sm">
                        {index + 1}
                      </td>

                      {/* Name + Avatar + Phone */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                            {user.name?.charAt(0) || 'U'}
                          </div>

                          <div>
                            <div className="font-medium text-slate-800">
                              {user.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {user.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4">
                        {date ? (
                          <>
                            <div className="text-sm text-slate-700">
                              {date.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {date.toLocaleTimeString()}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={isSent ? 'success' : 'warning'}>
                          <span className="flex items-center gap-1">
                            {isSent ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Sent
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5" />
                                Pending
                              </>
                            )}
                          </span>
                        </StatusBadge>
                      </td>

                      {/* Action */}
                      <td className="w-[150px] py-3 px-4">
                        {isSent ? (
                          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                            <Check className="w-4 h-4" />
                            Delivered
                          </div>
                        ) : (


                          <ActionButton
                            icon={Send}
                            variant="ghostDanger"
                            label="Send"
                            onClick={() => handleSendWhatsApp(user)}
                          />
                        )}
                      </td>
                    </TableRow>
                  );
                })
              )}
            </tbody>
          </Table>

        </Card>
      )
    }
  ];

  return <Tabs tabs={tabs} />;
}
