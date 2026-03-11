"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";

import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";

const interestOptions = [
  "Space for Personal Growth & Contribution",
  "Freedom to Express and Connect",
  "Business Promotion & Visibility",
  "Earning Through Referral",
  "Networking & Events",
];

const communicationOptions = ["Whatsapp", "Email", "Phone call"];

const ProspectFeedback = ({ id }) => {

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    mentorName: "",
    understandingLevel: "",
    selfGrowthUnderstanding: "",
    joinInterest: "",
    interestAreas: [],
    communicationOptions: [],
    additionalComments: "",
  });

/* ================= CP HELPERS ================= */

const ensureCpBoardUser = async (db, orbiter) => {
  if (!orbiter?.ujbcode) return;

  const ref = doc(db, "CPBoard", orbiter.ujbcode);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      id: orbiter.ujbcode,
      name: orbiter.name,
      phoneNumber: orbiter.phone,
      role: orbiter.category || "MentOrbiter",
      createdAt: serverTimestamp(),
    });
  }
};

const addCpForProspectFeedback = async (
  db,
  orbiter,
  prospectPhone,
  prospectName
) => {

  if (!orbiter?.ujbcode) return;

  await ensureCpBoardUser(db, orbiter);

  const q = query(
    collection(db, "CPBoard", orbiter.ujbcode, "activities"),
    where("activityNo", "==", "010"),
    where("prospectPhone", "==", prospectPhone)
  );

  const snap = await getDocs(q);

  if (!snap.empty) return;

  await addDoc(
    collection(db, "CPBoard", orbiter.ujbcode, "activities"),
    {
      activityNo: "010",
      activityName: "Communicating Doorstep Feedback from Guest (Tool)",
      points: 30,
      category: "R",
      purpose:
        "Encourages structured documentation of feedback via tool usage for better tracking.",
      prospectName,
      prospectPhone,
      source: "ProspectFeedbackForm",
      month: new Date().toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
      addedAt: serverTimestamp(),
    }
  );
};

/* ================= FETCH DATA ================= */

useEffect(() => {

  const fetchForms = async () => {

    try {

      const subcollectionRef = collection(
        db,
        COLLECTIONS.prospect,
        id,
        "prospectfeedbackform"
      );

      const snapshot = await getDocs(subcollectionRef);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setForms(data);

      const prospectDocRef = doc(db, COLLECTIONS.prospect, id);
      const prospectSnap = await getDoc(prospectDocRef);

      const autofill = {
        fullName: "",
        phoneNumber: "",
        email: "",
        mentorName: "",
      };

      if (prospectSnap.exists()) {

        const d = prospectSnap.data();

        autofill.fullName = d.prospectName || "";
        autofill.phoneNumber = d.prospectPhone || "";
        autofill.email = d.email || "";
        autofill.mentorName = d.orbiterName || "";

      }

      if (data.length === 0) {

        setFormData((prev) => ({ ...prev, ...autofill }));
        setShowForm(true);

      } else {

        setShowForm(false);

        setFormData((prev) => ({
          ...prev,
          ...data[0]
        }));

      }

    } catch (error) {

      console.error("Error fetching data:", error);

    } finally {

      setLoading(false);

    }

  };

  if (id) fetchForms();

}, [id]);

/* ================= FORM HANDLERS ================= */

const handleChange = (e) => {

  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: value
  }));

};

const handleCheckboxChange = (e, key) => {

  const { value, checked } = e.target;

  setFormData((prev) => ({
    ...prev,
    [key]: checked
      ? [...prev[key], value]
      : prev[key].filter((v) => v !== value)
  }));

};

/* ================= SUBMIT ================= */

const handleSubmit = async (e) => {

  e.preventDefault();

  try {

    const subcollectionRef = collection(
      db,
      COLLECTIONS.prospect,
      id,
      "prospectfeedbackform"
    );

    await addDoc(subcollectionRef, formData);

    const prospectRef = doc(db, COLLECTIONS.prospect, id);
    const prospectSnap = await getDoc(prospectRef);

    if (prospectSnap.exists()) {

      const data = prospectSnap.data();

      const qMentor = query(
        collection(db, COLLECTIONS.userDetail),
        where("MobileNo", "==", data.orbiterContact)
      );

      const mentorSnap = await getDocs(qMentor);

      if (!mentorSnap.empty) {

        const d = mentorSnap.docs[0].data();

        if (d.UJBCode) {

          const orbiter = {
            ujbcode: d.UJBCode,
            name: d.Name,
            phone: d.MobileNo,
            category: d.Category,
          };

          await addCpForProspectFeedback(
            db,
            orbiter,
            data.prospectPhone,
            data.prospectName
          );

        }

      }

    }

    alert("Form submitted successfully");

    setShowForm(false);

  } catch (error) {

    console.error("Error submitting form:", error);

  }

};

