"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";

export default function AddAdminPage() {

  const router = useRouter();
  const toast = useToast();
  const firstErrorRef = useRef(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [adminUser, setAdminUser] = useState({
    name: "",
    email: "",
    role: "",
    designation: ""
  });

  const [errors, setErrors] = useState({});

  // 🔴 LOGIN + ROLE CHECK
  useEffect(() => {

    const admin = JSON.parse(sessionStorage.getItem("AdminData"));

    if (!admin) {
      router.replace("/");
      return;
    }

    // if (admin.role !== "Super") {
    //   toast.error("Only Super Admin Allowed ❌");
    //   router.replace("/admin/orbiters");
    //   return;
    // }

  }, []);

  const validate = () => {

    const e = {};

    if (!adminUser.name.trim()) e.name = "Name required";
    if (!adminUser.email.trim()) e.email = "Email required";
    if (!adminUser.role) e.role = "Select role";
    if (!adminUser.designation.trim()) e.designation = "Designation required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openConfirm = (e) => {
    e.preventDefault();

    if (!validate()) {
      firstErrorRef.current?.focus();
      return;
    }

    setConfirmOpen(true);
  };

  const handleSave = async () => {

    setSubmitting(true);

    try {

      await addDoc(collection(db, "AdminUsers"), {
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        designation: adminUser.designation,
        createdAt: Timestamp.now()
      });

      toast.success("Admin Added Successfully ✅");

      setAdminUser({
        name: "",
        email: "",
        role: "",
        designation: ""
      });

    } catch {
      toast.error("Failed to add admin ❌");
    }

    setSubmitting(false);
    setConfirmOpen(false);
  };

  return (
    <>

      <Text variant="h1">Add Admin</Text>

      <Card>
        <form onSubmit={openConfirm} className="space-y-6">

          <Text variant="h3">Admin Information</Text>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <FormField label="Admin Name" error={errors.name} required>
              <Input
                ref={!adminUser.name ? firstErrorRef : null}
                value={adminUser.name}
                onChange={(e) => {
                  setErrors(p => ({ ...p, name: "" }));
                  setAdminUser({ ...adminUser, name: e.target.value });
                }}
              />
            </FormField>

            <FormField label="Email" error={errors.email} required>
              <Input
                value={adminUser.email}
                onChange={(e) => {
                  setErrors(p => ({ ...p, email: "" }));
                  setAdminUser({ ...adminUser, email: e.target.value });
                }}
              />
            </FormField>

            <FormField label="Role" error={errors.role} required>
              <Select
                value={adminUser.role}
                onChange={(v) => {
                  setErrors(p => ({ ...p, role: "" }));
                  setAdminUser({ ...adminUser, role: v });
                }}
                options={[
                  { label: "Admin", value: "Admin" },
                  { label: "Super", value: "Super" }
                ]}
              />
            </FormField>

            <FormField label="Designation" error={errors.designation} required>
              <Input
                value={adminUser.designation}
                onChange={(e) => {
                  setErrors(p => ({ ...p, designation: "" }));
                  setAdminUser({ ...adminUser, designation: e.target.value });
                }}
              />
            </FormField>

          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" disabled={submitting}>
              Add Admin
            </Button>
          </div>

        </form>
      </Card>

      <ConfirmModal
        open={confirmOpen}
        title="Add Admin"
        description="Are you sure you want to add this admin?"
        onConfirm={handleSave}
        onClose={() => setConfirmOpen(false)}
      />

    </>
  );
}