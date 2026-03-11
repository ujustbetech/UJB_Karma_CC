"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";
import { collection, addDoc, getDocs, doc, getDoc } from "firebase/firestore";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import FormField from "@/components/ui/FormField";

const EngagementForm = ({ id }) => {

const [loading, setLoading] = useState(false);
const [entries, setEntries] = useState([]);
const [userList, setUserList] = useState([]);
const [filteredUsers, setFilteredUsers] = useState([]);
const [userSearch, setUserSearch] = useState("");

const [formData, setFormData] = useState({
  callDate: "",
  orbiterName: "",
  occasion: "",
  referralId: "",
  eventName: "",
  otherOccasion: "",
  discussionDetails: "",
  orbiterSuggestions: [""],
  teamSuggestions: [""],
  referralPossibilities: [""],
  nextFollowupDate: ""
});



/* ================= ARRAY FIELD HANDLERS ================= */

const handleArrayChange = (field, index, value) => {
  const updated = [...formData[field]];
  updated[index] = value;
  setFormData({ ...formData, [field]: updated });
};

const addMoreField = (field) => {
  setFormData({ ...formData, [field]: [...formData[field], ""] });
};

/* ================= USER SEARCH ================= */

const handleSearchUser = (e) => {
  const value = e.target.value.toLowerCase();
  setUserSearch(value);

  const filtered = userList.filter(
    (user) => user.name && user.name.toLowerCase().includes(value)
  );

  setFilteredUsers(filtered);
};
const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};
const handleSelectUser = (user) => {
  setFormData((prev) => ({ ...prev, orbiterName: user.name }));
  setUserSearch("");
  setFilteredUsers([]);
};

/* ================= FETCH USERS ================= */

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const userRef = collection(db, COLLECTIONS.userDetail);
      const snapshot = await getDocs(userRef);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data()["Name"],
        phone: doc.data()["MobileNo"],
        Email: doc.data()["Email"],
      }));

      setUserList(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  fetchUsers();
}, []);

/* ================= FORM HANDLERS ================= */

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};

const handleSave = async () => {

  if (!id) {
    alert("Prospect ID missing!");
    return;
  }

  setLoading(true);

  try {

    const stage5Ref = collection(db, "Prospects", id, "engagementform");

    await addDoc(stage5Ref, {
      ...formData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    alert("Data saved successfully!");

    setFormData({
      callDate: "",
      orbiterName: "",
      occasion: "",
      discussionDetails: "",
      orbiterSuggestions: [""],
      teamSuggestions: [""],
      referralPossibilities: [""],
    });

    fetchEntries();

  } catch (err) {

    console.error("Error saving data:", err);
    alert("Failed to save data.");

  } finally {

    setLoading(false);

  }
};

/* ================= FETCH ENTRIES ================= */

const fetchEntries = async () => {

  if (!id) return;

  try {

    const stage5Ref = collection(db, "Prospects", id, "engagementform");
    const snapshot = await getDocs(stage5Ref);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setEntries(data);

  } catch (err) {

    console.error("Error fetching data:", err);

  }
};

const fetchProspectName = async () => {

  if (!id) return;

  try {

    const prospectRef = doc(db, "Prospects", id);
    const prospectSnap = await getDoc(prospectRef);

    if (prospectSnap.exists()) {

      const data = prospectSnap.data();

      setFormData((prev) => ({
        ...prev,
        orbiterName: data.prospectName || "",
      }));

    }

  } catch (err) {

    console.error("Error fetching prospect name:", err);

  }
};

useEffect(() => {
  fetchEntries();
  fetchProspectName();
}, [id]);

/* ================= UI ================= */

return (

<>
<Text variant="h1">Engagement Logs</Text>

<Card>

<form className="space-y-6">

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

<FormField label="Date of Calling">
<DateInput
value={formData.callDate}
onChange={(e)=>setFormData({...formData,callDate:e.target.value})}
/>
</FormField>

<FormField label="Name of the Orbiter">

<div className="relative">

<Input
placeholder="Search Orbiter"
value={formData.orbiterName}
onChange={(e)=>handleSearchUser(e)}
/>

{filteredUsers.length > 0 && (
<div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-40 overflow-auto">
{filteredUsers.map((user)=>(
<div
key={user.id}
className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
onClick={()=>handleSelectUser(user)}
>
{user.name}
</div>
))}
</div>
)}

</div>

</FormField>

<FormField label="Occasion">

<Select
value={formData.occasion}
onChange={(v)=>setFormData({...formData,occasion:v})}
options={[
{label:"Referral Follow up",value:"Referral Follow up"},
{label:"Rapport building",value:"Rapport building"},
{label:"Event Calling",value:"Event Calling"},
{label:"Enquiry Follow ups",value:"Enquiry Follow ups"},
{label:"Birthday Wishes",value:"Birthday Wishes"},
{label:"Other",value:"Other"},
]}
/>

</FormField>

<FormField label="Next Follow-up Date">
<DateInput
value={formData.nextFollowupDate}
onChange={(e)=>setFormData({...formData,nextFollowupDate:e.target.value})}
/>
</FormField>

</div>

<FormField label="Discussion Details">
<textarea
className="w-full border rounded-lg p-3"
name="discussionDetails"
value={formData.discussionDetails}
onChange={handleChange}
/>
</FormField>

</form>

</Card>

<Card className="mt-6">

<Text variant="h3">Saved Engagement Entries</Text>

{entries.length === 0 ? (

<Text>No data found.</Text>

) : (

<div className="overflow-x-auto">

<table className="min-w-full border mt-4">

<thead className="bg-slate-100">

<tr>
<th className="p-2 border">Date</th>
<th className="p-2 border">Orbiter</th>
<th className="p-2 border">Occasion</th>
<th className="p-2 border">Discussion</th>
<th className="p-2 border">Next Followup</th>
<th className="p-2 border">Last Updated</th>
</tr>

</thead>

<tbody>

{entries.map((entry)=>(
<tr key={entry.id} className="border">

<td className="p-2">{formatDate(entry.callDate)}</td>
<td className="p-2">{entry.orbiterName}</td>
<td className="p-2">{entry.occasion}</td>
<td className="p-2">{entry.discussionDetails}</td>
<td className="p-2">{formatDate(entry.nextFollowupDate)}</td>
<td className="p-2">
{entry.updatedAt
? formatDate(entry.updatedAt.seconds ? entry.updatedAt.toDate() : entry.updatedAt)
: "—"}
</td>

</tr>
))}

</tbody>

</table>

</div>

)}

</Card>

<div className="flex justify-end mt-4">
<Button onClick={handleSave} disabled={loading}>
{loading ? "Saving..." : "Save"}
</Button>
</div>

</>

);

};

export default EngagementForm;