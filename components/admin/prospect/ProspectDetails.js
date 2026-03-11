"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  getDoc,
  setDoc,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "@/firebaseConfig";
import { getAuth } from "firebase/auth";
import { COLLECTIONS } from "@/lib/utility_collection";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import FormField from "@/components/ui/FormField";

const ProspectFormDetails = ({ id }) => {

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const todayISO = new Date().toISOString().split("T")[0];

  useEffect(() => {

    const fetchForms = async () => {

      try {

        const subcollectionRef = collection(
          db,
          COLLECTIONS.prospect,
          id,
          "prospectform"
        );

        const snapshot = await getDocs(subcollectionRef);

        const auth = getAuth();
        const user = auth.currentUser;

        const prospectDocRef = doc(db, COLLECTIONS.prospect, id);
        const prospectSnap = await getDoc(prospectDocRef);

        const prospectData = prospectSnap.exists()
          ? prospectSnap.data()
          : {};

        const defaultMentor = {
          mentorName: prospectData.orbiterName || "",
          mentorPhone: prospectData.orbiterContact || "",
          mentorEmail: prospectData.orbiterEmail || "",
        };

        const defaultProspect = {
          fullName: prospectData.prospectName || "",
          email: prospectData.email || "",
          phoneNumber: prospectData.prospectPhone || "",
        };

        if (snapshot.empty) {

          setForms([
            {
              ...defaultMentor,
              ...defaultProspect,
              assessmentDate: todayISO,
              country: "",
              city: "",
              profession: prospectData.occupation || "",
              companyName: "",
              industry: "",
              socialProfile: "",
              howFound: "",
              interestLevel: "",
              interestAreas: prospectData.hobbies
                ? [prospectData.hobbies]
                : [],
              contributionWays: [],
              informedStatus: "",
              alignmentLevel: "",
              recommendation: "",
              additionalComments: "",
            },
          ]);

          setEditMode(true);

        } else {

          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setForms(data);

        }

        setLoading(false);

      } catch (error) {

        console.error("Error fetching prospect forms:", error);

      }

    };

    fetchForms();

  }, [id]);

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

    const ref = doc(db, "CPBoard", orbiter.ujbcode);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const totals = snap.data().totals || { R: 0, H: 0, W: 0 };

    const split = Math.floor(points / categories.length);

    const updated = { ...totals };

    categories.forEach((c) => {

      updated[c] = (updated[c] || 0) + split;

    });

    await updateDoc(ref, { totals: updated });

  };

  const addCpForProspectAssessment = async (orbiter, prospect) => {

    await ensureCpBoardUser(orbiter);

    const activityNo = "002";
    const points = 100;
    const categories = ["R"];

    const q = query(
      collection(db, "CPBoard", orbiter.ujbcode, "activities"),
      where("activityNo", "==", activityNo),
      where("prospectPhone", "==", prospect.phone)
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
        prospectName: prospect.name,
        prospectPhone: prospect.phone,
        source: "ProspectFormDetails",
        month: new Date().toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        addedAt: serverTimestamp(),
      }
    );

    await updateCategoryTotals(orbiter, categories, points);

  };

  const handleChange = (formIndex, field, value) => {

    const updatedForms = [...forms];

    updatedForms[formIndex][field] = value;

    setForms(updatedForms);

  };

  const handleSave = async () => {

    try {

      for (const form of forms) {

        const formCopy = { ...form };

        if (form.id) {

          const docRef = doc(
            db,
            COLLECTIONS.prospect,
            id,
            "prospectform",
            form.id
          );

          delete formCopy.id;

          await updateDoc(docRef, formCopy);

        } else {

          await addDoc(
            collection(
              db,
              COLLECTIONS.prospect,
              id,
              "prospectform"
            ),
            formCopy
          );

          const prospectSnap = await getDoc(
            doc(db, COLLECTIONS.prospect, id)
          );

          if (!prospectSnap.exists()) continue;

          const p = prospectSnap.data();

          if (!p.orbiterContact) {
            console.error("orbiterContact missing in prospect");
            continue;
          }

          const qMentor = query(
            collection(db, "usersdetail"),
            where("MobileNo", "==", p.orbiterContact)
          );

          const mentorSnap = await getDocs(qMentor);

          if (mentorSnap.empty) {
            console.error("Mentor not found:", p.orbiterContact);
            continue;
          }

          const d = mentorSnap.docs[0].data();

          const orbiter = {
            ujbcode: d.UJBCode,
            name: d.Name,
            phone: d.MobileNo,
            category: d.Category,
          };

          await addCpForProspectAssessment(orbiter, {
            name: p.prospectName,
            phone: p.prospectPhone,
          });

        }

      }

   Swal.fire({
  icon: "success",
  title: "Saved!",
  text: "Prospect Details Saved Successfully",
  confirmButtonColor: "#2563eb",
});
      setEditMode(false);

    } catch (err) {

      console.error("Error saving forms:", err);
  Swal.fire({
  icon: "error",
  title: "Error",
  text: "Failed to save changes",
});
    }

  };

  const handleAddForm = () => {

    setEditMode(true);

  };

  if (loading) return <Text>Loading...</Text>;

  if (forms.length === 0) {

    return (

      <>
        <Text variant="h1">Prospects Assessment Form</Text>

        <Card>

          <Text>No prospect forms found.</Text>

          <div className="pt-4">
            <Button onClick={handleAddForm}>
              Add New Form
            </Button>
          </div>

        </Card>
      </>

    );

  }

  return (

    <>
      <Text variant="h1">Prospects Assessment Form</Text>

      {forms.map((form, index) => (

        <Card key={form.id || index} className="mb-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {[
              { label: "Mentor Name", key: "mentorName" },
              { label: "Mentor Phone", key: "mentorPhone" },
              { label: "Mentor Email", key: "mentorEmail" },
              { label: "Assessment Date", key: "assessmentDate" },
              { label: "Prospect Name", key: "fullName" },
              { label: "Phone", key: "phoneNumber" },
              { label: "Email", key: "email" },
              { label: "Country", key: "country" },
              { label: "City", key: "city" },
              { label: "Profession", key: "profession" },
              { label: "Company", key: "companyName" },
              { label: "Industry", key: "industry" },
              { label: "Social Profile", key: "socialProfile" },
            ].map(({ label, key }) => (

              <FormField key={key} label={label}>

                {key === "assessmentDate" ? (

                 <DateInput
  value={form[key] || todayISO}
  disabled={!editMode}
  onChange={(e) =>
    handleChange(index, key, e.target.value)
  }
/>

                ) : (

                  <Input
                    value={form[key] || ""}
                    disabled={!editMode}
                    onChange={(e) =>
                      handleChange(index, key, e.target.value)
                    }
                  />

                )}

              </FormField>

            ))}

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">

            <FormField label="Found How">

              <Select
                value={form.howFound || ""}
                disabled={!editMode}
                onChange={(v) =>
                  handleChange(index, "howFound", v)
                }
                options={[
                  { label: "Referral", value: "Referral" },
                  { label: "Networking Event", value: "Networking Event" },
                  { label: "Social Media", value: "Social Media" },
                  { label: "Other", value: "Other" },
                ]}
              />

            </FormField>

            <FormField label="Interest Level">

              <Select
                value={form.interestLevel || ""}
                disabled={!editMode}
                onChange={(v) =>
                  handleChange(index, "interestLevel", v)
                }
                options={[
                  { label: "Actively involved", value: "Actively involved" },
                  { label: "Some interest", value: "Some interest" },
                  { label: "Unfamiliar but open", value: "Unfamiliar but open" },
                ]}
              />

            </FormField>

          </div>

          <FormField label="Comments" className="pt-6">

            <Input
              value={form.additionalComments || ""}
              disabled={!editMode}
              onChange={(e) =>
                handleChange(
                  index,
                  "additionalComments",
                  e.target.value
                )
              }
            />

          </FormField>

        </Card>

      ))}

      <div className="flex justify-end gap-2">

        {!editMode ? (

         <Button
  onClick={() => setEditMode(true)}
  className="cursor-pointer"
>
  Edit
</Button>
        ) : (
<Button
  onClick={handleSave}
  className="cursor-pointer"
>
  Save
</Button>

        )}

      </div>
    </>
  );

};

export default ProspectFormDetails;