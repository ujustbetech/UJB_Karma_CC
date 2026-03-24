"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/utility_collection";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";

export default function EditProspect({ id, data }) {

  const toast = useToast();

  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userList, setUserList] = useState([]);

  /* DEFAULT DOB (ONLY DATE) */
  const getTodayDate = () => {
    const now = new Date();
    return (
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0")
    );
  };

  const [form, setForm] = useState({
    orbiterName: data?.orbiterName || "",
    orbiterContact: data?.orbiterContact || "",
    orbiterEmail: data?.orbiterEmail || "",
    type: data?.type || "",
    prospectName: data?.prospectName || "",
    prospectPhone: data?.prospectPhone || "",
    occupation: data?.occupation || "",
    hobbies: data?.hobbies || "",
    email: data?.email || "",
    dob: data?.dob || getTodayDate(), // ✅ DOB only
  });

  /* FETCH USERS */

  useEffect(() => {
    const fetchUsers = async () => {

      const snapshot = await getDocs(collection(db, COLLECTIONS.userDetail));

      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data()["Name"],
        phone: doc.data()["MobileNo"],
        email: doc.data()["Email"],
      }));

      setUserList(list);
    };

    fetchUsers();
  }, []);

  /* SEARCH USER */

  const handleSearchUser = (value) => {

    setUserSearch(value);

    const filtered = userList.filter(
      (user) => user.name?.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user) => {

    setForm({
      ...form,
      orbiterName: user.name,
      orbiterContact: user.phone,
      orbiterEmail: user.email,
    });

    setUserSearch("");
    setFilteredUsers([]);
  };

  /* SUBMIT */

  const handleSubmit = async () => {

    if (
      !form.orbiterName ||
      !form.orbiterContact ||
      !form.orbiterEmail ||
      !form.type ||
      !form.prospectName ||
      !form.prospectPhone ||
      !form.occupation ||
      !form.hobbies ||
      !form.email ||
      !form.dob
    ) {
      toast.error("Please fill all fields");
      return;
    }

    try {

      const prospectRef = doc(db, COLLECTIONS.prospect, id);

      await updateDoc(prospectRef, {
        ...form,
        updatedAt: new Date(),
      });

      toast.success("Prospect updated successfully");

    } catch (error) {

      console.error(error);
      toast.error("Error updating prospect");

    }
  };

  return (
    <>
      <Text variant="h1">Edit Prospect</Text>

      <Card>

        <form className="space-y-6">

          <Text variant="h3">Orbiter Details</Text>

          <FormField label="Search Orbiter">
            <div className="relative">
              <Input
                placeholder="Search orbiter"
                value={userSearch}
                onChange={(e) => handleSearchUser(e.target.value)}
              />

              {filteredUsers.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-48 overflow-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                    >
                      {user.name} — {user.phone}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <FormField label="Orbiter Name">
              <Input value={form.orbiterName} disabled />
            </FormField>

            <FormField label="Orbiter Phone">
              <Input value={form.orbiterContact} disabled />
            </FormField>

            <FormField label="Orbiter Email">
              <Input value={form.orbiterEmail} disabled />
            </FormField>

          </div>

          <Text variant="h3">Prospect Information</Text>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <FormField label="Prospect Name" required>
              <Input
                value={form.prospectName}
                onChange={(e) =>
                  setForm({ ...form, prospectName: e.target.value })
                }
              />
            </FormField>

            <FormField label="Prospect Phone" required>
              <Input
                value={form.prospectPhone}
                onChange={(e) =>
                  setForm({ ...form, prospectPhone: e.target.value })
                }
              />
            </FormField>

            <FormField label="Email" required>
              <Input
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </FormField>

            {/* ✅ DOB FIELD */}
            <FormField label="DOB" required>
              <Input
                type="date"
                value={form.dob}
                onChange={(e) =>
                  setForm({ ...form, dob: e.target.value })
                }
              />
            </FormField>

            <FormField label="Occupation">
              <Input
                value={form.occupation}
                onChange={(e) =>
                  setForm({ ...form, occupation: e.target.value })
                }
              />
            </FormField>

            <FormField label="Hobbies">
              <Input
                value={form.hobbies}
                onChange={(e) =>
                  setForm({ ...form, hobbies: e.target.value })
                }
              />
            </FormField>

          </div>

          <FormField label="Occasion for Intimation">

            <Select
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
              options={[
                { label: "Support Team Call", value: "support_call" },
                { label: "Orbiter Connect", value: "orbiter_connection" },
                { label: "Doorstep Service", value: "doorstep_service" },
                { label: "Monthly Meeting", value: "monthly_meeting" },
                { label: "E2A Interaction", value: "e2a_interactions" },
                { label: "Unniversary Interaction", value: "unniversary_interactions" },
                { label: "Support", value: "support" },
                { label: "NT", value: "nt" },
                { label: "Management", value: "management" },
              ]}
            />

          </FormField>

          <div className="flex justify-end pt-4">

            <Button onClick={handleSubmit}>
              Update Prospect
            </Button>

          </div>

        </form>

      </Card>
    </>
  );
}