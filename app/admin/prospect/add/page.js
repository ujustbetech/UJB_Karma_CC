"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import FormField from "@/components/ui/FormField";

import Swal from "sweetalert2";

export default function Register() {

  const [userType, setUserType] = useState("prospect");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orbiteremail, setOrbiterEmail] = useState("");

  const [prospectName, setProspectName] = useState("");
  const [prospectPhone, setProspectPhone] = useState("");

  const [occupation, setOccupation] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");

  const [type, setType] = useState("");

  const [userList, setUserList] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedOrbiter, setSelectedOrbiter] = useState(null);

  /* ---------------------------------- */
  /* FETCH USERS */
  /* ---------------------------------- */

  useEffect(() => {

    const fetchUsers = async () => {

      const snap = await getDocs(collection(db, "usersdetail"));

      const list = snap.docs.map((d) => ({
        ujbCode: d.id,
        name: d.data().Name || "",
        phone: d.data().MobileNo || "",
        email: d.data().Email || "",
      }));

      setUserList(list);
    };

    fetchUsers();

  }, []);

  /* ---------------------------------- */
  /* SEARCH ORBITER */
  /* ---------------------------------- */

  const handleSearchUser = (e) => {

    const value = e.target.value.toLowerCase();

    setUserSearch(value);

    const filtered = userList.filter((u) =>
      u.name.toLowerCase().includes(value)
    );

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user) => {

    setSelectedOrbiter(user);

    setName(user.name);
    setPhone(user.phone);
    setOrbiterEmail(user.email);

    setUserSearch("");
    setFilteredUsers([]);
  };

  /* ---------------------------------- */
  /* SUBMIT */
  /* ---------------------------------- */

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!prospectName || !prospectPhone || !email || !occupation || !date || !type) {

      Swal.fire({
        icon: "error",
        title: "Missing fields",
        text: "Please fill all required fields",
      });

      return;
    }

    try {

      const data = {

        userType,

        prospectName,
        prospectPhone,
        occupation,
        hobbies,
        email,

        orbiterName: name,
        orbiterContact: phone,
        orbiterEmail: orbiteremail,

        type,
        date: new Date(date),

        registeredAt: new Date(),

      };

      await addDoc(collection(db, "Prospects"), data);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Prospect Registered Successfully",
      });

      // Reset form
      setProspectName("");
      setProspectPhone("");
      setEmail("");
      setOccupation("");
      setHobbies("");
      setDate("");
      setType("");

      setName("");
      setPhone("");
      setOrbiterEmail("");
      setSelectedOrbiter(null);

    } catch (err) {

      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong",
      });

    }
  };

  /* ---------------------------------- */
  /* UI */
  /* ---------------------------------- */

  return (

    <>
      <Text variant="h1">Add New Prospect</Text>

      <Card>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* USER TYPE */}

          <FormField label="User Type">

            <Select
              value={userType}
              onChange={(v) => setUserType(v)}
              options={[
                { label: "Prospect", value: "prospect" },
                { label: "Orbiter", value: "orbiter" },
              ]}
            />

          </FormField>

          {/* SELECT MENTOR */}

          <Text variant="h3">Mentor Orbiter</Text>

          <FormField label="Search Orbiter">

            <div className="relative">

              <Input
                placeholder="Search Orbiter"
                value={userSearch}
                onChange={handleSearchUser}
              />

              {filteredUsers.length > 0 && (

                <div className="absolute z-10 bg-white border rounded w-full max-h-48 overflow-auto">

                  {filteredUsers.map((u) => (

                    <div
                      key={u.ujbCode}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                      onClick={() => handleSelectUser(u)}
                    >
                      {u.name} — {u.phone}
                    </div>

                  ))}

                </div>

              )}

            </div>

          </FormField>

          {/* ORBITER INFO */}

          {selectedOrbiter && (

            <div className="grid md:grid-cols-3 gap-4">

              <FormField label="Orbiter Name">
                <Input value={name} disabled />
              </FormField>

              <FormField label="Orbiter Phone">
                <Input value={phone} disabled />
              </FormField>

              <FormField label="Orbiter Email">
                <Input value={orbiteremail} disabled />
              </FormField>

            </div>

          )}

          {/* PROSPECT DETAILS */}

          <Text variant="h3">Prospect Details</Text>

          <div className="grid md:grid-cols-2 gap-4">

            <FormField label="Prospect Name" required>
              <Input
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
              />
            </FormField>

            <FormField label="Prospect Phone" required>
              <Input
                value={prospectPhone}
                onChange={(e) => setProspectPhone(e.target.value)}
              />
            </FormField>

            <FormField label="Email">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>

            <FormField label="Date">
           <DateInput
  value={date}
  onChange={(e) => setDate(e.target.value)}
/>
            </FormField>

            <FormField label="Occupation">

              <Select
                value={occupation}
                onChange={(v) => setOccupation(v)}
                options={[
                  { label: "Service", value: "Service" },
                  { label: "Student", value: "Student" },
                  { label: "Business", value: "Business" },
                  { label: "Professional", value: "Professional" },
                  { label: "Housewife", value: "Housewife" },
                  { label: "Retired", value: "Retired" },
                ]}
              />

            </FormField>

            <FormField label="Hobbies">

              <Input
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
              />

            </FormField>

          </div>

          {/* OCCASION */}

          <FormField label="Occasion">

            <Select
              value={type}
              onChange={(v) => setType(v)}
              options={[
                { label: "Support Call", value: "support_call" },
                { label: "Orbiter Connection", value: "orbiter_connection" },
                { label: "Monthly Meeting", value: "monthly_meeting" },
                { label: "E2A Interaction", value: "e2a_interactions" },
              ]}
            />

          </FormField>

          {/* BUTTON */}

          <div className="flex justify-end pt-4">

            <Button type="submit">

              Register Prospect

            </Button>

          </div>

        </form>

      </Card>
    </>
  );
}