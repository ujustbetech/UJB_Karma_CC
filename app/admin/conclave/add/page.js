'use client';

import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  getDocs,
  getDoc,
  doc,
  Timestamp,
  setDoc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';

import { db } from '@/firebaseConfig';
import { COLLECTIONS } from "@/lib/utility_collection";
import ReactSelect from "react-select";

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Text from '@/components/ui/Text';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/ui/FormField';
import { useToast } from '@/components/ui/ToastProvider';

export default function CreateConclavePage() {

  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    conclaveStream: '',
    startDate: null,
    initiationDate: null,
    leader: '',
    ntMembers: [],
    orbiters: [],
    leaderRole: '',
    ntRoles: '',
  });

  const [tempNt, setTempNt] = useState('');
  const [tempOrbiter, setTempOrbiter] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.userDetail));
      const list = snap.docs.map((doc) => ({
        label: doc.data()['Name'],
        value: doc.id,
      }));
      setUsers(list);
    };
    fetchUsers();
  }, []);

  const CP_ACTIVITY_EVENT_HOST = {
    activityNo: "081",
    activityName: "Event Host (Online)",
    points: 50,
    categories: ["R"],
    purpose: "Acknowledges leadership in facilitating virtual sessions.",
  };

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const addToList = (field, value) => {
    if (!value) return;
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field]
        : [...prev[field], value]
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.conclaveStream.trim()) e.conclaveStream = 'Required';
    if (!form.startDate) e.startDate = 'Required';
    if (!form.initiationDate) e.initiationDate = 'Required';
    if (!form.leader) e.leader = 'Required';
    if (!form.ntMembers.length) e.ntMembers = 'Add at least one';
    if (form.orbiters.length < 10) e.orbiters = 'Minimum 10 required';
    if (!form.leaderRole.trim()) e.leaderRole = 'Required';
    if (!form.ntRoles.trim()) e.ntRoles = 'Required';
    return e;
  };

  const ensureCpBoardUser = async (user) => {
    if (!user?.ujbCode) return;

    const ref = doc(db, "CPBoard", user.ujbCode);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        id: user.ujbCode,
        name: user.name,
        phoneNumber: user.phone,
        role: "Leader",
        totals: { R: 0, H: 0, W: 0 },
        createdAt: Timestamp.now(),
      });
    }
  };

  const updateCategoryTotals = async (ujbCode, categories, points) => {
    const ref = doc(db, "CPBoard", ujbCode);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const totals = snap.data().totals || { R: 0, H: 0, W: 0 };
    const split = Math.floor(points / categories.length);

    const updated = { ...totals };
    categories.forEach(c => {
      updated[c] = (updated[c] || 0) + split;
    });

    await updateDoc(ref, { totals: updated });
  };

const addCpForConclaveLeader = async (leaderUjbCode, conclaveId) => {

  const userRef = doc(db, COLLECTIONS.userDetail, leaderUjbCode);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const d = userSnap.data();

  const leader = {
    ujbCode: leaderUjbCode,
    name: d.Name,
    phone: d.MobileNo,
  };

  await ensureCpBoardUser(leader);

  const q = query(
    collection(db, "CPBoard", leaderUjbCode, "activities"),
    where("activityNo", "==", CP_ACTIVITY_EVENT_HOST.activityNo),
    where("sourceConclaveId", "==", conclaveId)
  );

  const snap = await getDocs(q);
  if (!snap.empty) return;

  await addDoc(
    collection(db, "CPBoard", leaderUjbCode, "activities"),
    {
      activityNo: CP_ACTIVITY_EVENT_HOST.activityNo,
      activityName: CP_ACTIVITY_EVENT_HOST.activityName,
      points: CP_ACTIVITY_EVENT_HOST.points,
      categories: CP_ACTIVITY_EVENT_HOST.categories,
      purpose: CP_ACTIVITY_EVENT_HOST.purpose,
      source: "Conclave",
      sourceConclaveId: conclaveId,
      month: new Date().toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
      addedAt: Timestamp.now(),
    }
  );

  await updateCategoryTotals(
    leaderUjbCode,
    CP_ACTIVITY_EVENT_HOST.categories,
    CP_ACTIVITY_EVENT_HOST.points
  );
};

  const convertDatetimeLocalToTimestamp = (value) => {
    if (!value) return null;

    const [datePart, timePart] = value.split("T");
    const [year, month, day] = datePart.split("-").map(Number);

    let hours = 0;
    let minutes = 0;

    if (timePart) {
      [hours, minutes] = timePart.split(":").map(Number);
    }

    const localDate = new Date(year, month - 1, day, hours, minutes);
    if (isNaN(localDate.getTime())) return null;

    return Timestamp.fromDate(localDate);
  };

