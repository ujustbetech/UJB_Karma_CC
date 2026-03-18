"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  getDoc,
} from "firebase/firestore";

import Swal from "sweetalert2";
import { db } from "@/firebaseConfig";
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
  const [originalForms, setOriginalForms] = useState([]);
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
          const defaultForm = [
            {
              id: null,
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
              howFoundOther: "",
              interestLevel: "",
              interestAreas: [],
              interestOther: "",
              contributionWays: [],
              contributionOther: "",
              informedStatus: "",
              alignmentLevel: "",
              recommendation: "",
              additionalComments: "",
            },
          ];

          setForms(defaultForm);
          setOriginalForms(defaultForm);
          setEditMode(true);
        } else {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setForms(data);
          setOriginalForms(data);
          setEditMode(false);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching prospect forms:", error);
      }
    };

    fetchForms();
  }, [id]);

  const handleChange = (index, field, value) => {
    const updated = [...forms];
    updated[index][field] = value;
    setForms(updated);
  };

  const handleCancel = () => {
    setForms(originalForms);
    setEditMode(false);
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
            collection(db, COLLECTIONS.prospect, id, "prospectform"),
            formCopy
          );
        }
      }

      Swal.fire("Success", "Saved Successfully", "success");

      setOriginalForms(forms);
      setEditMode(false);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save", "error");
    }
  };

  const formatDate = (value) => {
    if (!value) return todayISO;

    if (value?.seconds) {
      return new Date(value.seconds * 1000)
        .toISOString()
        .split("T")[0];
    }

    const d = new Date(value);
    return !isNaN(d) ? d.toISOString().split("T")[0] : todayISO;
  };

  if (loading) return <Text>Loading...</Text>;

  return (
    <>
      <Text variant="h1">Prospects Assessment Form</Text>

      {forms.map((form, index) => (
        <Card key={form.id || index} className="mb-6">
          
          {/* BASIC DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Mentor Name", key: "mentorName", frozen: true },
              { label: "Mentor Phone", key: "mentorPhone", frozen: true },
              { label: "Mentor Email", key: "mentorEmail", frozen: true },
              { label: "Assessment Date", key: "assessmentDate", frozen: true },
              { label: "Prospect Name", key: "fullName", frozen: true },
              { label: "Phone", key: "phoneNumber", frozen: true },
              { label: "Email", key: "email", frozen: true },
              { label: "Country", key: "country" },
              { label: "City", key: "city" },
              { label: "Profession", key: "profession" },
              { label: "Company", key: "companyName" },
              { label: "Industry", key: "industry" },
              { label: "Social Profile", key: "socialProfile" },
            ].map(({ label, key, frozen }) => (
              <FormField key={key} label={label}>
                {key === "assessmentDate" ? (
                  <DateInput
                    value={formatDate(form[key])}
                    disabled={frozen || !editMode}
                    onChange={(e) =>
                      handleChange(index, key, e.target.value)
                    }
                  />
                ) : (
                  <Input
                    value={form[key] || ""}
                    disabled={frozen || !editMode}
                    onChange={(e) =>
                      handleChange(index, key, e.target.value)
                    }
                  />
                )}
              </FormField>
            ))}
          </div>

          {/* SELECTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">

            <FormField label="How Found">
              <Select
                value={form.howFound || ""}
                disabled={!editMode}
                onChange={(v) => handleChange(index, "howFound", v)}
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
                onChange={(v) => handleChange(index, "interestLevel", v)}
                options={[
                  { label: "Actively involved", value: "Actively involved" },
                  { label: "Some interest", value: "Some interest" },
                  { label: "Unfamiliar but open", value: "Unfamiliar but open" },
                ]}
              />
            </FormField>

            <FormField label="Informed Status">
              <Select
                value={form.informedStatus || ""}
                disabled={!editMode}
                onChange={(v) => handleChange(index, "informedStatus", v)}
                options={[
                  { label: "Fully aware", value: "Fully aware" },
                  { label: "Partially aware", value: "Partially aware" },
                  { label: "Not informed", value: "Not informed" },
                ]}
              />
            </FormField>

            <FormField label="Alignment Level">
              <Select
                value={form.alignmentLevel || ""}
                disabled={!editMode}
                onChange={(v) => handleChange(index, "alignmentLevel", v)}
                options={[
                  { label: "Not aligned", value: "Not aligned" },
                  { label: "Slightly aligned", value: "Slightly aligned" },
                  { label: "Neutral", value: "Neutral" },
                  { label: "Mostly aligned", value: "Mostly aligned" },
                  { label: "Fully aligned", value: "Fully aligned" },
                ]}
              />
            </FormField>

            <FormField label="Recommendation">
              <Select
                value={form.recommendation || ""}
                disabled={!editMode}
                onChange={(v) => handleChange(index, "recommendation", v)}
                options={[
                  { label: "Strongly recommended", value: "Strongly recommended" },
                  { label: "Needs alignment", value: "Needs alignment" },
                  { label: "Not recommended", value: "Not recommended" },
                ]}
              />
            </FormField>

          </div>

          {/* ARRAYS */}
          <FormField label="Interest Areas" className="pt-6">
            <Input value={(form.interestAreas || []).join(", ")} disabled />
          </FormField>

          <FormField label="Contribution Ways">
            <Input value={(form.contributionWays || []).join(", ")} disabled />
          </FormField>

          {/* OTHER FIELDS */}
          {form.howFoundOther && (
            <FormField label="How Found Other">
              <Input value={form.howFoundOther} disabled />
            </FormField>
          )}

          {form.interestOther && (
            <FormField label="Interest Other">
              <Input value={form.interestOther} disabled />
            </FormField>
          )}

          {form.contributionOther && (
            <FormField label="Contribution Other">
              <Input value={form.contributionOther} disabled />
            </FormField>
          )}

          {/* COMMENTS */}
          <FormField label="Additional Comments">
            <Input
              value={form.additionalComments || ""}
              disabled={!editMode}
              onChange={(e) =>
                handleChange(index, "additionalComments", e.target.value)
              }
            />
          </FormField>
        </Card>
      ))}

      <div className="flex justify-end gap-2">
        {!editMode ? (
          <Button onClick={() => setEditMode(true)}>Edit</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        )}
      </div>
    </>
  );
};

export default ProspectFormDetails;