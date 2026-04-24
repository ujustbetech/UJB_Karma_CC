"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  KeyRound,
  Link2,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Users,
} from "lucide-react";

import {
  getMergedAdminRoleNames,
  toRoleOptions,
} from "@/lib/admin/adminRoles";

import ActionButton from "@/components/ui/ActionButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Text from "@/components/ui/Text";
import { useToast } from "@/components/ui/ToastProvider";
import { useAdminSession } from "@/hooks/useAdminSession";
import { formatDateTime } from "@/lib/utils/dateFormat";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";

function createEmptyUserForm(defaultRole = "Admin") {
  return {
    name: "",
    email: "",
    role: defaultRole,
    designation: "",
  };
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  const email = normalizeEmail(value);

  if (!email) return false;
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
    return false;
  }
  if (email.includes("..") || email.startsWith(".") || email.endsWith(".")) {
    return false;
  }

  const [, domain = ""] = email.split("@");
  if (!domain || domain.startsWith("-") || domain.endsWith("-")) {
    return false;
  }

  return true;
}

function validateUserForm(userForm, options = {}) {
  const { admins = [], ignoreId = "" } = options;
  const nextErrors = {};

  if (!String(userForm.name || "").trim()) nextErrors.name = "Name required";

  const email = normalizeEmail(userForm.email);

  if (!email) {
    nextErrors.email = "Email required";
  } else if (!isValidEmail(email)) {
    nextErrors.email = "Valid email required";
  } else if (
    admins.some(
      (admin) =>
        admin.id !== ignoreId && normalizeEmail(admin.email) === email
    )
  ) {
    nextErrors.email = "Email already exists";
  }

  if (!String(userForm.role || "").trim()) nextErrors.role = "Select role";
  if (!String(userForm.designation || "").trim()) {
    nextErrors.designation = "Designation required";
  }

  return nextErrors;
}

function toReadableInviteStatus(value) {
  return value === "pending" ? "Pending setup" : "Active";
}

function formatDateValue(value) {
  return formatDateTime(value, "Not available");
}

function toReadableHistoryType(value) {
  switch (value) {
    case "created":
      return "Created";
    case "invite_resent":
      return "Invite Resent";
    case "activated":
      return "Activated";
    case "login":
      return "Signed In";
    case "updated":
      return "Updated";
    default:
      return "Activity";
  }
}

function StatCard({ icon: Icon, value, label, iconClassName = "text-slate-600" }) {
  return (
    <Card className="flex min-h-[96px] items-center gap-4 px-6 py-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50">
        <Icon className={`h-5 w-5 ${iconClassName}`} />
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-semibold leading-none text-slate-900">
          {value}
        </div>
        <div className="text-sm font-medium text-slate-500">
          {label}
        </div>
      </div>
    </Card>
  );
}

