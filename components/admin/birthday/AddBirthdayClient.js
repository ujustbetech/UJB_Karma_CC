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

import { Cake } from "lucide-react";

export default function AddBirthdayClient() {
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [dob, setDob] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [existing, setExisting] = useState(false);
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

  /* ================= AUTO SELECT USER ================= */

  useEffect(() => {
    const exactMatch = users.find(
      (u) => u.label.toLowerCase() === search.toLowerCase()
    );

    if (exactMatch) {
      setSelectedUser(exactMatch.value);
    }
  }, [search, users]);

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

  /* ================= DUPLICATE CHECK ================= */

  useEffect(() => {
    if (!selectedUser) return;

    getDoc(doc(db, COLLECTIONS.birthdayCanva, selectedUser)).then((snap) => {
      setExisting(snap.exists());
    });
  }, [selectedUser]);

  /* ================= DOB INFO ================= */

  const dobInfo = dob
    ? (() => {
        let birthDate;

        if (dob.includes("/")) {
          const [day, month, year] = dob.split("/");
          birthDate = new Date(`${year}-${month}-${day}`);
        } else {
          birthDate = new Date(dob);
        }

        if (isNaN(birthDate.getTime())) return null;

        const today = new Date();

        let nextBirthday = new Date(
          today.getFullYear(),
          birthDate.getMonth(),
          birthDate.getDate()
        );

        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        const age = nextBirthday.getFullYear() - birthDate.getFullYear();

        const day = nextBirthday.toLocaleDateString("en-US", {
          weekday: "long",
        });

        return { age, day };
      })()
    : null;

  /* ================= FILE HANDLER ================= */

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!selectedUser || !dob) {
      toast.error("Missing fields");
      return;
    }

    setSaving(true);

    try {
      let imageUrl = "";

      if (image) {
        const imageRef = ref(
          storage,
          `birthdayImages/${selectedUser}/${Date.now()}_${image.name}`
        );

        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      let dobDate;
      if (dob.includes("/")) {
        const [day, month, year] = dob.split("/");
        dobDate = new Date(`${year}-${month}-${day}`);
      } else {
        dobDate = new Date(dob);
      }

      await setDoc(doc(db, COLLECTIONS.birthdayCanva, selectedUser), {
        name: selectedUserData.label,
        phone: selectedUserData.value,
        email: selectedUserData.email,
        dob,
        dobTimestamp: dobDate,
        imageUrl,
        registeredAt: serverTimestamp(),
      });

      toast.success("Saved successfully 🎉");

      setSearch("");
      setSelectedUser("");
      setDob("");
      setImage(null);
      setPreview("");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed ❌");
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
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Search user..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedUser("");
            }}
          />

          {search && (
            <div className="mt-2 border rounded bg-white max-h-40 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.value}
                  onClick={() => {
                    setSelectedUser(user.value);
                    setSearch(user.label);
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {user.label} ({user.value})
                </div>
              ))}
            </div>
          )}
        </FormField>

        {/* USER */}
        {selectedUserData && (
          <div className="flex gap-3 items-center bg-gray-100 p-3 rounded">
            <img
              src={selectedUserData.photoURL || "/default.png"}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <Text variant="h3">{selectedUserData.label}</Text>
              <Text variant="muted">{selectedUserData.value}</Text>
            </div>
          </div>
        )}

        {/* DOB */}
        <FormField label="Date of Birth">
          <div className="bg-gray-100 p-2 rounded">{dob || "No DOB"}</div>
        </FormField>

        {/* DOB INFO */}
        {dobInfo && (
          <div className="flex gap-2 text-gray-500">
            <Cake size={16} />
            Turns {dobInfo.age} on {dobInfo.day}
          </div>
        )}

        {/* FILE */}
        <input type="file" accept="image/*" onChange={handleFileChange} />

        {/* PREVIEW */}
        {preview && (
          <img
            src={preview}
            className="w-32 h-32 object-cover rounded border"
          />
        )}

        {/* SAVE BUTTON (FIXED UX) */}
        <Button
          loading={saving}
          disabled={!selectedUser || !dob || existing}
          onClick={() => setShowConfirm(true)}
        >
          {!selectedUser
            ? "Select user"
            : !dob
            ? "DOB missing"
            : existing
            ? "Already exists"
            : "Save"}
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