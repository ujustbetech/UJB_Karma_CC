"use client";

import { useEffect, useState } from "react";
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
  where,
} from "firebase/firestore";

import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";
import ReactSelect from "react-select";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";

export default function CreateConclavePage() {
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    conclaveStream: "",
    startDate: null,
    initiationDate: null,
    leader: "",
    ntMembers: [],
    orbiters: [],
    leaderRole: "",
    ntRoles: "",
  });

  const [tempNt, setTempNt] = useState("");
  const [tempOrbiter, setTempOrbiter] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.userDetail));
      const list = snap.docs.map((doc) => ({
        label: doc.data()["Name"],
        value: doc.id,
      }));
      setUsers(list);
    };
    fetchUsers();
  }, []);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const addToList = (field, value) => {
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field]
        : [...prev[field], value],
    }));
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

      if (form.leader) {
        const ref = doc(db, COLLECTIONS.userDetail, form.leader);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          finalForm.leader = snap.data().MobileNo;
        }
      }

      finalForm.ntMembers = await convertToPhones(form.ntMembers);
      finalForm.orbiters = await convertToPhones(form.orbiters);

      await addDoc(collection(db, COLLECTIONS.conclaves), {
        ...finalForm,
        createdAt: Timestamp.now(),
      });

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
        <FormField label="Conclave Name & Stream" required>
          <Input
            value={form.conclaveStream}
            onChange={(e) =>
              handleChange("conclaveStream", e.target.value)
            }
          />
        </FormField>

        <div>
          <label className="block mb-1 text-sm font-medium">
            Start Date *
          </label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2"
            value={form.startDate || ""}
            onChange={(e) =>
              handleChange("startDate", e.target.value)
            }
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">
            Initiation Date *
          </label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2"
            value={form.initiationDate || ""}
            onChange={(e) =>
              handleChange("initiationDate", e.target.value)
            }
          />
        </div>

        {/* Leader */}
        <FormField label="Leader" required>
          <ReactSelect
            options={users}
            value={users.find((u) => u.value === form.leader) || null}
            onChange={(selected) =>
              handleChange("leader", selected?.value)
            }
          />
        </FormField>

        {/* NT MEMBERS */}
        <FormField label="NT Members" required>
          <>
            <ReactSelect
              options={users}
              value={users.find((u) => u.value === tempNt) || null}
              onChange={(selected) =>
                setTempNt(selected?.value)
              }
            />

            <Button
              type="button"
              onClick={() => {
                addToList("ntMembers", tempNt);
                setTempNt("");
              }}
            >
              Add NT Member
            </Button>

            <div className="flex flex-wrap gap-2 mt-2">
              {form.ntMembers.map((id) => {
                const user = users.find((u) => u.value === id);
                return (
                  <div
                    key={id}
                    className="px-3 py-1 bg-blue-100 rounded-full text-sm flex items-center gap-2"
                  >
                    {user?.label}
                    <span
                      className="cursor-pointer text-red-500"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          ntMembers: prev.ntMembers.filter(
                            (m) => m !== id
                          ),
                        }))
                      }
                    >
                      ✕
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        </FormField>

        {/* ORBITERS */}
        <FormField label="Orbiters" required>
          <>
            <ReactSelect
              options={users}
              value={
                users.find((u) => u.value === tempOrbiter) || null
              }
              onChange={(selected) =>
                setTempOrbiter(selected?.value)
              }
            />

            <Button
              type="button"
              onClick={() => {
                addToList("orbiters", tempOrbiter);
                setTempOrbiter("");
              }}
            >
              Add Orbiter
            </Button>

            <div className="flex flex-wrap gap-2 mt-2">
              {form.orbiters.map((id) => {
                const user = users.find((u) => u.value === id);
                return (
                  <div
                    key={id}
                    className="px-3 py-1 bg-green-100 rounded-full text-sm flex items-center gap-2"
                  >
                    {user?.label}
                    <span
                      className="cursor-pointer text-red-500"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          orbiters: prev.orbiters.filter(
                            (m) => m !== id
                          ),
                        }))
                      }
                    >
                      ✕
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        </FormField>

        <FormField label="Leader Role" required>
          <Textarea
            value={form.leaderRole}
            onChange={(e) =>
              handleChange("leaderRole", e.target.value)
            }
          />
        </FormField>

        <FormField label="NT Roles" required>
          <Textarea
            value={form.ntRoles}
            onChange={(e) =>
              handleChange("ntRoles", e.target.value)
            }
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