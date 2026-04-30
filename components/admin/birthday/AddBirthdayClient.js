"use client";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import FormField from "@/components/ui/FormField";
import { useBirthdayCanvaForm } from "@/hooks/useBirthdayCanvaForm";
import { Cake } from "lucide-react";

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
        <Text variant="h1">Add Birthday Canva</Text>

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

        <FormField label="Date of Birth">
          <div className="bg-gray-100 p-2 rounded">{dob || "No DOB"}</div>
        </FormField>

        {dobInfo && (
          <div className="flex gap-2 text-gray-500">
            <Cake size={16} />
            Turns {dobInfo.age} on {dobInfo.day}
          </div>
        )}

        <input type="file" accept="image/*" onChange={handleFileChange} />

        {preview && (
          <img
            src={preview}
            className="w-32 h-32 object-cover rounded border"
          />
        )}

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


