"use client";
import { useEffect, useRef, useState } from "react";
import { db } from "@/firebaseConfig";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/utility_collection";
import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import FormField from "@/components/ui/FormField";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";

export default function AddOrbiterPage() {
  const toast = useToast();
  const firstErrorRef = useRef(null);

  const [mentors, setMentors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    phoneNumber: "",
    role: "",
    dob: "",
    email: "",
    gender: "",
    ujbCode: "",
    mentor: "",
    mentorName: "",
    mentorPhone: "",
    mentorUjbCode: "",
  });

  const [errors, setErrors] = useState({});

  const formatDOB = (dob) => {
    if (!dob) return "";
    const [year, month, day] = dob.split("-");
    return `${day}/${month}/${year}`;
  };

  const generateNextUJBCode = async () => {
    const snapshot = await getDocs(collection(db, COLLECTIONS.userDetail));
    let maxNumber = 0;
    snapshot.forEach((d) => {
      const data = d.data();
      const code = data.UJBCode || data.ujbCode || d.id;
      const match = code?.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });
    const nextNumber = maxNumber + 1;
    return `UJB${String(nextNumber).padStart(4, "0")}`;
  };

  const fetchMentors = async () => {
    const snap = await getDocs(collection(db, COLLECTIONS.userDetail));
    const list = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data["Name"] || "",
        phone: data["MobileNo"] || "",
        ujbCode: data["ujbCode"] || data["UJBCode"] || "",
      };
    });
    setMentors(list);
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  useEffect(() => {
    (async () => {
      const next = await generateNextUJBCode();
      setNewUser((p) => ({ ...p, ujbCode: next }));
    })();
  }, []);

  const validate = () => {
    const e = {};
    if (!newUser.name.trim()) e.name = "Name required";
    if (!/^[6-9]\d{9}$/.test(newUser.phoneNumber))
      e.phoneNumber = "Valid 10-digit mobile required";
    if (!newUser.role) e.role = "Select category";
    if (!newUser.dob) e.dob = "Select DOB";
    if (
      newUser.email &&
      !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(newUser.email)
    )
      e.email = "Invalid email";
    if (!newUser.gender) e.gender = "Select gender";
    if (!newUser.mentor.trim()) e.mentor = "Mentor required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openConfirm = (e) => {
    e.preventDefault();
    if (!validate()) {
      firstErrorRef.current?.focus();
      return;
    }
    setConfirmOpen(true);
  };

  const handleSave = async () => {
    const mentor = mentors.find(
      (m) =>
        m.name.toLowerCase() === newUser.mentor.toLowerCase() ||
        m.phone === newUser.mentor
    );

    if (!mentor) {
      toast.error("Mentor not found");
      return;
    }

    setSubmitting(true);
    const finalCode = await generateNextUJBCode();

    const payload = {
      Name: newUser.name,
      MobileNo: newUser.phoneNumber,
      Category: newUser.role,
      DOB: formatDOB(newUser.dob),
      Email: newUser.email,
      Gender: newUser.gender,
      UJBCode: finalCode,
      MentorName: mentor.name,
      MentorPhone: mentor.phone,
      MentorUJBCode: mentor.ujbCode,
      ProfileStatus: "incomplete",
    };

    try {
      await setDoc(doc(db, COLLECTIONS.userDetail, finalCode), payload);
      toast.success(`User created (${finalCode})`);
      window.location.href = "/admin/orbiters";
    } catch {
      toast.error("Failed to create user");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const mentorSuggestions = mentors
    .filter(
      (m) =>
        m.name.toLowerCase().includes(newUser.mentor.toLowerCase()) ||
        m.phone.includes(newUser.mentor)
    )
    .slice(0, 6);

  return (
    <>
      <Text variant="h1">Add Orbiter</Text>

      <Card>
        <form onSubmit={openConfirm} className="space-y-6">

          <Text variant="h3">Basic Information</Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Name" error={errors.name} required>
              <Input
                ref={!newUser.name ? firstErrorRef : null}
                value={newUser.name}
                onChange={(e) => {
                  setErrors((p) => ({ ...p, name: "" }));
                  setNewUser({ ...newUser, name: e.target.value });
                }}
              />
            </FormField>

            <FormField label="Mobile" error={errors.phoneNumber} required>
              <Input
                value={newUser.phoneNumber}
                onChange={(e) => {
                  setErrors((p) => ({ ...p, phoneNumber: "" }));
                  setNewUser({ ...newUser, phoneNumber: e.target.value });
                }}
              />
            </FormField>

            <FormField label="Gender" error={errors.gender} required>
              <Select
                value={newUser.gender}
                onChange={(v) => {
                  setErrors((p) => ({ ...p, gender: "" }));
                  setNewUser({ ...newUser, gender: v });
                }}
                options={[
                  { label: "Male", value: "Male" },
                  { label: "Female", value: "Female" },
                ]}
              />
            </FormField>

            <FormField label="DOB" error={errors.dob} required>
              <DateInput
                value={newUser.dob}
                onChange={(v) => {
                  setErrors((p) => ({ ...p, dob: "" }));
                  setNewUser({ ...newUser, dob: v });
                }}
              />
            </FormField>
          </div>

          <Text variant="h3">Business Details</Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Category" error={errors.role} required>
              <Select
                value={newUser.role}
                onChange={(v) => {
                  setErrors((p) => ({ ...p, role: "" }));
                  setNewUser({ ...newUser, role: v });
                }}
                options={[
                  { label: "Orbiter", value: "Orbiter" },
                  { label: "CosmOrbiter", value: "CosmOrbiter" },
                ]}
              />
            </FormField>

            <FormField label="Email" error={errors.email}>
              <Input
                value={newUser.email}
                onChange={(e) => {
                  setErrors((p) => ({ ...p, email: "" }));
                  setNewUser({ ...newUser, email: e.target.value });
                }}
              />
            </FormField>
          </div>

          <FormField label="Assign Mentor" error={errors.mentor} required>
            <div className="relative">
              <Input
                placeholder="Type mentor name or mobile"
                value={newUser.mentor}
                onChange={(e) => {
                  setErrors((p) => ({ ...p, mentor: "" }));
                  setNewUser({ ...newUser, mentor: e.target.value });
                }}
              />
              {newUser.mentor && mentorSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-48 overflow-auto">
                  {mentorSuggestions.map((m) => (
                    <div
                      key={m.id}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                      onClick={() =>
                        setNewUser({
                          ...newUser,
                          mentor: m.name,
                          mentorName: m.name,
                          mentorPhone: m.phone,
                          mentorUjbCode: m.ujbCode,
                        })
                      }
                    >
                      {m.name} — {m.phone}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          <Text variant="h3">System Details</Text>
          <FormField label="UJB Code">
            <Input value={newUser.ujbCode} disabled />
          </FormField>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => (window.location.href = "/admin/orbiters")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              Save Orbiter
            </Button>
          </div>
        </form>
      </Card>

      <ConfirmModal
        open={confirmOpen}
        title="Create Orbiter"
        description="Are you sure you want to create this orbiter?"
        onConfirm={handleSave}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