if (loading) return <Text>Loading...</Text>;

return (

<>
<Text variant="h1">Prospect Feedback</Text>

{forms.length === 0 && showForm && (

<Card>

<form onSubmit={handleSubmit} className="space-y-6">

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

<FormField label="Prospect Name">
<Input name="fullName" value={formData.fullName} onChange={handleChange}/>
</FormField>

<FormField label="Phone Number">
<Input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}/>
</FormField>

<FormField label="Email">
<Input name="email" value={formData.email} onChange={handleChange}/>
</FormField>

<FormField label="Orbiter Name">
<Input name="mentorName" value={formData.mentorName} onChange={handleChange}/>
</FormField>

</div>

<FormField label="Understanding of UJustBe">
<Select
value={formData.understandingLevel}
onChange={(v)=>setFormData({...formData, understandingLevel:v})}
options={[
{label:"Excellent",value:"Excellent"},
{label:"Good",value:"Good"},
{label:"Fair",value:"Fair"},
{label:"Poor",value:"Poor"}
]}
/>
</FormField>

<FormField label="Self Growth Clarity">
<Select
value={formData.selfGrowthUnderstanding}
onChange={(v)=>setFormData({...formData,selfGrowthUnderstanding:v})}
options={[
{label:"Yes, very clearly",value:"Yes, very clearly"},
{label:"Somewhat",value:"Somewhat"},
{label:"No, still unclear",value:"No, still unclear"}
]}
/>
</FormField>

<FormField label="Interest in Joining">
<Select
value={formData.joinInterest}
onChange={(v)=>setFormData({...formData,joinInterest:v})}
options={[
{label:"Yes, I am interested",value:"Yes, I am interested"},
{label:"I would like to think about it",value:"I would like to think about it"},
{label:"No, not interested",value:"No, not interested"}
]}
/>
</FormField>

<div>

<Text variant="h3">Most Interesting Aspects</Text>

<div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">

{interestOptions.map((option,index)=>(
<label key={index} className="flex items-center gap-2">
<input
type="checkbox"
value={option}
checked={formData.interestAreas.includes(option)}
onChange={(e)=>handleCheckboxChange(e,"interestAreas")}
/>
<span>{option}</span>
</label>
))}

</div>

</div>

<div>

<Text variant="h3">Preferred Communication</Text>

<div className="flex gap-4 mt-2">

{communicationOptions.map((option,index)=>(
<label key={index} className="flex items-center gap-2">
<input
type="checkbox"
value={option}
checked={formData.communicationOptions.includes(option)}
onChange={(e)=>handleCheckboxChange(e,"communicationOptions")}
/>
<span>{option}</span>
</label>
))}

</div>

</div>

<FormField label="Questions or Suggestions">
<textarea
className="w-full border rounded-lg p-3"
name="additionalComments"
value={formData.additionalComments}
onChange={handleChange}
/>
</FormField>

<div className="flex justify-end pt-4">
<Button type="submit">Submit Feedback</Button>
</div>

</form>

</Card>

)}

{forms.length>0 && forms.map((form)=>(
<Card key={form.id} className="mb-6">

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

<FormField label="Prospect Name"><Input value={form.fullName||""} disabled/></FormField>
<FormField label="Phone"><Input value={form.phoneNumber||""} disabled/></FormField>
<FormField label="Email"><Input value={form.email||""} disabled/></FormField>
<FormField label="Orbiter Name"><Input value={form.mentorName||""} disabled/></FormField>
<FormField label="Understanding"><Input value={form.understandingLevel||""} disabled/></FormField>
<FormField label="Self Growth"><Input value={form.selfGrowthUnderstanding||""} disabled/></FormField>
<FormField label="Join Interest"><Input value={form.joinInterest||""} disabled/></FormField>

</div>

<FormField label="Comments">
<textarea
className="w-full border rounded-lg p-3"
value={form.additionalComments||""}
disabled
/>
</FormField>

</Card>
))}

</>

);

};

export default ProspectFeedback;