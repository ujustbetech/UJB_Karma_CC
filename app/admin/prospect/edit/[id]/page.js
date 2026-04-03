"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/firebaseClient";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import FormField from "@/components/ui/FormField";

import Swal from "sweetalert2";
import emailjs from "@emailjs/browser";
import { sendWhatsAppTemplateRequest } from "@/utils/whatsappClient";

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
  const [date, setDate] = useState(""); // DOB only

  const [submitting, setSubmitting] = useState(false);
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
  /* DEFAULT DOB (ONLY DATE, NO TIME) */
  /* ---------------------------------- */

  useEffect(() => {
    const now = new Date();

    const formatted =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    setDate(formatted); // ✅ only date
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
  /* EMAIL FUNCTION */
  /* ---------------------------------- */

  const sendAssessmentEmail = async (
    orbiterName,
    orbiterEmail,
    prospectName,
    formLink
  ) => {

    const body = `
Dear ${orbiterName},

Please fill the Prospect Assessment Form for ${prospectName}.

Assessment Form:
${formLink}

Regards,
UJustBe Team
`;

    const templateParams = {
      prospect_name: prospectName,
      to_email: orbiterEmail,
      body,
      orbiter_name: orbiterName,
    };

    try {
      await emailjs.send(
        "service_acyimrs",
        "template_cdm3n5x",
        templateParams,
        "w7YI9DEqR9sdiWX9h"
      );
    } catch (error) {
      console.error("Email error:", error);
    }
  };

  /* ---------------------------------- */
  /* WHATSAPP MESSAGE */
  /* ---------------------------------- */

  const sendAssesmentMessage = async (
    orbiterName,
    prospectName,
    phone,
    formLink
  ) => {
    try {
      await sendWhatsAppTemplateRequest({
        phone,
        templateName: "mentorbiter_assesment_form",
        parameters: [orbiterName, prospectName, formLink],
      });
    } catch (error) {
      console.error("WhatsApp error:", error);
    }
  };

  /* ---------------------------------- */
  /* SUBMIT */
  /* ---------------------------------- */

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);

    try {

      if (!selectedOrbiter) {
        Swal.fire("Error", "Please select an Orbiter", "error");
        setSubmitting(false);
        return;
      }

      if (
        !prospectName ||
        !prospectPhone ||
        !email ||
        !occupation ||
        !hobbies ||
        !date ||
        !type
      ) {
        Swal.fire("Error", "All fields are required", "error");
        setSubmitting(false);
        return;
      }

      const data = {
        userType,
        prospectName,
        prospectPhone,
        occupation,
        hobbies,
        email,
        dob: date, // ✅ DOB stored (no time)
        orbiterName: name,
        orbiterContact: phone,
        orbiterEmail: orbiteremail,
        type,
        registeredAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "Prospects"), data);

      const docId = docRef.id;

      const baseUrl = window.location.origin;
      const formLink = `${baseUrl}/user/prospects/${docId}`;

      await sendAssessmentEmail(name, orbiteremail, prospectName, formLink);
      await sendAssesmentMessage(name, prospectName, phone, formLink);

      Swal.fire("Success", "Prospect Registered Successfully", "success");

      /* RESET */

      setProspectName("");
      setProspectPhone("");
      setEmail("");
      setOccupation("");
      setHobbies("");
      setType("");

      const now = new Date();
      const formatted =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0");

      setDate(formatted);

      setName("");
      setPhone("");
      setOrbiterEmail("");
      setSelectedOrbiter(null);

    } catch (err) {
      console.error(err);

      Swal.fire("Error", "Something went wrong", "error");

    } finally {
      setSubmitting(false);
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

          <Text variant="h3">Mentor Orbiter</Text>

          <FormField label="Search Orbiter" required>
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

            <FormField label="Email" required>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>

            <FormField label="DOB" required>
           <Input
  type="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
/>
            </FormField>

            <FormField label="Occupation" required>
              <Select
                value={occupation}
                onChange={(v) => setOccupation(v)}
                options={[
                  { label: "Select an option", value: "" },
                  { label: "Service", value: "Service" },
                  { label: "Student", value: "Student" },
                  { label: "Business", value: "Business" },
                  { label: "Professional", value: "Professional" },
                  { label: "Housewife", value: "Housewife" },
                  { label: "Retired", value: "Retired" },
                ]}
              />
            </FormField>

            <FormField label="Hobbies" required>
              <Input
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
              />
            </FormField>

          </div>

          <FormField label="Occasion" required>
            <Select
              value={type}
              onChange={(v) => setType(v)}
              options={[
                { label: "Select an option", value: "" },
                { label: "Support Call", value: "support_call" },
                { label: "Orbiter Connection", value: "orbiter_connection" },
                { label: "Monthly Meeting", value: "monthly_meeting" },
                { label: "E2A Interaction", value: "e2a_interactions" },
              ]}
            />
          </FormField>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className={`${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {submitting ? "Registering..." : "Register Prospect"}
            </Button>
          </div>

        </form>

      </Card>
    </>
  );
}

