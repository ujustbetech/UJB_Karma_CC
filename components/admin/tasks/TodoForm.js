"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DateInput from "@/components/ui/DateInput";
import FilePreview from "@/components/ui/FilePreview";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Text from "@/components/ui/Text";
import { useToast } from "@/components/ui/ToastProvider";
import {
  TODO_PURPOSE_OPTIONS,
  TODO_USER_TYPE_OPTIONS,
} from "@/lib/todo/constants";

const KNOWN_PURPOSE_VALUES = new Set(
  TODO_PURPOSE_OPTIONS.map((option) => option.value).filter(Boolean)
);

function buildFormState(todo) {
  const rawPurpose = todo?.purpose || "";
  const hasCustomPurpose = rawPurpose && !KNOWN_PURPOSE_VALUES.has(rawPurpose);

  return {
    user_type: todo?.user_type || "",
    prospect_id: todo?.prospect_id || "",
    orbitor_id: todo?.orbitor_id || "",
    purpose: hasCustomPurpose ? "Other" : rawPurpose,
    custom_purpose: hasCustomPurpose ? rawPurpose : "",
    follow_up_date: todo?.follow_up_date || "",
    discussion_details: todo?.discussion_details || "",
    start_time: todo?.start_time || "",
    completion_date: todo?.completion_date || "",
    completion_time:
      todo?.completion_time === null || typeof todo?.completion_time === "undefined"
        ? ""
        : String(todo.completion_time),
  };
}

