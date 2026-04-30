"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminConclaveRegisteredUsers,
  markAdminConclaveAttendance,
} from "@/services/adminConclaveService";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";

export default function RegisteredUsersSection({ conclaveId, meetingId }) {
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const loadUsers = async () => {
    if (!conclaveId || !meetingId) return;

    setLoading(true);
    try {
      const data = await fetchAdminConclaveRegisteredUsers(conclaveId, meetingId);
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [conclaveId, meetingId]);

  const filtered = useMemo(
    () =>
      users.filter(
        (user) =>
          user.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
          user.category.toLowerCase().includes(categoryFilter.toLowerCase())
      ),
    [users, nameFilter, categoryFilter]
  );

  const confirmAttendance = async () => {
    try {
      await markAdminConclaveAttendance(conclaveId, meetingId, selectedUserId);
      toast.success("Marked as Present");
      setConfirmOpen(false);
      setSelectedUserId(null);
      await loadUsers();
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark attendance");
    }
  };

  const columns = [
    { key: "no", label: "#" },
    { key: "phone", label: "Phone Number" },
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "response", label: "Response" },
    { key: "attendance", label: "Attendance" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <Text variant="h2">Registered Users</Text>
      </Card>

      <Card className="flex gap-4">
        <Input
          placeholder="Search Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />

        <Input
          placeholder="Search Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        />
      </Card>

      <Card>
        <Table>
          <TableHeader columns={columns} />
          <tbody>
            {loading ? (
              <TableRow>
                <td colSpan={6} className="px-4 py-4 text-center">
                  Loading users...
                </td>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <td colSpan={6} className="px-4 py-4 text-center">
                  No users found
                </td>
              </TableRow>
            ) : (
              filtered.map((user, index) => (
                <TableRow key={user.id}>
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">{user.phoneNumber}</td>
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.category}</td>
                  <td className="px-4 py-3">{user.response}</td>
                  <td className="px-4 py-3">
                    {user.attendanceStatus ? (
                      <Text>Present</Text>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setConfirmOpen(true);
                        }}
                      >
                        Mark Present
                      </Button>
                    )}
                  </td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      <ConfirmModal
        open={confirmOpen}
        title="Mark Attendance"
        description="Mark this user as present?"
        onConfirm={confirmAttendance}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}


