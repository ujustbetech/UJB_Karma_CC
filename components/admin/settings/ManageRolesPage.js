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
import { Pencil, Shield, Tags, Trash2 } from "lucide-react";

import { db } from "@/lib/firebase/firebaseClient";
import {
  ADMIN_ROLES_COLLECTION,
  ADMIN_USERS_COLLECTION,
  DEFAULT_ADMIN_ROLE_NAMES,
  getMergedAdminRoleNames,
  isSystemAdminRole,
  normalizeRoleName,
} from "@/lib/admin/adminRoles";

import ActionButton from "@/components/ui/ActionButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Input from "@/components/ui/Input";
import Text from "@/components/ui/Text";
import { useToast } from "@/components/ui/ToastProvider";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";

function createRoleUsageMap(admins) {
  return admins.reduce((usageMap, admin) => {
    const normalizedName = normalizeRoleName(admin.role);

    if (!normalizedName) {
      return usageMap;
    }

    usageMap[normalizedName] = (usageMap[normalizedName] || 0) + 1;

    return usageMap;
  }, {});
}

export default function ManageRolesPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [newRoleName, setNewRoleName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const [deleteRole, setDeleteRole] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [rolesSnapshot, adminsSnapshot] = await Promise.all([
          getDocs(collection(db, ADMIN_ROLES_COLLECTION)),
          getDocs(collection(db, ADMIN_USERS_COLLECTION)),
        ]);

        if (!mounted) {
          return;
        }

        setRoles(
          rolesSnapshot.docs.map((snapshot) => ({
            id: snapshot.id,
            ...snapshot.data(),
          }))
        );

        setAdmins(
          adminsSnapshot.docs.map((snapshot) => ({
            id: snapshot.id,
            ...snapshot.data(),
          }))
        );
      } catch {
        toast.error("Failed to load roles");
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

  const roleUsageMap = useMemo(
    () => createRoleUsageMap(admins),
    [admins]
  );

  const mergedRoles = useMemo(() => {
    const customRoles = roles.map((role) => role.name);
    const mergedNames = getMergedAdminRoleNames(customRoles);

    return mergedNames.map((roleName) => {
      const normalizedName = normalizeRoleName(roleName);
      const matchingCustomRole = roles.find(
        (role) => normalizeRoleName(role.name) === normalizedName
      );

      return {
        id: matchingCustomRole?.id || normalizedName,
        name: roleName,
        normalizedName,
        isSystem: isSystemAdminRole(roleName) && !matchingCustomRole,
        usageCount: roleUsageMap[normalizedName] || 0,
      };
    });
  }, [roleUsageMap, roles]);

  const totalAssignedUsers = useMemo(
    () => admins.length,
    [admins]
  );

  const handleCreateRole = async () => {
    const trimmedName = newRoleName.trim();
    const normalizedName = normalizeRoleName(trimmedName);

    if (!trimmedName) {
      toast.error("Role name required");
      return;
    }

    if (
      mergedRoles.some((role) => role.normalizedName === normalizedName)
    ) {
      toast.error("Role already exists");
      return;
    }

    setSubmitting(true);

    try {
      const createdDoc = await addDoc(collection(db, ADMIN_ROLES_COLLECTION), {
        name: trimmedName,
        normalizedName,
        createdAt: Timestamp.now(),
      });

      setRoles((previous) => [
        ...previous,
        { id: createdDoc.id, name: trimmedName, normalizedName },
      ]);
      setNewRoleName("");
      toast.success("Role created successfully");
    } catch {
      toast.error("Failed to create role");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveRole = async () => {
    const trimmedName = editName.trim();
    const normalizedName = normalizeRoleName(trimmedName);
    const currentRole = mergedRoles.find((role) => role.id === editingId);

    if (!trimmedName) {
      toast.error("Role name required");
      return;
    }

    if (currentRole?.usageCount > 0) {
      toast.error("Assigned roles cannot be renamed");
      return;
    }

    if (
      mergedRoles.some(
        (role) =>
          role.normalizedName === normalizedName && role.id !== editingId
      )
    ) {
      toast.error("Role already exists");
      return;
    }

    try {
      await updateDoc(doc(db, ADMIN_ROLES_COLLECTION, editingId), {
        name: trimmedName,
        normalizedName,
      });

      setRoles((previous) =>
        previous.map((role) =>
          role.id === editingId
            ? { ...role, name: trimmedName, normalizedName }
            : role
        )
      );

      setEditingId(null);
      setEditName("");
      toast.success("Role updated successfully");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRole) {
      return;
    }

    if (deleteRole.isSystem) {
      toast.error("System roles cannot be deleted");
      setDeleteRole(null);
      return;
    }

    if (deleteRole.usageCount > 0) {
      toast.error("This role is assigned to users and cannot be deleted");
      setDeleteRole(null);
      return;
    }

    try {
      await deleteDoc(doc(db, ADMIN_ROLES_COLLECTION, deleteRole.id));
      setRoles((previous) =>
        previous.filter((role) => role.id !== deleteRole.id)
      );
      toast.success("Role deleted successfully");
    } catch {
      toast.error("Failed to delete role");
    } finally {
      setDeleteRole(null);
    }
  };

  const columns = [
    { label: "#", key: "index" },
    { label: "Role", key: "role" },
    { label: "Type", key: "type" },
    { label: "Assigned Users", key: "assignedUsers" },
    { label: "Actions", key: "actions" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" variant="h1">
          Manage Role
        </Text>
        <Text variant="muted">
          Create role names for admin users. New roles become available in add and edit user flows automatically.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Tags className="h-5 w-5 text-blue-600" />
            <div>
              <Text variant="h3">Total Roles</Text>
              <Text>{mergedRoles.length}</Text>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-slate-600" />
            <div>
              <Text variant="h3">System Roles</Text>
              <Text>{DEFAULT_ADMIN_ROLE_NAMES.length}</Text>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <Text variant="h3">Assigned Users</Text>
          <Text>{totalAssignedUsers}</Text>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <Text as="label" variant="h3" className="mb-2 block">
              New Role
            </Text>
            <Input
              placeholder="Enter role name"
              value={newRoleName}
              onChange={(event) => setNewRoleName(event.target.value)}
            />
          </div>

          <Button loading={submitting} onClick={handleCreateRole}>
            Create Role
          </Button>
        </div>
      </Card>

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
                {mergedRoles.map((role, index) => {
                  const isEditing = editingId === role.id;

                  return (
                    <TableRow key={role.id}>
                      <td className="px-4 py-3">{index + 1}</td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Input
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                          />
                        ) : (
                          role.name
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {role.isSystem ? "System" : "Custom"}
                      </td>

                      <td className="px-4 py-3">{role.usageCount}</td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Button onClick={handleSaveRole}>Save</Button>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setEditingId(null);
                                setEditName("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <ActionButton
                              icon={Pencil}
                              label={role.isSystem ? "System role" : "Edit"}
                              variant="ghost"
                              onClick={() => {
                                if (role.isSystem) {
                                  toast.error("System roles cannot be renamed");
                                  return;
                                }

                                setEditingId(role.id);
                                setEditName(role.name);
                              }}
                            />
                            <ActionButton
                              icon={Trash2}
                              label={role.isSystem ? "System role" : "Delete"}
                              variant="ghostDanger"
                              onClick={() => setDeleteRole(role)}
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
        open={Boolean(deleteRole)}
        title="Delete Role?"
        description="This role will be removed only if it is not assigned to any user."
        onConfirm={handleDeleteRole}
        onClose={() => setDeleteRole(null)}
      />
    </div>
  );
}