export default function TodoForm({ todo = null, mode = "create" }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [prospects, setProspects] = useState([]);
  const [orbitors, setOrbitors] = useState([]);
  const [docs, setDocs] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFile, setDocFile] = useState(null);

  const [form, setForm] = useState(buildFormState(todo));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(buildFormState(todo));
  }, [todo]);

  useEffect(() => {
    let mounted = true;

    const loadOptions = async () => {
      try {
        const [prospectRes, orbiterRes] = await Promise.all([
          fetch("/api/admin/prospects?status=Active", { credentials: "include" }),
          fetch("/api/admin/orbiters?view=full", { credentials: "include" }),
        ]);

        const prospectData = await prospectRes.json().catch(() => ({}));
        const orbiterData = await orbiterRes.json().catch(() => ({}));

        if (!prospectRes.ok) {
          throw new Error(prospectData.message || "Failed to load prospects");
        }

        if (!orbiterRes.ok) {
          throw new Error(orbiterData.message || "Failed to load orbitors");
        }

        if (!mounted) return;

        setProspects(Array.isArray(prospectData.prospects) ? prospectData.prospects : []);
        setOrbitors(Array.isArray(orbiterData.users) ? orbiterData.users : []);
      } catch (error) {
        toast.error(error.message || "Failed to load TODO options");
      } finally {
        if (mounted) {
          setOptionsLoading(false);
        }
      }
    };

    loadOptions();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const loadDocs = async () => {
    if (!todo?.id) return;

    try {
      const res = await fetch(`/api/admin/todos/${todo.id}/docs`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to load docs");
      }

      setDocs(Array.isArray(data.docs) ? data.docs : []);
    } catch (error) {
      toast.error(error.message || "Failed to load docs");
    }
  };

  useEffect(() => {
    if (isEdit) {
      loadDocs();
    }
  }, [isEdit, todo?.id]);

  const selectedProspect = useMemo(
    () => prospects.find((item) => item.id === form.prospect_id) || null,
    [prospects, form.prospect_id]
  );

  const selectedOrbitor = useMemo(
    () =>
      orbitors.find((item) => (item.id || item.UJBCode || item.ujbCode) === form.orbitor_id) ||
      null,
    [orbitors, form.orbitor_id]
  );

  const resolvedOpsName =
    form.user_type === "prospect"
      ? selectedProspect?.assignedOpsName || ""
      : selectedOrbitor?.assignedOpsName || "";

  const linkedTypeOptions = TODO_USER_TYPE_OPTIONS;
  const prospectOptions = [
    { label: "Select prospect", value: "" },
    ...prospects.map((prospect) => ({
      label: `${prospect.prospectName || "Prospect"}${prospect.assignedOpsName ? ` · OPS: ${prospect.assignedOpsName}` : ""}`,
      value: prospect.id,
    })),
  ];
  const orbitorOptions = [
    { label: "Select orbitor", value: "" },
    ...orbitors.map((orbitor) => ({
      label: `${orbitor.Name || orbitor.name || orbitor.UJBCode || orbitor.id} · ${orbitor.UJBCode || orbitor.id || ""}`,
      value: orbitor.id || orbitor.UJBCode || orbitor.ujbCode,
    })),
  ];

  const validate = () => {
    const nextErrors = {};

    if (!form.user_type) {
      nextErrors.user_type = "Linked type is required";
    }

    if (form.user_type === "prospect" && !form.prospect_id) {
      nextErrors.prospect_id = "Prospect is required";
    }

    if (form.user_type === "orbitor" && !form.orbitor_id) {
      nextErrors.orbitor_id = "Orbitor is required";
    }

    if (!form.purpose) {
      nextErrors.purpose = "Purpose is required";
    }

    if (form.purpose === "Other" && !String(form.custom_purpose || "").trim()) {
      nextErrors.custom_purpose = "Custom purpose is required";
    }

    if (!form.follow_up_date) {
      nextErrors.follow_up_date = "Follow-up date is required";
    }

    if (form.completion_date && !form.start_time) {
      nextErrors.start_time = "Start time is required when completion date is set";
    }

    if (
      form.start_time &&
      form.completion_date &&
      new Date(form.completion_date).getTime() < new Date(form.start_time).getTime()
    ) {
      nextErrors.completion_date = "Completion date cannot be earlier than start time";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please correct the highlighted fields");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        purpose:
          form.purpose === "Other"
            ? String(form.custom_purpose || "").trim()
            : form.purpose,
        prospect_id: form.user_type === "prospect" ? form.prospect_id : "",
        orbitor_id: form.user_type === "orbitor" ? form.orbitor_id : "",
      };

      const endpoint = isEdit ? `/api/admin/todos/${todo.id}` : "/api/admin/todos";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to save TODO");
      }

      toast.success(isEdit ? "TODO updated" : "TODO created");

      if (isEdit) {
        setForm({
          user_type: data.todo?.user_type || form.user_type,
          prospect_id: data.todo?.prospect_id || "",
          orbitor_id: data.todo?.orbitor_id || "",
          ...buildFormState(data.todo),
        });
        router.refresh();
        return;
      }

      router.push("/admin/tasks");
    } catch (error) {
      toast.error(error.message || "Failed to save TODO");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDoc = async () => {
    if (!todo?.id || !docFile) return;

    setUploadingDoc(true);

    try {
      const formData = new FormData();
      formData.append("file", docFile);

      const res = await fetch(`/api/admin/todos/${todo.id}/docs`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to upload doc");
      }

      setDocFile(null);
      toast.success("Document uploaded");
      await loadDocs();
    } catch (error) {
      toast.error(error.message || "Failed to upload doc");
    } finally {
      setUploadingDoc(false);
    }
  };

  if (optionsLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-5">
          <FormField label="Linked Type" required error={errors.user_type}>
            <Select
              value={form.user_type}
              onChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  user_type: value,
                  prospect_id: "",
                  orbitor_id: "",
                }));
                setErrors((prev) => ({
                  ...prev,
                  user_type: "",
                  prospect_id: "",
                  orbitor_id: "",
                }));
              }}
              options={linkedTypeOptions}
            />
          </FormField>

          {form.user_type === "prospect" && (
            <FormField label="Prospect" required error={errors.prospect_id}>
              <Select
                value={form.prospect_id}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, prospect_id: value }));
                  setErrors((prev) => ({ ...prev, prospect_id: "" }));
                }}
                options={prospectOptions}
              />
            </FormField>
          )}

          {form.user_type === "orbitor" && (
            <FormField label="Orbitor" required error={errors.orbitor_id}>
              <Select
                value={form.orbitor_id}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, orbitor_id: value }));
                  setErrors((prev) => ({ ...prev, orbitor_id: "" }));
                }}
                options={orbitorOptions}
              />
            </FormField>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Resolved OPS Owner">
              <Input value={resolvedOpsName} disabled />
            </FormField>

            <FormField label="Follow-up Date" required error={errors.follow_up_date}>
              <DateInput
                type="date"
                value={form.follow_up_date}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    follow_up_date: event.target.value,
                  }));
                  setErrors((prev) => ({ ...prev, follow_up_date: "" }));
                }}
              />
            </FormField>
          </div>

          <FormField label="Purpose" required error={errors.purpose}>
            <Select
              value={form.purpose}
              onChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  purpose: value,
                  custom_purpose: value === "Other" ? prev.custom_purpose : "",
                }));
                setErrors((prev) => ({
                  ...prev,
                  purpose: "",
                  custom_purpose: "",
                }));
              }}
              options={TODO_PURPOSE_OPTIONS}
            />
          </FormField>

          {form.purpose === "Other" && (
            <FormField
              label="Custom Purpose"
              required
              error={errors.custom_purpose}
            >
              <Input
                value={form.custom_purpose}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    custom_purpose: event.target.value,
                  }));
                  setErrors((prev) => ({ ...prev, custom_purpose: "" }));
                }}
                placeholder="Enter custom purpose"
              />
            </FormField>
          )}

          <FormField label="Discussion Details">
            <Textarea
              value={form.discussion_details}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  discussion_details: event.target.value,
                }))
              }
              rows={5}
            />
          </FormField>

          {isEdit && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Start Time" error={errors.start_time}>
                <Input
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(event) => {
                    setForm((prev) => ({
                      ...prev,
                      start_time: event.target.value,
                    }));
                    setErrors((prev) => ({ ...prev, start_time: "" }));
                  }}
                />
              </FormField>

              <FormField label="Completion Time" error={errors.completion_date}>
                <Input
                  type="datetime-local"
                  value={form.completion_date}
                  onChange={(event) => {
                    setForm((prev) => ({
                      ...prev,
                      completion_date: event.target.value,
                    }));
                    setErrors((prev) => ({ ...prev, completion_date: "" }));
                  }}
                />
              </FormField>

              <FormField label="Total Minutes">
                <Input
                  type="number"
                  min="0"
                  value={form.completion_time}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      completion_time: event.target.value,
                    }))
                  }
                />
              </FormField>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update TODO" : "Create TODO"}
            </Button>
          </div>
        </div>
      </Card>

      {isEdit && (
        <Card className="p-6">
          <Text variant="h3">Documents</Text>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
            <FormField label="Upload document">
              <Input
                type="file"
                onChange={(event) => setDocFile(event.target.files?.[0] || null)}
              />
            </FormField>

            <Button onClick={handleUploadDoc} disabled={!docFile || uploadingDoc}>
              {uploadingDoc ? "Uploading..." : "Upload"}
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            {docs.length === 0 ? (
              <p className="text-sm text-slate-500">No documents uploaded yet.</p>
            ) : (
              docs.map((doc) => (
                <div key={doc.id} className="rounded-xl border border-slate-200 p-4">
                  <FilePreview file={doc.docs_file} />
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
