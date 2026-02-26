'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  getDocs,
  setDoc,
  getDoc
} from 'firebase/firestore';


import { db } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ActionButton from '@/components/ui/ActionButton';
import Modal from '@/components/ui/Modal';
import { FormField, Textarea, Select } from '@/components/ui/form';
import Table from '@/components/table/Table';
import TableHeader from '@/components/table/TableHeader';
import TableRow from '@/components/table/TableRow';
import { useToast } from '@/components/ui/ToastProvider';

import { Eye, Plus, Phone, MessageCircle, FileText, Users } from 'lucide-react';

export default function RegisteredUsersSection({ eventId }) {
  const toast = useToast();

  const [users, setUsers] = useState([]);

  const [filters, setFilters] = useState({
    number: '',
    name: '',
    category: '',
    ujb: '',
    presentOnly: false
  });

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedFeedbacks, setSelectedFeedbacks] = useState([]);
  const [currentUserId, setCurrentUserId] = useState('');

  const [predefinedFeedback, setPredefinedFeedback] = useState('');
  const [customFeedback, setCustomFeedback] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [loading, setLoading] = useState(true);



  const predefinedFeedbacks = [
    "Available",
    "Not Available",
    "Not Connected Yet",
    "Called but no response",
    "Tentative",
    "Other response",
  ];

  useEffect(() => {
    if (!eventId) return;

    const ref = collection(
      db,
      `${COLLECTIONS.monthlyMeeting}/${eventId}/registeredUsers`
    );

    const q = query(ref, orderBy('registeredAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Pull all user details once
      const userSnap = await getDocs(collection(db, COLLECTIONS.userDetail));

      const userMap = {};
      userSnap.forEach(doc => {
        const d = doc.data();
        userMap[d.MobileNo] = d;
      });

      const enriched = rawUsers.map(user => {
        const d = userMap[user.id] || {};
        return {
          ...user,
          name: d.Name || "Unknown",
          category: d.Category || "",
          ujbcode: d.UJBCode || "",
          feedback: user.feedback || []
        };
      });

      setUsers(enriched);
      setLoading(false);   // ← ADD THIS
    });

    return () => unsubscribe();
  }, [eventId]);


  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.id.includes(filters.number) &&
      (u.name || '').toLowerCase().includes(filters.name.toLowerCase()) &&
      (u.category || '').toLowerCase().includes(filters.category.toLowerCase()) &&
      (u.ujbcode || '').toLowerCase().includes(filters.ujb.toLowerCase()) &&
      (!filters.presentOnly || u.attendanceStatus)
    );
  }, [users, filters]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const stats = useMemo(() => {
    const total = users.length;
    const present = users.filter(u => u.attendanceStatus).length;
    const pending = total - present;
    const percent = total ? Math.round((present / total) * 100) : 0;

    return { total, present, pending, percent };
  }, [users]);

  const markAttendance = async (phone) => {
    await updateDoc(
      doc(db, `${COLLECTIONS.monthlyMeeting}/${eventId}/registeredUsers`, phone),
      {
        attendanceStatus: true,
        timestamp: serverTimestamp()
      }
    );

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
      toast.error("User not selected");
      return;
    }

    if (!predefinedFeedback && !customFeedback) {
      toast.error("Enter feedback");
      return;
    }

    const ref = doc(
      db,
      `${COLLECTIONS.monthlyMeeting}/${eventId}/registeredUsers`,
      currentUserId
    );

    // Check if doc exists
    const snap = await getDoc(ref);

    let existingFeedback = [];

    if (snap.exists()) {
      existingFeedback = snap.data().feedback || [];
    }

    const newEntry = {
      predefined: predefinedFeedback || "None",
      custom: customFeedback || "None",
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

    toast.success("Feedback saved");

    setFeedbackModalOpen(false);
    setPredefinedFeedback('');
    setCustomFeedback('');
  };


  const SkeletonRow = () => (
    <TableRow>
      <td><div className="h-4 w-6 bg-slate-200 rounded animate-pulse" /></td>
      <td><div className="h-4 w-24 bg-slate-200 rounded animate-pulse" /></td>
      <td><div className="h-4 w-32 bg-slate-200 rounded animate-pulse" /></td>
      <td><div className="h-4 w-20 bg-slate-200 rounded animate-pulse" /></td>
      <td><div className="h-8 w-32 bg-slate-200 rounded animate-pulse" /></td>
      <td><div className="h-8 w-24 bg-slate-200 rounded animate-pulse" /></td>
    </TableRow>
  );



  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-5 h-5 text-blue-600" />
        <Text as="h2">Register Orbiters</Text>
        {/* <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
            {documentUploads.length}
          </span> */}
      </div>

      {/* STATS */}
      <Card>


        <div className="grid grid-cols-4 gap-4 text-center">
          <div><Text>Total</Text><h2>{stats.total}</h2></div>
          <div><Text>Present</Text><h2>{stats.present}</h2></div>
          <div><Text>Pending</Text><h2>{stats.pending}</h2></div>
          <div><Text>Attendance</Text><h2>{stats.percent}%</h2></div>
        </div>

        <div className="w-full bg-gray-200 h-2 mt-4 rounded">
          <div
            className="bg-green-500 h-2 rounded"
            style={{ width: `${stats.percent}%` }}
          />
        </div>
      </Card>

      {/* FILTERS */}
      <Card>
        <div className="grid grid-cols-5 gap-4">
          <Input placeholder="Number"
            onChange={e => setFilters(f => ({ ...f, number: e.target.value }))} />
          <Input placeholder="Name"
            onChange={e => setFilters(f => ({ ...f, name: e.target.value }))} />
          <Input placeholder="Category"
            onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} />
          <Input placeholder="UJB"
            onChange={e => setFilters(f => ({ ...f, ujb: e.target.value }))} />
          <Button
            variant={filters.presentOnly ? "primary" : "outline"}
            onClick={() => setFilters(f => ({ ...f, presentOnly: !f.presentOnly }))}
          >
            Present Only
          </Button>
        </div>
      </Card>

      {/* TABLE */}
      <Card>
        <div className="flex items-center gap-3 py-3">
          <Text as="h2">Registered Users</Text>

          <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            {filteredUsers.length}
          </span>
        </div>

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
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : paginatedUsers.map((u, i) => (
                <TableRow key={u.id}>
                  <td className="py-3 px-4">{i + 1}</td>
                  <td className="py-3 px-4">{u.id}</td>
                  <td className="py-3 px-4">{u.name}</td>
                  <td className="py-3 px-4">{u.category}</td>

                  <td className="flex gap-2 py-3 px-4">
                    <ActionButton icon={Phone}
                      onClick={() => window.open(`tel:${u.id}`)} />

                    <ActionButton icon={MessageCircle}
                      onClick={() => window.open(`https://wa.me/91${u.id}`)} />

                    <div className="relative inline-block">
                      <ActionButton
                        icon={Eye}
                        label="View Feedback"
                        onClick={() => openViewModal(u.feedback, u.name)}
                      />

                      {(u.feedback?.length > 0) && (
                        <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-green-600 text-white rounded-full">
                          {u.feedback.length}
                        </span>
                      )}
                    </div>

                    <ActionButton
                      icon={Plus}
                      label="Add Feedback"
                      onClick={() => openAddFeedbackModal(u.id, u.name)}
                    />
                  </td>

                  <td className="py-3 px-4">
                    {u.attendanceStatus ? (
                      <Button variant="outline" disabled>Marked</Button>
                    ) : (
                      <Button variant="primary"
                        onClick={() => markAttendance(u.id)}>
                        Mark Present
                      </Button>
                    )}
                  </td>
                </TableRow>
              ))}
          </tbody>
        </Table>
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </Button>

          <Text>
            Page {currentPage} of {totalPages}
          </Text>

          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </Card>

      {/* Add Feedback Modal */}
      <Modal
        open={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title={`Add Feedback for ${selectedUserName}`}
      >
        <div className="space-y-4">
          <FormField label="Predefined Feedback">
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
              value={predefinedFeedback}
              onChange={(e) => setPredefinedFeedback(e.target.value)}
            >
              <option value="">Select</option>
              {predefinedFeedbacks.map((f, i) => (
                <option key={i} value={f}>{f}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Custom Feedback">
            <Textarea
              value={customFeedback}
              onChange={(e) => setCustomFeedback(e.target.value)}
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
              {selectedFeedbacks.map((fb, i) => (
                <TableRow key={i}>
                  <td>{i + 1}</td>
                  <td>{fb.predefined}</td>
                  <td>{fb.custom}</td>
                  <td>{fb.timestamp}</td>
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