function DetailInfoCard({ label, value, status = false }) {
  return (
    <Card className="h-full rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </div>
        {status ? (
          <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
            {value}
          </div>
        ) : (
          <div className="break-words text-sm font-medium leading-6 text-slate-900">
            {value}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ManageUsersPage() {
  const toast = useToast();
  const { admin: currentAdmin } = useAdminSession();

  const [admins, setAdmins] = useState([]);
  const [roleNames, setRoleNames] = useState(getMergedAdminRoleNames());
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newUser, setNewUser] = useState(createEmptyUserForm());
  const [newUserErrors, setNewUserErrors] = useState({});

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const [deleteId, setDeleteId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteTargetName, setInviteTargetName] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  const isSuper = currentAdmin?.role?.trim().toLowerCase() === "super";

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/users", {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load users");
        }

        if (!mounted) {
          return;
        }

        setAdmins(Array.isArray(data.users) ? data.users : []);
        setRoleNames(
          getMergedAdminRoleNames(
            Array.isArray(data.roleNames) ? data.roleNames : []
          )
        );
      } catch (error) {
        toast.error(error.message || "Failed to load users");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!roleNames.includes(newUser.role)) {
      setNewUser((previous) => ({
        ...previous,
        role: roleNames[0] || "",
      }));
    }
  }, [newUser.role, roleNames]);

  const roleOptions = useMemo(() => toRoleOptions(roleNames), [roleNames]);

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const searchableText = `${admin.name || ""} ${admin.email || ""}`.toLowerCase();
      const matchesSearch =
        !search || searchableText.includes(search.toLowerCase());
      const matchesRole = !roleFilter || admin.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [admins, roleFilter, search]);

  const totalSuperAdmins = useMemo(
    () =>
      admins.filter((admin) => admin.role?.trim().toLowerCase() === "super")
        .length,
    [admins]
  );

  const totalActiveAdmins = useMemo(
    () =>
      admins.filter(
        (admin) => String(admin.inviteStatus || "").trim().toLowerCase() === "active"
      ).length,
    [admins]
  );

  const totalInactiveAdmins = useMemo(
    () =>
      admins.filter(
        (admin) => String(admin.inviteStatus || "").trim().toLowerCase() !== "active"
      ).length,
    [admins]
  );

  const resetAddForm = () => {
    setNewUser(createEmptyUserForm(roleNames[0] || "Admin"));
    setNewUserErrors({});
    setShowAddForm(false);
  };

  const handleCopyInvite = async (link = inviteLink) => {
    if (!link) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        toast.success("Invite link copied");
      }
    } catch {
      toast.error("Unable to copy invite link");
    }
  };

  const handleAddUser = async () => {
    if (!isSuper) {
      toast.error("Only Super Admin can invite users");
      return;
    }

    const validationErrors = validateUserForm(newUser, { admins });

    if (Object.keys(validationErrors).length > 0) {
      setNewUserErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: String(newUser.name || "").trim(),
          email: String(newUser.email || "").trim(),
          role: String(newUser.role || "").trim(),
          designation: String(newUser.designation || "").trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to invite user");
      }

      setAdmins((previous) => [...previous, data.user]);
      setInviteLink(data.inviteLink || "");
      setInviteTargetName(data.user?.name || "Invited admin");
      toast.success("Admin invited successfully");
      resetAddForm();
    } catch (error) {
      toast.error(error.message || "Failed to invite user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!isSuper) {
      toast.error("Only Super Admin can update users");
      return;
    }

    const validationErrors = validateUserForm(editData, {
      admins,
      ignoreId: editingId,
    });

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: editingId,
          name: String(editData.name || "").trim(),
          email: String(editData.email || "").trim(),
          role: String(editData.role || "").trim(),
          designation: String(editData.designation || "").trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to update user");
      }

      setAdmins((previous) =>
        previous.map((admin) =>
          admin.id === editingId ? { ...admin, ...data.user } : admin
        )
      );
      setSelectedAdmin((previous) =>
        previous && previous.id === editingId ? { ...previous, ...data.user } : previous
      );

      setEditingId(null);
      setEditData({});
      toast.success("User updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update user");
    }
  };

  const handleResendInvite = async (admin) => {
    if (!isSuper) {
      toast.error("Only Super Admin can resend invite links");
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "resend_invite",
          id: admin.id,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to generate invite link");
      }

      setInviteLink(data.inviteLink || "");
      setInviteTargetName(admin.name || "Admin");
      await handleCopyInvite(data.inviteLink || "");

      setAdmins((previous) =>
        previous.map((item) =>
          item.id === admin.id
            ? {
                ...item,
                inviteStatus: "pending",
                inviteLinkGeneratedAt: new Date().toISOString(),
              }
            : item
        )
      );
      setSelectedAdmin((previous) =>
        previous && previous.id === admin.id
          ? {
              ...previous,
              inviteStatus: "pending",
              inviteLinkGeneratedAt: new Date().toISOString(),
            }
          : previous
      );
    } catch (error) {
      toast.error(error.message || "Failed to generate invite link");
    }
  };

  const openDeleteModal = (id) => {
    if (!isSuper) {
      toast.error("Only Super Admin can delete users");
      return;
    }

    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(deleteId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete user");
      }

      setAdmins((previous) => previous.filter((admin) => admin.id !== deleteId));
      toast.success("User deleted successfully");
    } catch (error) {
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeleteId(null);
      setConfirmOpen(false);
    }
  };

  const columns = [
    { label: "#", key: "index" },
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Role", key: "role" },
    { label: "Designation", key: "designation" },
    { label: "Invite", key: "invite" },
    { label: "Actions", key: "actions" },
  ];

  const openViewModal = (admin) => {
    setSelectedAdmin(admin);
    setViewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          
          <Text variant="muted">
            Invite, authorize, and manage user access from one place.
          </Text>
        </div>

        <Button
          className="gap-2"
          onClick={() => setShowAddForm((previous) => !previous)}
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? "Close" : "Invite Admin"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={Users}
          value={totalActiveAdmins}
          label="Active Users"
          iconClassName="text-blue-600"
        />

        <StatCard
          icon={Shield}
          value={totalSuperAdmins}
          label="Super Users"
        />

        <StatCard
          icon={Shield}
          value={totalInactiveAdmins}
          label="Inactive Users"
        />
      </div>

      {showAddForm ? (
        <Card>
          <div className="space-y-6">
            <div>
              <Text as="h2" variant="h2">
                Invite Admin
              </Text>
              <Text variant="muted">
                This creates the Firebase Authentication account, adds the admin authorization record, and prepares a secure password setup link.
              </Text>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Name" error={newUserErrors.name} required>
                <Input
                  value={newUser.name}
                  onChange={(event) => {
                    setNewUserErrors((previous) => ({ ...previous, name: "" }));
                    setNewUser((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }));
                  }}
                />
              </FormField>

              <FormField label="Email" error={newUserErrors.email} required>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(event) => {
                    const nextEmail = event.target.value;
                    setNewUserErrors((previous) => ({
                      ...previous,
                      email: "",
                    }));
                    setNewUser((previous) => ({
                      ...previous,
                      email: nextEmail,
                    }));
                  }}
                  onBlur={(event) => {
                    const emailError = validateUserForm(
                      { ...newUser, email: event.target.value },
                      { admins }
                    ).email;

                    setNewUserErrors((previous) => ({
                      ...previous,
                      email: emailError || "",
                    }));
                  }}
                />
              </FormField>

              <FormField label="Role" error={newUserErrors.role} required>
                <Select
                  value={newUser.role}
                  onChange={(value) => {
                    setNewUserErrors((previous) => ({ ...previous, role: "" }));
                    setNewUser((previous) => ({
                      ...previous,
                      role: value,
                    }));
                  }}
                  options={roleOptions}
                />
              </FormField>

              <FormField
                label="Designation"
                error={newUserErrors.designation}
                required
              >
                <Input
                  value={newUser.designation}
                  onChange={(event) => {
                    setNewUserErrors((previous) => ({
                      ...previous,
                      designation: "",
                    }));
                    setNewUser((previous) => ({
                      ...previous,
                      designation: event.target.value,
                    }));
                  }}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={resetAddForm}>
                Cancel
              </Button>
              <Button loading={submitting} onClick={handleAddUser}>
                Invite Admin
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {inviteLink ? (
        <Card className="border-emerald-200 bg-emerald-50/70 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Text variant="h3">Invite Link Ready</Text>
              <Text variant="muted">
                Share this password setup link with {inviteTargetName || "the invited admin"}.
              </Text>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" className="gap-2" onClick={() => handleCopyInvite()}>
                <Link2 className="h-4 w-4" />
                Copy Invite Link
              </Button>
              <Button variant="ghost" onClick={() => setInviteLink("")}>
                Dismiss
              </Button>
            </div>
          </div>

          <div className="mt-4 break-all rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-700">
            {inviteLink}
          </div>
        </Card>
      ) : null}

      <Card className="p-6">
        <div className="flex flex-wrap gap-3">
          <div className="w-full md:w-[250px]">
            <Input
              placeholder="Search name / email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="w-full md:w-[220px]">
            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              options={[{ label: "All Roles", value: "" }, ...roleOptions]}
            />
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setRoleFilter("");
            }}
          >
            Clear
          </Button>
        </div>
      </Card>

      <Text variant="muted">Showing {filteredAdmins.length} users</Text>

      <Card className="p-0">
        {loading ? (
          <div className="space-y-3 p-6">
            <div className="h-10 animate-pulse rounded bg-gray-200" />
            <div className="h-10 animate-pulse rounded bg-gray-200" />
          </div>
        ) : (
          <div className="max-h-[65vh] overflow-auto">
            <Table>
              <TableHeader columns={columns} />
              <tbody>
                {filteredAdmins.map((admin, index) => {
                  const isEditing = editingId === admin.id;

                  return (
                    <TableRow
                      key={admin.id}
                      className={isEditing ? "bg-blue-50" : ""}
                    >
                      <td className="px-4 py-3">{index + 1}</td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Input
                            value={editData.name}
                            onChange={(event) =>
                              setEditData((previous) => ({
                                ...previous,
                                name: event.target.value,
                              }))
                            }
                          />
                        ) : (
                          admin.name
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editData.email}
                            onChange={(event) =>
                              setEditData((previous) => ({
                                ...previous,
                                email: event.target.value,
                              }))
                            }
                          />
                        ) : (
                          admin.email
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Select
                            value={editData.role}
                            onChange={(value) =>
                              setEditData((previous) => ({
                                ...previous,
                                role: value,
                              }))
                            }
                            options={roleOptions}
                          />
                        ) : (
                          admin.role
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Input
                            value={editData.designation}
                            onChange={(event) =>
                              setEditData((previous) => ({
                                ...previous,
                                designation: event.target.value,
                              }))
                            }
                          />
                        ) : (
                          admin.designation
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              admin.inviteStatus === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {toReadableInviteStatus(admin.inviteStatus)}
                          </span>
                          <ActionButton
                            icon={KeyRound}
                            label="Invite"
                            variant="ghost"
                            onClick={() => handleResendInvite(admin)}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Button onClick={handleUpdateUser}>Save</Button>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setEditingId(null);
                                setEditData({});
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <ActionButton
                              icon={Eye}
                              label="View"
                              variant="ghost"
                              onClick={() => openViewModal(admin)}
                            />

                            <ActionButton
                              icon={Pencil}
                              label="Edit"
                              variant="ghost"
                              onClick={() => {
                                if (!isSuper) {
                                  toast.error("Only Super Admin can edit users");
                                  return;
                                }

                                setEditingId(admin.id);
                                setEditData({
                                  name: admin.name || "",
                                  email: admin.email || "",
                                  role: admin.role || roleNames[0] || "Admin",
                                  designation: admin.designation || "",
                                });
                              }}
                            />

                            <ActionButton
                              icon={Trash2}
                              label="Delete"
                              variant="ghostDanger"
                              onClick={() => openDeleteModal(admin.id)}
                            />
                          </div>
                        )}
                      </td>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      <ConfirmModal
        open={confirmOpen}
        title="Delete User?"
        description="This removes both the admin authorization record and the linked Firebase login account."
        onConfirm={confirmDelete}
        onClose={() => setConfirmOpen(false)}
      />

      <Modal
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelectedAdmin(null);
        }}
        title="Admin User Details"
        size="lg"
      >
        {selectedAdmin ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailInfoCard
                  label="Name"
                  value={selectedAdmin.name || "Not available"}
                />
                <DetailInfoCard
                  label="Status"
                  value={toReadableInviteStatus(selectedAdmin.inviteStatus)}
                  status
                />
                <DetailInfoCard
                  label="Email"
                  value={selectedAdmin.email || "Not available"}
                />
                <DetailInfoCard
                  label="Role"
                  value={selectedAdmin.role || "Not available"}
                />
                <DetailInfoCard
                  label="Designation"
                  value={selectedAdmin.designation || "Not available"}
                />
                <DetailInfoCard
                  label="UID"
                  value={selectedAdmin.uid || selectedAdmin.id || "Not available"}
                />
                <DetailInfoCard
                  label="Created"
                  value={formatDateValue(selectedAdmin.createdAt)}
                />
                <DetailInfoCard
                  label="Last Active"
                  value={formatDateValue(selectedAdmin.lastLoginAt)}
                />
                <DetailInfoCard
                  label="Last Updated"
                  value={formatDateValue(selectedAdmin.updatedAt)}
                />
                <DetailInfoCard
                  label="Invite Link Generated"
                  value={formatDateValue(selectedAdmin.inviteLinkGeneratedAt)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Text as="h3" variant="h3" className="block">
                User History
              </Text>

              {Array.isArray(selectedAdmin.history) && selectedAdmin.history.length > 0 ? (
                <div className="space-y-3">
                  {[...selectedAdmin.history]
                    .slice()
                    .reverse()
                    .map((item, index) => (
                      <Card
                        key={`${item.type || "history"}-${index}`}
                        className="rounded-2xl border border-slate-200 p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <Text as="div" variant="h3" className="block">
                              {toReadableHistoryType(item.type)}
                            </Text>
                            <Text as="div" className="mt-1 block">
                              {item.description || "Activity recorded."}
                            </Text>
                            <Text as="div" variant="muted" className="mt-1 block">
                              {item.actorName || item.actorEmail
                                ? `By ${item.actorName || item.actorEmail}`
                                : "System activity"}
                            </Text>
                          </div>

                          <Text as="div" variant="muted" className="block whitespace-nowrap">
                            {formatDateValue(item.timestamp)}
                          </Text>
                        </div>
                      </Card>
                    ))}
                </div>
              ) : (
                <Card className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <Text as="div" variant="muted" className="block">
                    No user history available yet.
                  </Text>
                </Card>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
