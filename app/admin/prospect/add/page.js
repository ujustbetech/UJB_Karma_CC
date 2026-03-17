"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";

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
import axios from "axios";

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

  const WHATSAPP_API_URL =
    "https://graph.facebook.com/v22.0/527476310441806/messages";

  const WHATSAPP_API_TOKEN =
    "Bearer EAAHwbR1fvgsBOwUInBvR1SGmVLSZCpDZAkn9aZCDJYaT0h5cwyiLyIq7BnKmXAgNs0ZCC8C33UzhGWTlwhUarfbcVoBdkc1bhuxZBXvroCHiXNwZCZBVxXlZBdinVoVnTB7IC1OYS4lhNEQprXm5l0XZAICVYISvkfwTEju6kV4Aqzt4lPpN8D3FD7eIWXDhnA4SG6QZDZD";

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
useEffect(() => {
  const now = new Date();

  const formatted =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0") +
    "T" +
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0");

  setDate(formatted);
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

    const payload = {
      messaging_product: "whatsapp",
      to: `91${phone}`,
      type: "template",
      template: {
        name: "mentorbiter_assesment_form",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: orbiterName },
              { type: "text", text: prospectName },
              { type: "text", text: formLink },
            ],
          },
        ],
      },
    };

    try {

      await axios.post(WHATSAPP_API_URL, payload, {
        headers: {
          Authorization: WHATSAPP_API_TOKEN,
          "Content-Type": "application/json",
        },
      });

    } catch (error) {

      console.error("WhatsApp error:", error);

    }
  };

  /* ---------------------------------- */
  /* CP SYSTEM */
  /* ---------------------------------- */

  const ensureCpBoardUser = async (orbiter) => {

    if (!orbiter?.ujbcode) return;

    const ref = doc(db, "CPBoard", orbiter.ujbcode);

    const snap = await getDoc(ref);

    if (!snap.exists()) {

      await setDoc(ref, {
        id: orbiter.ujbcode,
        name: orbiter.name,
        phoneNumber: orbiter.phone,
        role: "CosmOrbiter",
        totals: { R: 0, H: 0, W: 0 },
        createdAt: serverTimestamp(),
      });

    }
  };

  const updateCategoryTotals = async (orbiter, categories, points) => {

    const ref = doc(db, "CPBoard", orbiter.ujbcode);

    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();

    const totals = data.totals || { R: 0, H: 0, W: 0 };

    categories.forEach((cat) => {
      totals[cat] = (totals[cat] || 0) + points;
    });

    await updateDoc(ref, { totals });
  };

  const addCpForProspectIntroduction = async (
    orbiter,
    prospectName,
    prospectPhone
  ) => {

    await ensureCpBoardUser(orbiter);

    const q = query(
      collection(db, "CPBoard", orbiter.ujbcode, "activities"),
      where("activityNo", "==", "001"),
      where("prospectPhone", "==", prospectPhone)
    );

    const snap = await getDocs(q);

    if (!snap.empty) return;

    const categories = ["R"];
    const points = 50;

    await addDoc(
      collection(db, "CPBoard", orbiter.ujbcode, "activities"),
      {
        activityNo: "001",
        activityName: "Prospect Identification",
        points,
        categories,
        prospectName,
        prospectPhone,
        month: new Date().toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        addedAt: serverTimestamp(),
      }
    );

    await updateCategoryTotals(orbiter, categories, points);
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

      const docRef = await addDoc(collection(db, "Prospects"), data);

      const docId = docRef.id;

     const baseUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL;

const formLink = `${baseUrl}/user/prospects/${docId}`;

      await sendAssessmentEmail(
        name,
        orbiteremail,
        prospectName,
        formLink
      );

      await sendAssesmentMessage(
        name,
        prospectName,
        phone,
        formLink
      );

      if (selectedOrbiter?.ujbCode) {

        const orbiter = {
          ujbcode: selectedOrbiter.ujbCode,
          name: selectedOrbiter.name,
          phone: selectedOrbiter.phone,
        };

        await addCpForProspectIntroduction(
          orbiter,
          prospectName,
          prospectPhone
        );
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Prospect Registered Successfully",
      });

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

            <FormField label="Hobbies">

              <Input
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
              />

            </FormField>

          </div>

          <FormField label="Occasion">

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

            <Button type="submit">
              Register Prospect
            </Button>

          </div>

        </form>

      </Card>
    </>
  );
}