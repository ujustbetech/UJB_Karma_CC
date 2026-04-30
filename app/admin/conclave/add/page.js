"use client";

import { useEffect, useState } from "react";
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
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    conclaveStream: "",
    startDate: null,
    initiationDate: null,
    leader: "",
    ntMembers: [],
    orbiters: [],
    leaderRole: "",
    ntRoles: "",
  });

  const [tempNt, setTempNt] = useState("");
  const [tempOrbiter, setTempOrbiter] = useState("");
  const [errors, setErrors] = useState({});

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
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const addToList = (field, value) => {
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field]
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startTS = form.startDate ? new Date(form.startDate) : null;
      const initTS = form.initiationDate ? new Date(form.initiationDate) : null;

      if (!startTS || !initTS || Number.isNaN(startTS.getTime()) || Number.isNaN(initTS.getTime())) {
        toast.error("Please select valid Date & Time");
        setLoading(false);
        return;
      }

      const getPhoneForUser = (id) => users.find((user) => user.value === id)?.phone || "";
      const finalForm = {
        ...form,
        startDate: form.startDate,
        initiationDate: form.initiationDate,
        leader: getPhoneForUser(form.leader),
        ntMembers: form.ntMembers.map(getPhoneForUser).filter(Boolean),
        orbiters: form.orbiters.map(getPhoneForUser).filter(Boolean),
      };

      await createAdminConclave(finalForm);

      toast.success("Conclave created successfully");
    } catch (err) {
      console.log(err);
      toast.error("Failed to create conclave");
    }

    setLoading(false);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6 pt-6">
        <FormField label="Conclave Name & Stream" required>
          <Input
            value={form.conclaveStream}
            onChange={(e) =>
              handleChange("conclaveStream", e.target.value)
            }
          />
        </FormField>

        <div>
          <label className="block mb-1 text-sm font-medium">
            Start Date *
          </label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2"
            value={form.startDate || ""}
            onChange={(e) =>
              handleChange("startDate", e.target.value)
            }
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">
            Initiation Date *
          </label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2"
            value={form.initiationDate || ""}
            onChange={(e) =>
              handleChange("initiationDate", e.target.value)
            }
          />
        </div>

        {/* Leader */}
        <FormField label="Leader" required>
          <ReactSelect
            options={users}
            value={users.find((u) => u.value === form.leader) || null}
            onChange={(selected) =>
              handleChange("leader", selected?.value)
            }
          />
        </FormField>

        {/* NT MEMBERS */}
        <FormField label="NT Members" required>
          <>
            <ReactSelect
              options={users}
              value={users.find((u) => u.value === tempNt) || null}
              onChange={(selected) =>
                setTempNt(selected?.value)
              }
            />

            <Button
              type="button"
              onClick={() => {
                addToList("ntMembers", tempNt);
                setTempNt("");
              }}
            >
              Add NT Member
            </Button>

            <div className="flex flex-wrap gap-2 mt-2">
              {form.ntMembers.map((id) => {
                const user = users.find((u) => u.value === id);
                return (
                  <div
                    key={id}
                    className="px-3 py-1 bg-blue-100 rounded-full text-sm flex items-center gap-2"
                  >
                    {user?.label}
                    <span
                      className="cursor-pointer text-red-500"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          ntMembers: prev.ntMembers.filter(
                            (m) => m !== id
                          ),
                        }))
                      }
                    >
                      ✕
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        </FormField>

        {/* ORBITERS */}
        <FormField label="Orbiters" required>
          <>
            <ReactSelect
              options={users}
              value={
                users.find((u) => u.value === tempOrbiter) || null
              }
              onChange={(selected) =>
                setTempOrbiter(selected?.value)
              }
            />

            <Button
              type="button"
              onClick={() => {
                addToList("orbiters", tempOrbiter);
                setTempOrbiter("");
              }}
            >
              Add Orbiter
            </Button>

            <div className="flex flex-wrap gap-2 mt-2">
              {form.orbiters.map((id) => {
                const user = users.find((u) => u.value === id);
                return (
                  <div
                    key={id}
                    className="px-3 py-1 bg-green-100 rounded-full text-sm flex items-center gap-2"
                  >
                    {user?.label}
                    <span
                      className="cursor-pointer text-red-500"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          orbiters: prev.orbiters.filter(
                            (m) => m !== id
                          ),
                        }))
                      }
                    >
                      ✕
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        </FormField>

        <FormField label="Leader Role" required>
          <Textarea
            value={form.leaderRole}
            onChange={(e) =>
              handleChange("leaderRole", e.target.value)
            }
          />
        </FormField>

        <FormField label="NT Roles" required>
          <Textarea
            value={form.ntRoles}
            onChange={(e) =>
              handleChange("ntRoles", e.target.value)
            }
          />
        </FormField>

        <div className="flex justify-end pt-6 border-t">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Conclave"}
          </Button>
        </div>
      </form>
    </Card>
  );
}


