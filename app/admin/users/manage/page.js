"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firebaseClient";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ActionButton from "@/components/ui/ActionButton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import Select from "@/components/ui/Select";
import { useAdminSession } from "@/hooks/useAdminSession";

import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";

import { Users, Pencil, Trash2 } from "lucide-react";

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const [deleteId, setDeleteId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toast = useToast();
  const { admin: currentAdmin } = useAdminSession();

  /* ================= GET LOGGED IN ADMIN ================= */
 const isSuper =
  currentAdmin?.role?.trim().toLowerCase() === "super";
  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const snap = await getDocs(collection(db, "AdminUsers"));

        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setAdmins(data);
      } catch {
        toast.error("Failed to load admins");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    return admins.filter((a) => {
      const text = `${a.name} ${a.email}`.toLowerCase();

      const matchSearch =
        !search || text.includes(search.toLowerCase());

      const matchRole =
        !roleFilter || a.role === roleFilter;

      return matchSearch && matchRole;
    });
  }, [admins, search, roleFilter]);

  /* ================= DELETE ================= */
  const askDelete = (id) => {
    if (!isSuper) {
      toast.error("Only Super Admin Allowed ❌");
      return;
    }

    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!isSuper) {
      toast.error("Only Super Admin Allowed ❌");
      return;
    }

    try {
      await deleteDoc(doc(db, "AdminUsers", deleteId));

      setAdmins((prev) =>
        prev.filter((a) => a.id !== deleteId)
      );

      toast.success("Deleted successfully ✅");
    } catch {
      toast.error("Delete failed ❌");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  /* ================= UPDATE ================= */
  const handleUpdate = async () => {
    if (!isSuper) {
      toast.error("Only Super Admin Allowed ❌");
      return;
    }

    try {
      await updateDoc(doc(db, "AdminUsers", editingId), editData);

      toast.success("Updated successfully ✅");

      setAdmins((prev) =>
        prev.map((a) =>
          a.id === editingId ? { ...a, ...editData } : a
        )
      );

      setEditingId(null);
    } catch {
      toast.error("Update failed ❌");
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
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <Text as="h1">Manage Admins</Text>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <Text as="h3">Total Admins</Text>
              <Text>{admins.length}</Text>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <Text as="h3">Admins</Text>
          <Text>
            {admins.filter((a) => a.role === "Admin").length}
          </Text>
        </Card>

        <Card className="p-4">
          <Text as="h3">Super Admins</Text>
          <Text>
            {admins.filter((a) => a.role === "Super").length}
          </Text>
        </Card>
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="sticky top-[64px] z-20">
        <Card className="p-6">
          <div className="flex flex-wrap gap-3">

            <div className="w-[250px]">
              <Input
                placeholder="Search name / email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="w-[180px]">
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                options={[
                  { label: "All Roles", value: "" },
                  { label: "Admin", value: "Admin" },
                  { label: "Super", value: "Super" },
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
      </div>

      {/* RESULT COUNT */}
      <Text className="text-sm text-gray-500">
        Showing {filtered.length} admins
      </Text>

      {/* ================= TABLE ================= */}
      <Card className="p-0">
        {loading ? (
          <div className="p-6 space-y-3">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : (
          <div className="overflow-auto max-h-[65vh]">
            <Table>
              <TableHeader columns={columns} />
              <tbody>
                {filtered.map((admin, index) => {
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
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                name: e.target.value,
                              })
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
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                email: e.target.value,
                              })
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
                            onChange={(v) =>
                              setEditData({
                                ...editData,
                                role: v,
                              })
                            }
                            options={[
                              { label: "Admin", value: "Admin" },
                              { label: "Super", value: "Super" },
                            ]}
                          />
                        ) : (
                          admin.role
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Input
                            value={editData.designation}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                designation: e.target.value,
                              })
                            }
                          />
                        ) : (
                          admin.designation
                        )}
                      </td>

                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Button onClick={handleUpdate}>
                              Save
                            </Button>

                            <Button
                              variant="secondary"
                              onClick={() => setEditingId(null)}
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
      toast.error("You are not a Super Admin ❌");
      return;
    }

    setEditingId(admin.id);
    setEditData(admin);
  }}
/>

                           <ActionButton
  icon={Trash2}
  label="Delete"
  variant="ghostDanger"
  onClick={() => {
    if (!isSuper) {
      toast.error("You are not a Super Admin ❌");
      return;
    }

    askDelete(admin.id);
  }}
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

      {/* DELETE MODAL */}
      <ConfirmModal
        open={confirmOpen}
        title="Delete Admin?"
        description="This action cannot be undone."
        onConfirm={confirmDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}

