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
import Input from "@/components/ui/Input";

import { Cake, Users, User, Phone } from "lucide-react";

export default function AddBirthdayClient() {
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [dob, setDob] = useState("");
  const [image, setImage] = useState(null);

  const [existing, setExisting] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ================= LOAD USERS ================= */

  useEffect(() => {
    async function loadUsers() {
      try {
        const snap = await getDocs(collection(db, COLLECTIONS.userDetail));

        const list = snap.docs
          .map((docSnap) => {
            const d = docSnap.data();

            const name = (d?.Name || "").trim();
            const phone = d?.MobileNo ? String(d.MobileNo) : "";

            if (!name || !phone) return null;

            return {
              label: name,
              value: phone,
              email: d?.Email || "",
              mentorName: d?.MentorName || "",
              photoURL: d?.ProfilePhotoURL || "",
              dob: d?.DOB || d?.dob || "",
            };
          })
          .filter(Boolean);

        setUsers(list);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load users");
      }
    }

    loadUsers();
  }, []);

  /* ================= FILTER ================= */

  const filteredUsers = users.filter((u) =>
    u.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUserData = users.find(
    (u) => String(u.value) === String(selectedUser)
  );

  /* ================= AUTO DOB ================= */

  useEffect(() => {
    if (selectedUserData?.dob) {
      setDob(selectedUserData.dob);
    } else {
      setDob("");
    }
  }, [selectedUserData]);

  /* ================= DUPLICATE ================= */

  useEffect(() => {
    if (!selectedUser) return;

    getDoc(doc(db, COLLECTIONS.birthdayCanva, selectedUser)).then((snap) => {
      setExisting(snap.exists());
    });
  }, [selectedUser]);

  /* ================= DOB FIX ================= */

const dobInfo = dob
  ? (() => {
      let birthDate;

      // ✅ Parse DOB safely (DD/MM/YYYY)
      if (typeof dob === "string") {
        if (dob.includes("/")) {
          const [day, month, year] = dob.split("/");
          birthDate = new Date(`${year}-${month}-${day}`);
        } else {
          birthDate = new Date(dob);
        }
      } else if (dob?.seconds) {
        birthDate = new Date(dob.seconds * 1000);
      } else {
        return null;
      }

      if (isNaN(birthDate.getTime())) return null;

      const today = new Date();

      // 🎯 NEXT BIRTHDAY (THIS YEAR)
      let nextBirthday = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
      );

      // 🎯 If already passed → next year
      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }

      // 🎯 AGE ON NEXT BIRTHDAY
      const age = nextBirthday.getFullYear() - birthDate.getFullYear();

      // 🎯 DAY OF NEXT BIRTHDAY
      const day = nextBirthday.toLocaleDateString("en-US", {
        weekday: "long",
      });

      return { age, day };
    })()
  : null;
  /* ================= HELPERS ================= */

  const getInitials = (name = "") =>
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const hasValidPhoto =
    selectedUserData?.photoURL &&
    selectedUserData.photoURL.startsWith("http");

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!selectedUser || !dob || existing) return;

    setSaving(true);

    try {
      let imageUrl = "";

      if (image) {
        const imageRef = ref(
          storage,
          `birthdayImages/${selectedUser}/${Date.now()}`
        );
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      await setDoc(doc(db, COLLECTIONS.birthdayCanva, selectedUser), {
        name: selectedUserData.label,
        phone: selectedUserData.value,
        email: selectedUserData.email,
        dob,
        dobTimestamp: new Date(dob),
        imageUrl,
        registeredAt: serverTimestamp(),
      });

      toast.success("Saved successfully");

      setSearch("");
      setSelectedUser("");
      setDob("");
      setImage(null);
    } catch (err) {
      console.error(err);
      toast.error("Error saving");
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  /* ================= UI ================= */

  return (
    <>
      <Card className="space-y-6">
        <Text variant="h1">Add Birthday Canva</Text>

        {/* SEARCH */}
        <FormField label="Search User">
          <Input
            placeholder="Search user..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedUser("");
            }}
          />

          {/* SEARCH LIST */}
          {search && (
            <div className="mt-2 border rounded-lg bg-white max-h-40 overflow-y-auto shadow">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.value}
                    onClick={() => {
                      setSelectedUser(user.value);
                      setSearch(user.label);
                    }}
                    className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                  >
                    {user.label} ({user.value})
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-slate-400">
                  No users found
                </div>
              )}
            </div>
          )}
        </FormField>

        {/* USER PREVIEW */}
        {selectedUserData && (
          <div className="bg-slate-50 p-4 rounded-xl flex gap-4">
            {hasValidPhoto ? (
              <img
                src={selectedUserData.photoURL}
                className="h-14 w-14 rounded-full"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-slate-200 flex items-center justify-center">
                {getInitials(selectedUserData.label)}
              </div>
            )}

            <div>
              <Text variant="h3">{selectedUserData.label}</Text>
              <Text variant="muted">{selectedUserData.value}</Text>
            </div>
          </div>
        )}

        {/* DOB */}
        <FormField label="Date of Birth">
          <div className="bg-slate-100 px-3 py-2 rounded">
            {dob || "No DOB"}
          </div>
        </FormField>

        {/* DOB INFO */}
        {dobInfo && !isNaN(dobInfo.age) && (
          <div className="flex items-center gap-2 text-slate-500">
            <Cake size={16} />
            <Text variant="muted">
              Turns <strong>{dobInfo.age}</strong> on {dobInfo.day}
            </Text>
          </div>
        )}

        {/* IMAGE */}
        <Input
          type="file"
          onChange={(e) => setImage(e.target.files?.[0])}
        />

        {/* SAVE */}
        <Button
          loading={saving}
          disabled={!selectedUser || !dob || existing}
          onClick={() => setShowConfirm(true)}
        >
          Save
        </Button>
      </Card>

      <ConfirmModal
        open={showConfirm}
        onConfirm={handleSave}
        onClose={() => setShowConfirm(false)}
      />
    </>
  );
}