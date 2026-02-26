"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, FileText } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

export default function EditAchievementSheet({
  open,
  setOpen,
  user,
  setUser,
  ujbCode // ✅ from parent
}) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* ---------------- Load Existing ---------------- */

  useEffect(() => {
    const existing = Array.isArray(user?.achievementCertificates)
      ? user.achievementCertificates
      : [];

    setCertificates(existing);
  }, [user]);

  /* ---------------- Upload Certificate ---------------- */

  const uploadCertificate = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !ujbCode) return;

      setUploading(true);

      const storageRef = ref(
        storage,
        `UserAssets/${new Date().getFullYear()}/${ujbCode}/Achievements/${Date.now()}-${file.name}`
      );

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setCertificates((prev) => [
        ...prev,
        {
          fileName: file.name,
          url: url + "?t=" + Date.now(),
        },
      ]);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- Remove ---------------- */

  const removeCertificate = (index) => {
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  /* ---------------- Save ---------------- */

  const handleSave = async () => {
    try {
      if (!ujbCode) return;

      setLoading(true);

      await updateDoc(
        doc(db, COLLECTIONS.userDetail, ujbCode),
        { achievementCertificates: certificates }
      );

      if (typeof setUser === "function") {
        setUser((prev) => ({
          ...prev,
          achievementCertificates: certificates,
        }));
      }

      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-90 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-99
        max-h-[90vh] flex flex-col transform transition-transform duration-300 ease-out
        ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />

        <div className="px-6 py-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-semibold text-lg">Edit Achievements</h3>
          <button onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <label className="w-full bg-orange-100 text-orange-600 py-3 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer">
            <Plus size={16} />
            {uploading ? "Uploading..." : "Upload Certificate"}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={uploadCertificate}
              className="hidden"
            />
          </label>

          {certificates.length > 0 ? (
            <div className="space-y-4">
              {certificates.map((item, index) => {
                const isImage = item?.url?.match(/\.(jpg|jpeg|png|webp)/i);

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      {isImage ? (
                        <img
                          src={item.url}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <FileText size={20} className="text-gray-500" />
                      )}

                      <p className="text-sm font-medium text-gray-700 truncate max-w-[180px]">
                        {item.fileName || `Certificate ${index + 1}`}
                      </p>
                    </div>

                    <button
                      onClick={() => removeCertificate(index)}
                      className="text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              No certificates uploaded yet.
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-white sticky bottom-0">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}