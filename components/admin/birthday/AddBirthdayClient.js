"use client";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import FormField from "@/components/ui/FormField";
import { useBirthdayCanvaForm } from "@/hooks/useBirthdayCanvaForm";
import { Cake, Upload, Image as ImageIcon } from "lucide-react";

export default function AddBirthdayClient() {
  const toast = useToast();
  const {
    dob,
    dobInfo,
    existing,
    filteredUsers,
    handleFileChange,
    handleSave,
    preview,
    saving,
    search,
    selectedUser,
    selectedUserData,
    setSearch,
    setSelectedUser,
    setShowConfirm,
    showConfirm,
  } = useBirthdayCanvaForm(toast);

  return (
    <>
      <Card className="space-y-6">
        <Text variant="h1">Add Birthday Creative</Text>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 items-start">
          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 font-bold text-xs">i</div>
          <p className="text-sm text-blue-700 leading-relaxed">
            This creative will be saved as <span className="font-bold">Pending Approval</span>. It will only appear on the Dashboard once approved by an admin.
          </p>
        </div>

        <FormField label="Search User">
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Search user by name"
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

        {selectedUserData && (
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-1">
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white shadow-sm bg-white shrink-0">
              {selectedUserData.photoURL ? (
                <img
                  src={selectedUserData.photoURL}
                  alt={selectedUserData.label}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xl font-bold text-slate-300">
                  {selectedUserData.label.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold text-slate-900">{selectedUserData.label}</div>
              <div className="text-sm font-medium text-slate-500">{selectedUserData.value}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                  Member
                </span>
                {selectedUserData.email && (
                  <span className="text-xs text-slate-400 truncate max-w-[150px]">
                    {selectedUserData.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <FormField label="Date of Birth">
          <div className="bg-gray-100 p-2 rounded">{dob || "No DOB"}</div>
        </FormField>

        {dobInfo && (
          <div className="flex gap-2 text-gray-500">
            <Cake size={16} />
            Turns {dobInfo.age} on {dobInfo.day}
          </div>
        )}

        <FormField label="Birthday Image" required>
          <label className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl transition-all ${
            !selectedUser 
              ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed grayscale" 
              : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400 cursor-pointer group"
          }`}>
            <input 
              type="file" 
              accept="image/*" 
              className={`absolute inset-0 w-full h-full opacity-0 ${!selectedUser ? "cursor-not-allowed" : "cursor-pointer"}`}
              onChange={handleFileChange} 
              disabled={!selectedUser}
            />
            
            {!selectedUser ? (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <ImageIcon size={24} />
                <div className="text-sm font-medium">Select a user to upload image</div>
              </div>
            ) : preview ? (
              <div className="relative w-full h-full p-2">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <div className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-2">
                    <Upload size={14} />
                    Change Image
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-blue-600 transition-colors">
                <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                  <ImageIcon size={24} />
                </div>
                <div className="text-sm font-semibold">Click or Drag to Upload</div>
                <div className="text-xs">PNG, JPG, JPEG (Max 5MB)</div>
              </div>
            )}
          </label>
        </FormField>

        <Button
          loading={saving}
          disabled={!selectedUser || !dob || existing}
          onClick={() => setShowConfirm(true)}
        >
          {!selectedUser
            ? "Select a user"
            : !dob
              ? "Date of birth missing"
              : existing
                ? "Creative already exists"
                : "Save Birthday Creative"}
        </Button>
      </Card>

      <ConfirmModal
        open={showConfirm}
        onConfirm={handleSave}
        onClose={() => setShowConfirm(false)}
        title="Save birthday creative?"
        description="This will create the birthday entry for the selected user."
      />
    </>
  );
}


