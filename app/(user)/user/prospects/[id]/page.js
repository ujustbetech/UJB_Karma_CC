"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import Swal from "sweetalert2";
import { useParams } from "next/navigation";
import { COLLECTIONS } from "@/lib/utility_collection";

const tabs = ["Mentor", "Prospect", "Alignment", "Assessment"];

const initialFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  country: "",
  city: "",
  profession: "",
  companyName: "",
  industry: "",
  socialProfile: "",
  howFound: "",
  interestLevel: "",
  interestAreas: [],
  contributionWays: [],
  informedStatus: "",
  alignmentLevel: "",
  recommendation: "",
  additionalComments: "",
  mentorName: "",
  mentorPhone: "",
  mentorEmail: "",
  howFoundOther: "",
  interestOther: "",
  contributionOther: "",
  assessmentDate: "",
};

const interestOptions = [
  "Skill Sharing & Collaboration",
  "Business Growth & Referrals",
  "Learning & Personal Development",
  "Community Engagement",
  "Others (please specify)",
];

const contributionOptions = [
  "Sharing knowledge and expertise",
  "Providing business or services",
  "Connecting with fellow Orbiters",
  "Active participation in events/meetings",
  "Other (please specify)",
];

export default function ProspectForm() {

  const params = useParams();
  const id = params?.id;

  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState(initialFormState);

  /* FETCH COUNTRIES */

  useEffect(() => {
    fetch("https://countriesnow.space/api/v0.1/countries/positions")
      .then(res => res.json())
      .then(data => setCountries(data.data.map(c => c.name)));
  }, []);

  /* CITY FETCH */

  const handleCountryChange = async (e) => {

    const country = e.target.value;

    setFormData(prev => ({ ...prev, country, city: "" }));

    const response = await fetch(
      "https://countriesnow.space/api/v0.1/countries/cities",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country })
      }
    );

    const data = await response.json();
    setCities(data.data || []);

  };

  const handleCityChange = (e) => {
    setFormData(prev => ({ ...prev, city: e.target.value }));
  };

  /* CP FUNCTIONS */

  const ensureCpBoardUser = async (orbiter) => {

    if (!orbiter?.ujbcode) return;

    const ref = doc(db, "CPBoard", orbiter.ujbcode);
    const snap = await getDoc(ref);

    if (!snap.exists()) {

      await setDoc(ref, {
        id: orbiter.ujbcode,
        name: orbiter.name,
        phoneNumber: orbiter.phone,
        role: orbiter.category || "CosmOrbiter",
        totals: { R: 0, H: 0, W: 0 },
        createdAt: serverTimestamp(),
      });

    }

  };

  const updateCategoryTotals = async (orbiter, categories, points) => {

    if (!orbiter?.ujbcode) return;

    const ref = doc(db, "CPBoard", orbiter.ujbcode);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();
    const totals = data.totals || { R: 0, H: 0, W: 0 };

    const splitPoints = Math.floor(points / categories.length);

    const updatedTotals = { ...totals };

    categories.forEach((cat) => {
      updatedTotals[cat] = (updatedTotals[cat] || 0) + splitPoints;
    });

    await updateDoc(ref, { totals: updatedTotals });

  };

  const addCpForProspectAssessment = async (orbiter, prospectPhone) => {

    if (!orbiter?.ujbcode) return;

    await ensureCpBoardUser(orbiter);

    const activityNo = "002";
    const points = 100;
    const categories = ["R"];

    const q = query(
      collection(db, "CPBoard", orbiter.ujbcode, "activities"),
      where("activityNo", "==", activityNo),
      where("prospectPhone", "==", prospectPhone)
    );

    const snap = await getDocs(q);

    if (!snap.empty) return;

    await addDoc(
      collection(db, "CPBoard", orbiter.ujbcode, "activities"),
      {
        activityNo,
        activityName: "Prospect Assessment (Tool)",
        points,
        categories,
        prospectName: formData.fullName,
        prospectPhone,
        addedAt: serverTimestamp(),
      }
    );

    await updateCategoryTotals(orbiter, categories, points);

  };

  /* FETCH PROSPECT */

  useEffect(() => {

    const fetchProspectDetails = async () => {

      if (!id) return;

      const prospectRef = doc(db, COLLECTIONS.prospect, id);
      const snap = await getDoc(prospectRef);

      if (snap.exists()) {

        const data = snap.data();

        setFormData(prev => ({
          ...prev,
          fullName: data.prospectName || "",
          phoneNumber: data.prospectPhone || "",
          email: data.email || "",
          mentorName: data.orbiterName || "",
          mentorPhone: data.orbiterContact || "",
          mentorEmail: data.orbiterEmail || "",
          profession: data.occupation || "",
        }));

      }

    };

    fetchProspectDetails();

  }, [id]);

  /* HANDLERS */

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCheckboxChange = (e, key) => {

    const { value, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [key]: checked
        ? [...prev[key], value]
        : prev[key].filter(v => v !== value),
    }));

  };

  /* SUBMIT */

