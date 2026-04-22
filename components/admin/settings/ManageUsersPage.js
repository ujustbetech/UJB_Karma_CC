"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { Pencil, Plus, Shield, Trash2, Users } from "lucide-react";

import { db } from "@/lib/firebase/firebaseClient";
import {
  ADMIN_ROLES_COLLECTION,
  ADMIN_USERS_COLLECTION,
  getMergedAdminRoleNames,
  toRoleOptions,
} from "@/lib/admin/adminRoles";

import ActionButton from "@/components/ui/ActionButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Text from "@/components/ui/Text";
import { useToast } from "@/components/ui/ToastProvider";
import { useAdminSession } from "@/hooks/useAdminSession";
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

function validateUserForm(userForm) {
  const nextErrors = {};

  if (!userForm.name.trim()) nextErrors.name = "Name required";
  if (!userForm.email.trim()) nextErrors.email = "Email required";
  if (!userForm.role.trim()) nextErrors.role = "Select role";
  if (!userForm.designation.trim()) nextErrors.designation = "Designation required";

  return nextErrors;
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

  const isSuper =
    currentAdmin?.role?.trim().toLowerCase() === "super";

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [adminsSnapshot, rolesSnapshot] = await Promise.all([
          getDocs(collection(db, ADMIN_USERS_COLLECTION)),
          getDocs(collection(db, ADMIN_ROLES_COLLECTION)),
        ]);

        if (!mounted) {
          return;
        }

        setAdmins(
          adminsSnapshot.docs.map((snapshot) => ({
            id: snapshot.id,
            ...snapshot.data(),
          }))
        );

        setRoleNames(
          getMergedAdminRoleNames(
            rolesSnapshot.docs.map((snapshot) => snapshot.data().name)
          )
        );
      } catch {
        toast.error("Failed to load users");
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

  const roleOptions = useMemo(
    () => toRoleOptions(roleNames),
    [roleNames]
  );

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const searchableText = `${admin.name || ""} ${admin.email || ""}`.toLowerCase();
      const matchesSearch =
        !search || searchableText.includes(search.toLowerCase());
      const matchesRole =
        !roleFilter || admin.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [admins, roleFilter, search]);

  const totalSuperAdmins = useMemo(
    () =>
      admins.filter(
        (admin) => admin.role?.trim().toLowerCase() === "super"
      ).length,
    [admins]
  );

  const resetAddForm = () => {
    setNewUser(createEmptyUserForm(roleNames[0] || "Admin"));
    setNewUserErrors({});
    setShowAddForm(false);
  };

  const handleAddUser = async () => {
    const validationErrors = validateUserForm(newUser);

    if (Object.keys(validationErrors).length > 0) {
      setNewUserErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        role: newUser.role.trim(),
        designation: newUser.designation.trim(),
        createdAt: Timestamp.now(),
      };

      const createdDoc = await addDoc(
        collection(db, ADMIN_USERS_COLLECTION),
        payload
      );

      setAdmins((previous) => [
        ...previous,
        { id: createdDoc.id, ...payload },
      ]);

      toast.success("User added successfully");
      resetAddForm();
    } catch {
      toast.error("Failed to add user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!isSuper) {
      toast.error("Only Super Admin can update users");
      return;
    }

    const validationErrors = validateUserForm(editData);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      const payload = {
        name: editData.name.trim(),
        email: editData.email.trim(),
        role: editData.role.trim(),
        designation: editData.designation.trim(),
      };

      await updateDoc(doc(db, ADMIN_USERS_COLLECTION, editingId), payload);

      setAdmins((previous) =>
        previous.map((admin) =>
          admin.id === editingId ? { ...admin, ...payload } : admin
        )
      );

      setEditingId(null);
      setEditData({});
      toast.success("User updated successfully");
    } catch {
      toast.error("Failed to update user");
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
      await deleteDoc(doc(db, ADMIN_USERS_COLLECTION, deleteId));

      setAdmins((previous) =>
        previous.filter((admin) => admin.id !== deleteId)
      );

      toast.success("User deleted successfully");
    } catch {
      toast.error("Failed to delete user");
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
    { label: "Actions", key: "actions" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Text as="h1" variant="h1">
            Manage User
          </Text>
          <Text variant="muted">
            Add, edit, and organize admin users from one place.
          </Text>
        </div>

        <Button
          className="gap-2"
          onClick={() => setShowAddForm((previous) => !previous)}
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? "Close" : "Add User"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <Text variant="h3">Total Users</Text>
              <Text>{admins.length}</Text>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-slate-600" />
            <div>
              <Text variant="h3">Super Users</Text>
              <Text>{totalSuperAdmins}</Text>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <Text variant="h3">Available Roles</Text>
          <Text>{roleNames.length}</Text>
        </Card>
      </div>

      {showAddForm ? (
        <Card>
          <div className="space-y-6">
            <div>
              <Text as="h2" variant="h2">
                Add User
              </Text>
              <Text variant="muted">
                New roles created under Manage Role will appear here automatically.
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
                  value={newUser.email}
                  onChange={(event) => {
                    setNewUserErrors((previous) => ({ ...previous, email: "" }));
                    setNewUser((previous) => ({
                      ...previous,
                      email: event.target.value,
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
                Save User
              </Button>
            </div>
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
              options={[
                { label: "All Roles", value: "" },
                ...roleOptions,
              ]}
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

      <Text variant="muted">
        Showing {filteredAdmins.length} users
      </Text>

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
        description="This action cannot be undone."
        onConfirm={confirmDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