const handleSubmit = async (e) => {

  e.preventDefault();
  setLoading(true);

  try {

    const startTS = convertDatetimeLocalToTimestamp(form.startDate);
    const initTS = convertDatetimeLocalToTimestamp(form.initiationDate);

    if (!startTS || !initTS) {
      toast.error("Please select valid Date & Time");
      setLoading(false);
      return;
    }

    let finalForm = {
      ...form,
      startDate: startTS,
      initiationDate: initTS,
    };

    const convertToPhones = async (ids) => {
      const phones = [];
      for (const id of ids) {
        const ref = doc(db, COLLECTIONS.userDetail, id);
        const snap = await getDoc(ref);
        if (snap.exists()) phones.push(snap.data().MobileNo);
      }
      return phones;
    };

    // Leader → Phone
    if (form.leader) {
      const ref = doc(db, COLLECTIONS.userDetail, form.leader);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        finalForm.leader = snap.data().MobileNo;
      }
    }

    finalForm.ntMembers = await convertToPhones(form.ntMembers);
    finalForm.orbiters = await convertToPhones(form.orbiters);

    // ✅ CREATE CONCLAVE FIRST
    const conclaveRef = await addDoc(
      collection(db, COLLECTIONS.conclaves),
      {
        ...finalForm,
        createdAt: Timestamp.now(),
      }
    );

    // ✅ ADD CP USING UJB CODE
    if (form.leader) {
      await addCpForConclaveLeader(form.leader, conclaveRef.id);
    }

    toast.success("Conclave created successfully");

  } catch (err) {
    console.log(err);
    toast.error("Failed to create conclave");
  }

  setLoading(false);
};

  return (
    <Card>

      <form onSubmit={handleSubmit} className="space-y-6 pt-6">

        <FormField label="Conclave Name & Stream" required error={errors.conclaveStream}>
          <Input
            value={form.conclaveStream}
            onChange={(e) => handleChange('conclaveStream', e.target.value)}
          />
        </FormField>

        {/* START DATE */}
        <div>
          <label className="block mb-1 text-sm font-medium">Start Date *</label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2"
            value={form.startDate || ""}
            onChange={(e) => handleChange("startDate", e.target.value)}
          />
        </div>

        {/* INITIATION DATE */}
        <div>
          <label className="block mb-1 text-sm font-medium">Initiation Date *</label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2"
            value={form.initiationDate || ""}
            onChange={(e) => handleChange("initiationDate", e.target.value)}
          />
        </div>

        <FormField label="Leader" required error={errors.leader}>
          <ReactSelect
            options={users}
            value={users.find(u => u.value === form.leader) || null}
            onChange={(selected) => handleChange("leader", selected?.value)}
            isSearchable
          />
        </FormField>

        <FormField label="NT Members" required error={errors.ntMembers}>
          <>
            <ReactSelect
              options={users}
              value={users.find(u => u.value === tempNt) || null}
              onChange={(selected) => setTempNt(selected?.value)}
              isSearchable
            />
            <Button type="button" onClick={() => {
              addToList('ntMembers', tempNt);
              setTempNt('');
            }}>
              Add NT Member
            </Button>
          </>
        </FormField>

        <FormField label="Orbiters" required error={errors.orbiters}>
          <>
            <ReactSelect
              options={users}
              value={users.find(u => u.value === tempOrbiter) || null}
              onChange={(selected) => setTempOrbiter(selected?.value)}
              isSearchable
            />
            <Button type="button" onClick={() => {
              addToList('orbiters', tempOrbiter);
              setTempOrbiter('');
            }}>
              Add Orbiter
            </Button>
          </>
        </FormField>

        <FormField label="Leader’s Role & Responsibility" required error={errors.leaderRole}>
          <Textarea
            value={form.leaderRole}
            onChange={(e) => handleChange('leaderRole', e.target.value)}
          />
        </FormField>

        <FormField label="NT Members’ Roles & Responsibilities" required error={errors.ntRoles}>
          <Textarea
            value={form.ntRoles}
            onChange={(e) => handleChange('ntRoles', e.target.value)}
          />
        </FormField>

        <div className="flex justify-end pt-6 border-t">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Conclave"}
          </Button>
        </div>

      </form>
    </Card>
  );
}