const handleSubmit = async () => {
    e.preventDefault();

    const subcollectionRef = collection(
      db,
      COLLECTIONS.prospect,
      id,
      "prospectform"
    );

    const finalData = {
      ...formData,
      howFound:
        formData.howFound === "Other"
          ? formData.howFoundOther
          : formData.howFound,
    };

    try {

      await addDoc(subcollectionRef, finalData);

      const q = query(
        collection(db, COLLECTIONS.userDetail),
        where("MobileNo", "==", formData.mentorPhone)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {

        const d = snap.docs[0].data();

        const orbiter = {
          ujbcode: d.UJBCode,
          name: d.Name,
          phone: d.MobileNo,
          category: d.Category,
        };

        await addCpForProspectAssessment(
          orbiter,
          formData.phoneNumber
        );

      }

      Swal.fire("Success", "Assessment Submitted!", "success");

      setFormData(initialFormState);

    } catch (err) {

      console.error(err);
      Swal.fire("Error", "Something went wrong.", "error");

    }

  };

  const nextTab = () =>
    activeTab < tabs.length - 1 && setActiveTab(activeTab + 1);

  const prevTab = () =>
    activeTab > 0 && setActiveTab(activeTab - 1);

  return (

    <main className="min-h-screen bg-gray-50 py-10">

      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8 max-h-[85vh] overflow-y-auto">

        {/* Tabs */}

        <div className="flex justify-between mb-10">

          {tabs.map((tab, i) => (

            <div
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2 rounded-full text-sm cursor-pointer
              ${activeTab === i
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-600"
              }`}
            >
              {tab}
            </div>

          ))}

        </div>

        <form  className="space-y-6 min-h-[500px]">

          {/* TAB 1 */}
{/* TAB 1 */}

{activeTab === 0 && (

<div className="space-y-4">

<h3 className="text-lg font-semibold text-gray-700">
MentOrbiter Details
</h3>

<input
className="w-full border rounded-lg p-3"
name="mentorName"
value={formData.mentorName}
onChange={handleChange}
placeholder="Your Name"
/>

<input
className="w-full border rounded-lg p-3"
name="mentorPhone"
value={formData.mentorPhone}
onChange={handleChange}
placeholder="Contact Number"
/>

<input
className="w-full border rounded-lg p-3"
name="mentorEmail"
value={formData.mentorEmail}
onChange={handleChange}
placeholder="Email Address"
/>

<input
type="date"
className="w-full border rounded-lg p-3"
name="assessmentDate"
value={formData.assessmentDate}
onChange={handleChange}
/>

</div>

)}

{/* TAB 2 */}

{activeTab === 1 && (

<div className="space-y-4">

<h3 className="text-lg font-semibold text-gray-700">
Prospect Details
</h3>

<input
className="w-full border rounded-lg p-3"
name="fullName"
value={formData.fullName}
onChange={handleChange}
placeholder="Prospect Name"
/>

<input
className="w-full border rounded-lg p-3"
name="phoneNumber"
value={formData.phoneNumber}
onChange={handleChange}
placeholder="Contact Number"
/>

<input
className="w-full border rounded-lg p-3"
name="email"
value={formData.email}
onChange={handleChange}
placeholder="Email Address"
/>

<select
className="w-full border rounded-lg p-3"
value={formData.country}
onChange={handleCountryChange}
>
<option value="">Select Country</option>

{countries.map((c,i)=>(
<option key={i} value={c}>{c}</option>
))}

</select>

<select
className="w-full border rounded-lg p-3"
value={formData.city}
onChange={handleCityChange}
>
<option value="">Select City</option>

{cities.map((city,i)=>(
<option key={i} value={city}>{city}</option>
))}

</select>

<input
className="w-full border rounded-lg p-3"
name="profession"
value={formData.profession}
onChange={handleChange}
placeholder="Occupation"
/>

<input
className="w-full border rounded-lg p-3"
name="companyName"
value={formData.companyName}
onChange={handleChange}
placeholder="Company"
/>

<input
className="w-full border rounded-lg p-3"
name="industry"
value={formData.industry}
onChange={handleChange}
placeholder="Industry"
/>

<input
className="w-full border rounded-lg p-3"
name="socialProfile"
value={formData.socialProfile}
onChange={handleChange}
placeholder="Social Profile"
/>

</div>

)}

{/* TAB 3 */}

{activeTab === 2 && (

<div className="space-y-6">

<h3 className="text-lg font-semibold text-gray-700">
Alignment with UJustBe
</h3>

{/* How found */}

<div>

<label className="text-sm font-medium">
How did you find the prospect?
</label>

<select
name="howFound"
value={formData.howFound}
onChange={handleChange}
className="w-full border rounded-lg p-3 mt-2"
>
<option value="">Select</option>
<option value="Referral">Referral</option>
<option value="Networking Event">Networking Event</option>
<option value="Social Media">Social Media</option>
<option value="Other">Other</option>
</select>

</div>

{formData.howFound === "Other" && (

<input
className="w-full border rounded-lg p-3"
name="howFoundOther"
value={formData.howFoundOther}
onChange={handleChange}
placeholder="Please specify"
/>

)}

{/* Interest Level */}

<div>

<label className="text-sm font-medium">
Interest Level
</label>

<select
name="interestLevel"
value={formData.interestLevel}
onChange={handleChange}
className="w-full border rounded-lg p-3 mt-2"
>
<option value="">Select</option>
<option value="Actively involved">Actively involved</option>
<option value="Some interest">Some interest</option>
<option value="Unfamiliar but open">Unfamiliar but open</option>
</select>

</div>

{/* Interest Areas */}

<div>

<label className="text-sm font-medium">
Interest Areas
</label>

<div className="space-y-2 mt-2">

{interestOptions.map((opt,i)=>(
<label key={i} className="flex items-center gap-2">

<input
type="checkbox"
value={opt}
checked={formData.interestAreas.includes(opt)}
onChange={(e)=>handleCheckboxChange(e,"interestAreas")}
/>

{opt}

</label>
))}

</div>

</div>

{formData.interestAreas.includes("Others (please specify)") && (

<input
className="w-full border rounded-lg p-3"
name="interestOther"
value={formData.interestOther}
onChange={handleChange}
placeholder="Enter interest"
/>

)}

{/* Contribution Ways */}

<div>

<label className="text-sm font-medium">
Contribution Ways
</label>

<div className="space-y-2 mt-2">

{contributionOptions.map((opt,i)=>(
<label key={i} className="flex items-center gap-2">

<input
type="checkbox"
value={opt}
checked={formData.contributionWays.includes(opt)}
onChange={(e)=>handleCheckboxChange(e,"contributionWays")}
/>

{opt}

</label>
))}

</div>

</div>

{formData.contributionWays.includes("Other (please specify)") && (

<input
className="w-full border rounded-lg p-3"
name="contributionOther"
value={formData.contributionOther}
onChange={handleChange}
placeholder="Enter contribution"
/>

)}

{/* Informed Status */}

<div>

<label className="text-sm font-medium">
Informed Status
</label>

<select
name="informedStatus"
value={formData.informedStatus}
onChange={handleChange}
className="w-full border rounded-lg p-3 mt-2"
>
<option value="">Select</option>
<option value="Fully aware">Fully aware</option>
<option value="Partially aware">Partially aware</option>
<option value="Not informed">Not informed</option>
</select>

</div>

</div>

)}

{/* TAB 4 */}

{activeTab === 3 && (

<div className="space-y-6">

<h3 className="text-lg font-semibold text-gray-700">
Assessment & Recommendation
</h3>

<div>

<label className="text-sm font-medium">
Alignment Level
</label>

<select
name="alignmentLevel"
value={formData.alignmentLevel}
onChange={handleChange}
className="w-full border rounded-lg p-3 mt-2"
>
<option value="">Select</option>
<option value="Not aligned">Not aligned</option>
<option value="Slightly aligned">Slightly aligned</option>
<option value="Neutral">Neutral</option>
<option value="Mostly aligned">Mostly aligned</option>
<option value="Fully aligned">Fully aligned</option>
</select>

</div>

<div>

<label className="text-sm font-medium">
Recommendation
</label>

<select
name="recommendation"
value={formData.recommendation}
onChange={handleChange}
className="w-full border rounded-lg p-3 mt-2"
>
<option value="">Select</option>
<option value="Strongly recommended">Strongly recommended</option>
<option value="Needs alignment">Needs alignment</option>
<option value="Not recommended">Not recommended</option>
</select>

</div>

<div>

<label className="text-sm font-medium">
Additional Comments
</label>

<textarea
name="additionalComments"
value={formData.additionalComments}
onChange={handleChange}
rows={4}
className="w-full border rounded-lg p-3 mt-2"
/>

</div>

</div>

)}

          {/* NAV BUTTONS */}

          <div className="flex justify-between pt-6">

            <button
              type="button"
              onClick={prevTab}
              disabled={activeTab === 0}
              className="px-6 py-2 bg-gray-200 rounded-lg"
            >
              Back
            </button>

            {activeTab === tabs.length - 1 ? (
             <button
  type="button"
  onClick={handleSubmit}
  className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
>
  Submit
</button>
            ) : (
           
              <button
  type="button"
  onClick={nextTab}
  className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
>
  Next
</button>
            )}

          </div>

        </form>

      </div>

    </main>

  );

}