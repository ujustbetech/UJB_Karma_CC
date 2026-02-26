"use client";

import { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EditHeroSheet({ open, setOpen, user, setUser }) {

  const [tagline, setTagline] = useState(user?.TagLine || "");
  const [city, setCity] = useState(user?.City || "");
  const [preview, setPreview] = useState(user?.ProfilePhotoURL);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Drag state
  const [dragY, setDragY] = useState(0);
  const [startY, setStartY] = useState(0);

  useEffect(() => {
    if (user) {
      setTagline(user.TagLine || "");
      setCity(user.City || "");
      setPreview(user.ProfilePhotoURL);
    }
  }, [user]);

  /* ---------------- IMAGE UPLOAD ---------------- */

  const handleImageUpload = async (file) => {
    try {
      const storage = getStorage();
      const storedUjbCode = localStorage.getItem("mmUJBCode");

      const storageRef = ref(
        storage,
        `profilePhotos/${storedUjbCode}/${Date.now()}`
      );

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setPreview(downloadURL);

      await updateDoc(
        doc(db, COLLECTIONS.userDetail, storedUjbCode),
        { ProfilePhotoURL: downloadURL }
      );

      // Live preview update
      setUser((prev) => ({
        ...prev,
        ProfilePhotoURL: downloadURL,
      }));

    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------- SAVE TEXT ---------------- */

  const handleSave = async () => {
    try {
      setLoading(true);
      const storedUjbCode = localStorage.getItem("mmUJBCode");

      await updateDoc(
        doc(db, COLLECTIONS.userDetail, storedUjbCode),
        {
          TagLine: tagline,
          City: city,
        }
      );

      setUser((prev) => ({
        ...prev,
        TagLine: tagline,
        City: city,
      }));

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
      }, 1200);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DRAG HANDLERS ---------------- */

  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    const move = e.touches[0].clientY - startY;
    if (move > 0) setDragY(move);
  };

  const handleTouchEnd = () => {
    if (dragY > 120) setOpen(false);
    setDragY(0);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-90 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Bottom Sheet */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${dragY}px)` }}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-99 p-6 transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-semibold text-lg">
            Edit Basic Profile
          </h3>
          <button onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Image Preview */}
        {preview && (
          <div className="flex justify-center mb-4">
            <img
              src={preview}
              className="w-24 h-24 rounded-full object-cover border"
              alt="preview"
            />
          </div>
        )}

        {/* Upload */}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="profileUpload"
          onChange={(e) =>
            e.target.files && handleImageUpload(e.target.files[0])
          }
        />

        <label
          htmlFor="profileUpload"
          className="flex items-center gap-3 border border-gray-300 rounded-xl p-3 cursor-pointer text-sm mb-6"
        >
          <Upload size={18} />
          Upload new photo
        </label>

        {/* Tagline Input */}
        <div className="mb-4">
          <label className="text-sm text-gray-500">
            Tagline
          </label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* City Input */}
        <div className="mb-6">
          <label className="text-sm text-gray-500">
            City
          </label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium transition active:scale-95"
        >
          {success ? "✓ Saved!" : loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </>
  );
}