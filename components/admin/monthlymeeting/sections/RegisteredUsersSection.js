'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  setDoc,
  getDoc,
  db,
} from '@/services/adminMonthlyMeetingFirebaseService';

import { COLLECTIONS } from '@/lib/utility_collection';
import {
  appendMonthlyMeetingAuditLogs,
  buildMonthlyMeetingAuditEntry,
} from '@/lib/monthlymeeting/monthlyMeetingAudit.mjs';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ActionButton from '@/components/ui/ActionButton';
import Modal from '@/components/ui/Modal';
import { FormField, Textarea } from '@/components/ui/form';
import Table from '@/components/table/Table';
import TableHeader from '@/components/table/TableHeader';
import TableRow from '@/components/table/TableRow';
import { useToast } from '@/components/ui/ToastProvider';

import { Eye, Plus, Phone, MessageCircle, Users } from 'lucide-react';

export default function RegisteredUsersSection({ eventId, data, currentAdmin }) {
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    number: '',
    name: '',
    category: '',
    ujb: '',
    presentOnly: false,
  });

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedFeedbacks, setSelectedFeedbacks] = useState([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [predefinedFeedback, setPredefinedFeedback] = useState('');
  const [customFeedback, setCustomFeedback] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const usersPerPage = 10;

  const predefinedFeedbacks = [
    'Available',
    'Not Available',
    'Not Connected Yet',
    'Called but no response',
    'Tentative',
    'Other response',
  ];

  useEffect(() => {
    if (!eventId) return;

    const ref = collection(db, `${COLLECTIONS.monthlyMeeting}/${eventId}/registeredUsers`);
    const registeredUsersQuery = query(ref, orderBy('registeredAt', 'desc'));

    const unsubscribe = onSnapshot(registeredUsersQuery, async (snapshot) => {
      const rawUsers = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      const userSnap = await getDocs(collection(db, COLLECTIONS.userDetail));
      const userMap = {};

      userSnap.forEach((item) => {
        const details = item.data();
        userMap[details.MobileNo] = details;
      });

      const enriched = rawUsers.map((user) => {
        const details = userMap[user.id] || {};

        return {
          ...user,
          name: details.Name || user.name || 'Unknown',
          category: details.Category || '',
          ujbcode: details.UJBCode || '',
          feedback: user.feedback || [],
        };
      });

      setUsers(enriched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.id.includes(filters.number) &&
          (user.name || '').toLowerCase().includes(filters.name.toLowerCase()) &&
          (user.category || '').toLowerCase().includes(filters.category.toLowerCase()) &&
          (user.ujbcode || '').toLowerCase().includes(filters.ujb.toLowerCase()) &&
          (!filters.presentOnly || user.attendanceStatus)
      ),
    [users, filters]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, users.length]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const stats = useMemo(() => {
    const total = users.length;
    const present = users.filter((user) => user.attendanceStatus).length;
    const pending = total - present;
    const percent = total ? Math.round((present / total) * 100) : 0;

    return { total, present, pending, percent };
  }, [users]);

  const markAttendance = async (phone) => {
    await updateDoc(
      doc(db, `${COLLECTIONS.monthlyMeeting}/${eventId}/registeredUsers`, phone),
      {
        attendanceStatus: true,
        timestamp: serverTimestamp(),
      }
    );

    const meetingRef = doc(db, COLLECTIONS.monthlyMeeting, eventId);
    const meetingSnap = await getDoc(meetingRef);
    const currentUsers = await getDocs(
      collection(db, `${COLLECTIONS.monthlyMeeting}/${eventId}/registeredUsers`)
    );
    const userTotals = currentUsers.size;
    await updateDoc(meetingRef, {
      auditLogs: appendMonthlyMeetingAuditLogs(
        meetingSnap.data()?.auditLogs,
        [
          buildMonthlyMeetingAuditEntry({
            section: 'Registered Users',
            field: 'attendanceStatus',
            before: 'Pending',
            after: `Present for ${phone}`,
            actor: currentAdmin,
          }),
        ]
      ),
      updatedBy: {
        name: currentAdmin?.name || currentAdmin?.email || 'Admin',
        role: currentAdmin?.role || '',
        identity: currentAdmin?.identity?.id || currentAdmin?.email || '',
      },
      updatedAt: new Date(),
      registeredUsersSummary: userTotals,
    });

    toast.success('Attendance marked');
  };

  const openViewModal = (feedback, name) => {
    setSelectedFeedbacks(feedback || []);
    setSelectedUserName(name);
    setViewModalOpen(true);
  };

  const openAddFeedbackModal = (id, name) => {
    setCurrentUserId(id);
    setSelectedUserName(name);
    setFeedbackModalOpen(true);
  };

  const submitFeedback = async () => {
    if (!currentUserId) {
      toast.error('User not selected');
      return;
    }

    if (!predefinedFeedback && !customFeedback) {
      toast.error('Enter feedback');
      return;
    }

    const ref = doc(
      db,
      `${COLLECTIONS.monthlyMeeting}/${eventId}/registeredUsers`,
      currentUserId
    );
    const snap = await getDoc(ref);
    const existingFeedback = snap.exists() ? snap.data().feedback || [] : [];

    const newEntry = {
      predefined: predefinedFeedback || 'None',
      custom: customFeedback || 'None',
      timestamp: new Date().toISOString(),
    };

    await setDoc(
      ref,
      {
        phoneNumber: currentUserId,
        feedback: [...existingFeedback, newEntry],
      },
      { merge: true }
    );

    const meetingRef = doc(db, COLLECTIONS.monthlyMeeting, eventId);
    const meetingSnap = await getDoc(meetingRef);
    await updateDoc(meetingRef, {
      auditLogs: appendMonthlyMeetingAuditLogs(
        meetingSnap.data()?.auditLogs,
        [
          buildMonthlyMeetingAuditEntry({
            section: 'Registered Users',
            field: 'feedback',
            before: `Feedback count ${existingFeedback.length}`,
            after: `Feedback count ${existingFeedback.length + 1}`,
            actor: currentAdmin,
          }),
        ]
      ),
      updatedBy: {
        name: currentAdmin?.name || currentAdmin?.email || 'Admin',
        role: currentAdmin?.role || '',
        identity: currentAdmin?.identity?.id || currentAdmin?.email || '',
      },
      updatedAt: new Date(),
    });

    toast.success('Feedback saved');
    setFeedbackModalOpen(false);
    setPredefinedFeedback('');
    setCustomFeedback('');
  };

  const SkeletonRow = () => (
    <TableRow>
      <td><div className="h-4 w-6 animate-pulse rounded bg-slate-200" /></td>
      <td><div className="h-4 w-24 animate-pulse rounded bg-slate-200" /></td>
      <td><div className="h-4 w-32 animate-pulse rounded bg-slate-200" /></td>
      <td><div className="h-4 w-20 animate-pulse rounded bg-slate-200" /></td>
      <td><div className="h-8 w-32 animate-pulse rounded bg-slate-200" /></td>
      <td><div className="h-8 w-24 animate-pulse rounded bg-slate-200" /></td>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-blue-600" />
        <Text as="h2">Register Orbiters</Text>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
          <div><Text>Total</Text><h2>{stats.total}</h2></div>
          <div><Text>Present</Text><h2>{stats.present}</h2></div>
          <div><Text>Pending</Text><h2>{stats.pending}</h2></div>
          <div><Text>Attendance</Text><h2>{stats.percent}%</h2></div>
        </div>

        <div className="mt-4 h-2 w-full rounded bg-gray-200">
          <div className="h-2 rounded bg-green-500" style={{ width: `${stats.percent}%` }} />
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Input
            placeholder="Number"
            onChange={(event) =>
              setFilters((previous) => ({ ...previous, number: event.target.value }))
            }
          />
          <Input
            placeholder="Name"
            onChange={(event) =>
              setFilters((previous) => ({ ...previous, name: event.target.value }))
            }
          />
          <Input
            placeholder="Category"
            onChange={(event) =>
              setFilters((previous) => ({ ...previous, category: event.target.value }))
            }
          />
          <Input
            placeholder="UJB"
            onChange={(event) =>
              setFilters((previous) => ({ ...previous, ujb: event.target.value }))
            }
          />
          <Button
            variant={filters.presentOnly ? 'primary' : 'outline'}
            onClick={() =>
              setFilters((previous) => ({
                ...previous,
                presentOnly: !previous.presentOnly,
              }))
            }
          >
            Present Only
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-4">
        <div className="flex items-center gap-3 py-3">
          <Text as="h2">Registered Users</Text>
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
            {filteredUsers.length}
          </span>
        </div>

        <div className="max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader
              columns={[
                { key: 'index', label: '#' },
                { key: 'number', label: 'Number' },
                { key: 'name', label: 'Name' },
                { key: 'category', label: 'Category' },
                { key: 'actions', label: 'Actions' },
                { key: 'attendance', label: 'Attendance' },
              ]}
            />

            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, index) => <SkeletonRow key={index} />)
                : paginatedUsers.map((user, index) => (
                    <TableRow key={user.id}>
                      <td className="px-4 py-3">
                        {(currentPage - 1) * usersPerPage + index + 1}
                      </td>
                      <td className="px-4 py-3">{user.id}</td>
                      <td className="px-4 py-3">{user.name}</td>
                      <td className="px-4 py-3">{user.category}</td>

                      <td className="px-4 py-3">
                        <div className="flex min-w-[180px] gap-2">
                          <ActionButton icon={Phone} onClick={() => window.open(`tel:${user.id}`)} />
                          <ActionButton
                            icon={MessageCircle}
                            onClick={() => window.open(`https://wa.me/91${user.id}`)}
                          />

                          <div className="relative inline-block">
                            <ActionButton
                              icon={Eye}
                              label="View Feedback"
                              onClick={() => openViewModal(user.feedback, user.name)}
                            />

                            {user.feedback?.length > 0 && (
                              <span className="absolute -right-2 -top-2 rounded-full bg-green-600 px-1.5 py-0.5 text-[10px] text-white">
                                {user.feedback.length}
                              </span>
                            )}
                          </div>

                          <ActionButton
                            icon={Plus}
                            label="Add Feedback"
                            onClick={() => openAddFeedbackModal(user.id, user.name)}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {user.attendanceStatus ? (
                          <Button variant="outline" disabled>
                            Marked
                          </Button>
                        ) : (
                          <Button variant="primary" onClick={() => markAttendance(user.id)}>
                            Mark Present
                          </Button>
                        )}
                      </td>
                    </TableRow>
                  ))}
            </tbody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => page - 1)}
          >
            Previous
          </Button>

          <Text>
            Page {totalPages ? currentPage : 0} of {totalPages}
          </Text>

          <Button
            variant="outline"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((page) => page + 1)}
          >
            Next
          </Button>
        </div>
      </Card>

      <Modal
        open={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title={`Add Feedback for ${selectedUserName}`}
      >
        <div className="space-y-4">
          <FormField label="Predefined Feedback">
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              value={predefinedFeedback}
              onChange={(event) => setPredefinedFeedback(event.target.value)}
            >
              <option value="">Select</option>
              {predefinedFeedbacks.map((feedback, index) => (
                <option key={index} value={feedback}>
                  {feedback}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Custom Feedback">
            <Textarea
              value={customFeedback}
              onChange={(event) => setCustomFeedback(event.target.value)}
            />
          </FormField>

          <div className="flex justify-end">
            <Button variant="primary" onClick={submitFeedback}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`Feedback for ${selectedUserName}`}
        size="xl"
      >
        {(selectedFeedbacks || []).length ? (
          <Table>
            <TableHeader
              columns={[
                { key: 'index', label: '#' },
                { key: 'predefined', label: 'Predefined' },
                { key: 'custom', label: 'Custom' },
                { key: 'time', label: 'Time' },
              ]}
            />

            <tbody>
              {selectedFeedbacks.map((feedback, index) => (
                <TableRow key={index}>
                  <td>{index + 1}</td>
                  <td>{feedback.predefined}</td>
                  <td>{feedback.custom}</td>
                  <td>{feedback.timestamp}</td>
                </TableRow>
              ))}
            </tbody>
          </Table>
        ) : (
          <Text muted>No feedback available.</Text>
        )}
      </Modal>
    </div>
  );
}
