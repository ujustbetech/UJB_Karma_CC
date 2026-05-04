"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactSelect from "react-select";
import {
  createAdminConclave,
  fetchAdminConclaveUsers,
} from "@/services/adminConclaveService";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";

export default function CreateConclavePage() {
  const router = useRouter();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    conclaveStream: "",
    startDate: "",
    initiationDate: "",
    leader: "",
    ntMembers: [],
    orbiters: [],
    leaderRole: "",
    ntRoles: "",
  });

  const [tempNt, setTempNt] = useState("");
  const [tempOrbiter, setTempOrbiter] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const list = await fetchAdminConclaveUsers();
        setUsers(list);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load users");
      }
    };

    fetchUsers();
  }, [toast]);

  const handleChange = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const addToList = (field, value, errorField) => {
    if (!value) {
      setErrors((previous) => ({
        ...previous,
        [errorField]: `Select a ${field === "ntMembers" ? "NT member" : "orbiter"} first`,
      }));
      return;
    }

    setForm((previous) => ({
      ...previous,
      [field]: previous[field].includes(value)
        ? previous[field]
        : [...previous[field], value],
    }));
    setErrors((previous) => ({ ...previous, [errorField]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.conclaveStream.trim()) nextErrors.conclaveStream = "Conclave name is required";
    if (!form.startDate) nextErrors.startDate = "Start date is required";
    if (!form.initiationDate) nextErrors.initiationDate = "Initiation date is required";
    if (!form.leader) nextErrors.leader = "Leader is required";
    if (!form.ntMembers.length) nextErrors.ntMembers = "Add at least one NT member";
    if (!form.orbiters.length) nextErrors.orbiters = "Add at least one orbiter";
    if (!form.leaderRole.trim()) nextErrors.leaderRole = "Leader role is required";
    if (!form.ntRoles.trim()) nextErrors.ntRoles = "NT roles are required";

    const startTS = form.startDate ? new Date(form.startDate) : null;
    const initTS = form.initiationDate ? new Date(form.initiationDate) : null;

    if (startTS && Number.isNaN(startTS.getTime())) {
      nextErrors.startDate = "Please select a valid start date";
    }
    if (initTS && Number.isNaN(initTS.getTime())) {
      nextErrors.initiationDate = "Please select a valid initiation date";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      toast.error("Please complete the required fields");
      return;
    }

    setLoading(true);

    try {
      const getPhoneForUser = (id) => users.find((user) => user.value === id)?.phone || "";

      const finalForm = {
        ...form,
        leader: getPhoneForUser(form.leader),
        ntMembers: form.ntMembers.map(getPhoneForUser).filter(Boolean),
        orbiters: form.orbiters.map(getPhoneForUser).filter(Boolean),
      };

      await createAdminConclave(finalForm);

      toast.success("Conclave created successfully");
      router.push("/admin/conclave/list");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create conclave");
    } finally {
      setLoading(false);
    }
  };

  const renderChip = (id, field, bgClass) => {
    const user = users.find((item) => item.value === id);
    return (
      <div
        key={id}
        className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${bgClass}`}
      >
        {user?.label}
        <button
          type="button"
          className="text-red-500"
          onClick={() =>
            setForm((previous) => ({
              ...previous,
              [field]: previous[field].filter((memberId) => memberId !== id),
            }))
          }
        >
          x
        </button>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField label="Conclave Name & Stream" required error={errors.conclaveStream}>
          <Input
            value={form.conclaveStream}
            onChange={(event) => handleChange("conclaveStream", event.target.value)}
            error={!!errors.conclaveStream}
          />
        </FormField>

        <FormField label="Start Date" required error={errors.startDate}>
          <input
            type="datetime-local"
            className={`w-full rounded p-2 ${errors.startDate ? "border border-red-500" : "border"}`}
            value={form.startDate}
            onChange={(event) => handleChange("startDate", event.target.value)}
          />
        </FormField>

        <FormField label="Initiation Date" required error={errors.initiationDate}>
          <input
            type="datetime-local"
            className={`w-full rounded p-2 ${errors.initiationDate ? "border border-red-500" : "border"}`}
            value={form.initiationDate}
            onChange={(event) => handleChange("initiationDate", event.target.value)}
          />
        </FormField>

        <FormField label="Leader" required error={errors.leader}>
          <ReactSelect
            options={users}
            value={users.find((user) => user.value === form.leader) || null}
            onChange={(selected) => handleChange("leader", selected?.value || "")}
          />
        </FormField>

        <FormField label="NT Members" required error={errors.ntMembers}>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <ReactSelect
                  options={users}
                  value={users.find((user) => user.value === tempNt) || null}
                  onChange={(selected) => setTempNt(selected?.value || "")}
                  placeholder="Select NT Member..."
                />
              </div>
              <Button
                type="button"
                variant={tempNt ? "primary" : "secondary"}
                disabled={!tempNt}
                className={!tempNt ? "opacity-50 cursor-not-allowed" : ""}
                onClick={() => {
                  addToList("ntMembers", tempNt, "ntMembers");
                  setTempNt("");
                }}
              >
                Add Member
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.ntMembers.map((id) => renderChip(id, "ntMembers", "bg-blue-100"))}
            </div>
          </div>
        </FormField>

        <FormField label="Orbiters" required error={errors.orbiters}>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <ReactSelect
                  options={users}
                  value={users.find((user) => user.value === tempOrbiter) || null}
                  onChange={(selected) => setTempOrbiter(selected?.value || "")}
                  placeholder="Select Orbiter..."
                />
              </div>
              <Button
                type="button"
                variant={tempOrbiter ? "primary" : "secondary"}
                disabled={!tempOrbiter}
                className={!tempOrbiter ? "opacity-50 cursor-not-allowed" : ""}
                onClick={() => {
                  addToList("orbiters", tempOrbiter, "orbiters");
                  setTempOrbiter("");
                }}
              >
                Add Orbiter
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.orbiters.map((id) => renderChip(id, "orbiters", "bg-green-100"))}
            </div>
          </div>
        </FormField>

        <FormField label="Leader Role" required error={errors.leaderRole}>
          <Textarea
            value={form.leaderRole}
            onChange={(event) => handleChange("leaderRole", event.target.value)}
            error={!!errors.leaderRole}
          />
        </FormField>

        <FormField label="NT Roles" required error={errors.ntRoles}>
          <Textarea
            value={form.ntRoles}
            onChange={(event) => handleChange("ntRoles", event.target.value)}
            error={!!errors.ntRoles}
          />
        </FormField>

        <div className="flex justify-end border-t pt-6">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Conclave"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
