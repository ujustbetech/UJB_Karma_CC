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

import { db } from "@/lib/firebase/firebaseClient";
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

  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

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

/* ================= FETCH DATA ================= */

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

    let autofill = {
      fullName: "",
      phoneNumber: "",
      email: "",
      mentorName: "",
    };

    if (prospectSnap.exists()) {

      const d = prospectSnap.data();

      autofill = {
        fullName: d.prospectName || "",
        phoneNumber: d.prospectPhone || "",
        email: d.email || "",
        mentorName: d.orbiterName || "",
      };

    }

    if (data.length === 0) {

      setFormData((prev) => ({
        ...prev,
        ...autofill
      }));

      setShowForm(true);

    } else {

      setShowForm(false);

    }

  } catch (error) {

    console.error("Error fetching data:", error);

  } finally {

    setLoading(false);

  }

};

useEffect(() => {
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

    const payload = {
      ...formData,
      createdAt: serverTimestamp()
    };

    const subcollectionRef = collection(
      db,
      COLLECTIONS.prospect,
      id,
      "prospectfeedbackform"
    );

    await addDoc(subcollectionRef, payload);

    alert("Form submitted successfully");

    // ⭐ reload feedback from Firestore
    const snapshot = await getDocs(subcollectionRef);

    const updatedForms = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    setForms(updatedForms);

    setShowForm(false);

  } catch (error) {

    console.error("Error submitting form:", error);

  }

};
/* ================= UPDATE ================= */

const handleUpdate = async (e) => {

  e.preventDefault();

  try {

    const docRef = doc(
      db,
      COLLECTIONS.prospect,
      id,
      "prospectfeedbackform",
      editingId
    );

    await setDoc(docRef, {
      ...formData,
      updatedAt: serverTimestamp()
    }, { merge: true });

    alert("Feedback updated successfully");

    setEditMode(false);
    setEditingId(null);

    await fetchForms();

  } catch (error) {

    console.error("Error updating form:", error);

  }

};

if (loading) return <Text>Loading...</Text>;

return (

<>
<Text variant="h1">Prospect Feedback</Text>

{/* ================= NEW FORM ================= */}

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

{/* Interest Areas */}

<FormField label="Interest Areas">
<div className="grid grid-cols-1 md:grid-cols-2 gap-2">

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
</FormField>

{/* Communication */}

<FormField label="Preferred Communication">

<div className="flex gap-4">

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

</FormField>

<FormField label="Comments">

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

{/* ================= VIEW FEEDBACK ================= */}

{forms.map((form)=>(

<Card key={form.id} className="mb-6">

<form onSubmit={editMode ? handleUpdate : undefined}>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

<FormField label="Prospect Name">
<Input value={editMode ? formData.fullName : form.fullName} name="fullName" onChange={handleChange} disabled={!editMode}/>
</FormField>

<FormField label="Phone">
<Input value={editMode ? formData.phoneNumber : form.phoneNumber} name="phoneNumber" onChange={handleChange} disabled={!editMode}/>
</FormField>

<FormField label="Email">
<Input value={editMode ? formData.email : form.email} name="email" onChange={handleChange} disabled={!editMode}/>
</FormField>

<FormField label="Orbiter Name">
<Input value={editMode ? formData.mentorName : form.mentorName} name="mentorName" onChange={handleChange} disabled={!editMode}/>
</FormField>

<FormField label="Understanding">
{editMode ? (
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
) : (
<Input value={form.understandingLevel || ""} disabled/>
)}
</FormField>

<FormField label="Self Growth">
{editMode ? (
<Select
value={formData.selfGrowthUnderstanding}
onChange={(v)=>setFormData({...formData,selfGrowthUnderstanding:v})}
options={[
{label:"Yes, very clearly",value:"Yes, very clearly"},
{label:"Somewhat",value:"Somewhat"},
{label:"No, still unclear",value:"No, still unclear"}
]}
/>
) : (
<Input value={form.selfGrowthUnderstanding || ""} disabled/>
)}
</FormField>
<FormField label="Join Interest">
{editMode ? (
<Select
value={formData.joinInterest}
onChange={(v)=>setFormData({...formData,joinInterest:v})}
options={[
{label:"Yes, I am interested",value:"Yes, I am interested"},
{label:"I would like to think about it",value:"I would like to think about it"},
{label:"No, not interested",value:"No, not interested"}
]}
/>
) : (
<Input value={form.joinInterest || ""} disabled/>
)}
</FormField>

</div>

<FormField label="Interest Areas">
<Input value={(editMode ? formData.interestAreas : form.interestAreas)?.join(", ")} disabled/>
</FormField>

<FormField label="Preferred Communication">
<Input value={(editMode ? formData.communicationOptions : form.communicationOptions)?.join(", ")} disabled/>
</FormField>

<FormField label="Comments">
<textarea
className="w-full border rounded-lg p-3"
value={editMode ? formData.additionalComments : form.additionalComments}
name="additionalComments"
onChange={handleChange}
disabled={!editMode}
/>
</FormField>

<div className="flex gap-3 mt-4">

{!editMode && (
<Button
type="button"
onClick={()=>{
setEditMode(true);
setEditingId(form.id);
setFormData(form);
}}
>
Edit
</Button>
)}

{editMode && (
<Button type="submit">
Update
</Button>
)}

</div>

</form>

</Card>

))}

</>

);

};

export default ProspectFeedback;
