"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db, storage } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";

import FormField from "@/components/ui/FormField";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import Input from "@/components/ui/Input";
import { Cake, Users, User, Phone } from "lucide-react";

export default function AddBirthdayClient() {
  const toast = useToast();

  /* ================= STATE ================= */

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [dob, setDob] = useState("");
  const [image, setImage] = useState(null);

  const [existing, setExisting] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);



  /* ================= LIFECYCLE ================= */

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function loadUsers() {
      const snap = await getDocs(collection(db, COLLECTIONS.userDetail));

      const list = snap.docs
        .map((docSnap) => {
          const d = docSnap.data();
          if (!d?.Name || !d?.MobileNo) return null;

          return {
            label: d.Name.trim(),
            value: String(d.MobileNo),
            email: d.Email || "",
            mentorName: d.MentorName || "",
            photoURL: d.ProfilePhotoURL || "",
          };
        })
        .filter(Boolean);

      setUsers(list);
    }

    loadUsers();
  }, []);

  /* ================= DERIVED ================= */

  const filteredUsers = users.filter((u) =>
    u.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUserData = users.find(
    (u) => String(u.value) === String(selectedUser)
  );

  const getInitials = (name = "") =>
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();


  const hasValidPhoto =
    selectedUserData?.photoURL &&
    selectedUserData.photoURL !== "-" &&
    selectedUserData.photoURL.startsWith("http");

  /* ================= DUPLICATE CHECK ================= */

  useEffect(() => {
    if (!selectedUser) {
      setExisting(false);
      return;
    }

    getDoc(doc(db, COLLECTIONS.birthdayCanva, selectedUser)).then((snap) => {
      setExisting(snap.exists());
      if (snap.exists()) {
        toast.info("Birthday Canva already exists for this user");
      }
    });
  }, [selectedUser]);

  /* ================= DOB INFO ================= */

  const dobInfo = dob
    ? (() => {
      const d = new Date(dob);
      const age = new Date().getFullYear() - d.getFullYear();
      const day = d.toLocaleDateString("en-US", { weekday: "long" });
      return { age, day };
    })()
    : null;

  /* ================= VALIDATION ================= */

  const validate = () => {
    const e = {};
    if (!selectedUser) e.user = "User is required";
    if (!dob) e.dob = "Date of birth is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ================= IMAGE HANDLING ================= */

  const handleImageChange = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setImage(file);
  };

  const uploadImage = async () => {
    if (!image) return "";

    const imageRef = ref(
      storage,
      `birthdayImages/${selectedUser}/${Date.now()}`
    );

    await uploadBytes(imageRef, image);
    return await getDownloadURL(imageRef);
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!validate() || !selectedUserData || existing) return;

    setSaving(true);

    try {
      const imageUrl = image ? await uploadImage() : "";

      await setDoc(doc(db, COLLECTIONS.birthdayCanva, selectedUser), {
        name: selectedUserData.label,
        phone: selectedUserData.value,
        email: selectedUserData.email,
        mentorName: selectedUserData.mentorName,
        dob,
        dobTimestamp: new Date(dob),
        imageUrl,
        registeredAt: serverTimestamp(),
      });

      toast.success("Birthday Canva saved successfully");

      setSearch("");
      setSelectedUser("");
      setDob("");
      setImage(null);
      setErrors({});
    } catch (err) {
      console.error(err);
      toast.error("Failed to save Birthday Canva");
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  /* ================= UI ================= */

  return (
    <>
      

      <Card className="space-y-6">
        <Text className="py-6" variant="h1">Add Birthday Canva</Text>

        {/* SEARCH */}
        <FormField label="Search User">
          <Input
            placeholder="Search by name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedUser("");
            }}
          />
        </FormField>

        {/* SELECT */}
        <FormField label="Select User" required error={errors.user}>
          <Select
            placeholder="Select user"
            options={filteredUsers}
            value={selectedUser}
            onChange={(val) => {
              setSelectedUser(val?.value ?? val);
              setErrors((p) => ({ ...p, user: null }));
            }}
          />
        </FormField>

        {/* USER + MENTOR PREVIEW */}
        {selectedUserData && (
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-4">
              {hasValidPhoto ? (
                <img
                  src={selectedUserData.photoURL}
                  alt={selectedUserData.label}
                  className="h-14 w-14 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600">
                  {getInitials(selectedUserData.label)}
                </div>
              )}

              <div className="space-y-1">
                {/* Name */}
                <div className="flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  <Text variant="h3">{selectedUserData.label}</Text>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone size={14} />
                  <Text variant="muted">{selectedUserData.value}</Text>
                </div>

                {/* Mentor */}
                <div className="flex items-center gap-2 text-slate-500">
                  <Users size={14} />
                  <Text variant="muted">
                    Mentor: {selectedUserData.mentorName || "—"}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* DOB */}
        <FormField label="Date of Birth" required error={errors.dob}>
          <DateInput
            value={dob}
            onChange={(e) => {
              setDob(e.target.value);
              setErrors((p) => ({ ...p, dob: null }));
            }}
          />
        </FormField>

        {dobInfo && (
          <div className="flex items-center gap-2 pl-1 text-slate-500">
            <Cake size={16} className="text-slate-400" />
            <Text variant="muted">
              Turns <strong>{dobInfo.age}</strong> on {dobInfo.day}
            </Text>
          </div>
        )}
        {/* IMAGE */}
        <FormField label="Image">
          <Input
            type="file"
            accept="image/*"
            disabled={!selectedUser}
            onChange={(e) => handleImageChange(e.target.files?.[0])}
          />
        </FormField>

        {mounted && image && (
          <img
            src={URL.createObjectURL(image)}
            className="h-32 w-32 rounded-xl object-cover"
          />
        )}

        <Button
          loading={saving}
          disabled={!selectedUser || !dob || existing || saving}
          onClick={() => setShowConfirm(true)}
        >
          Save
        </Button>
      </Card>

      <ConfirmModal
        open={showConfirm}
        title="Confirm Birthday Canva"
        description={`Create Birthday Canva for ${selectedUserData?.label || ""
          }?`}
        confirmText="Save"
        onConfirm={handleSave}
        onClose={() => setShowConfirm(false)}
      />
    </>
  );
}
