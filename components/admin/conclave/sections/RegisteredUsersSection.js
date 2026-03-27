"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";

export default function RegisteredUsersSection({
  conclaveId,
  meetingId,
}) {
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [attendanceMap, setAttendanceMap] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  /* ================= FETCH USERS ================= */

  useEffect(() => {
    if (!conclaveId || !meetingId) return;

    const ref = collection(
      db,
      COLLECTIONS.conclaves,
      conclaveId,
      "meetings",
      meetingId,
      "registeredUsers"
    );

    const q = query(ref, orderBy("registeredAt", "desc"));

    const unsub = onSnapshot(q, async (snapshot) => {
      const list = await Promise.all(
        snapshot.docs.map(async (d) => {
          const regData = d.data();

          const userQuery = query(
            collection(db, COLLECTIONS.userDetail),
            where("MobileNo", "==", d.id)
          );

          const userSnap = await getDocs(userQuery);

          let userData = {};
          if (!userSnap.empty) {
            userData = userSnap.docs[0].data();
          }

          return {
            id: d.id,
            phoneNumber: d.id,
            name:
              userData["Name"] || `Unknown (${d.id})`,
            category:
              userData["Category"] || "Unknown",
            response: regData.response || "",
            attendanceStatus:
              regData.attendanceStatus || false,
          };
        })
      );

      const responded = list.filter(
        (u) => u.response
      );

      setUsers(responded);
    });

    return () => unsub();
  }, [conclaveId, meetingId]);

  /* ================= FILTER ================= */

  useEffect(() => {
    const f = users.filter(
      (u) =>
        u.name
          .toLowerCase()
          .includes(nameFilter.toLowerCase()) &&
        u.category
          .toLowerCase()
          .includes(categoryFilter.toLowerCase())
    );

    setFiltered(f);
  }, [users, nameFilter, categoryFilter]);

  /* ================= ATTENDANCE ================= */

  const openConfirm = (userId) => {
    setSelectedUserId(userId);
    setConfirmOpen(true);
  };

  const confirmAttendance = async () => {
    try {
      const ref = doc(
        db,
        COLLECTIONS.conclaves,
        conclaveId,
        "meetings",
        meetingId,
        "registeredUsers",
        selectedUserId
      );

      await updateDoc(ref, {
        attendanceStatus: true,
      });

      toast.success("Marked as Present");
      setConfirmOpen(false);
    } catch (err) {
      toast.error("Failed to mark attendance");
    }
  };

  /* ================= TABLE ================= */

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
        <Text variant="h2">
          Registered Users
        </Text>
      </Card>

      {/* FILTERS */}
      <Card className="flex gap-4">
        <Input
          placeholder="Search Name"
          value={nameFilter}
          onChange={(e) =>
            setNameFilter(e.target.value)
          }
        />

        <Input
          placeholder="Search Category"
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value)
          }
        />
      </Card>

      {/* TABLE */}
      <Card>
        <Table>
          <TableHeader columns={columns} />
          <tbody>
            {filtered.length === 0 ? (
              <TableRow>
                <td
                  colSpan={6}
                  className="px-4 py-4 text-center"
                >
                  No users found
                </td>
              </TableRow>
            ) : (
              filtered.map((user, i) => (
                <TableRow key={user.id}>
                  <td className="px-4 py-3">
                    {i + 1}
                  </td>

                  <td className="px-4 py-3">
                    {user.phoneNumber}
                  </td>

                  <td className="px-4 py-3">
                    {user.name}
                  </td>

                  <td className="px-4 py-3">
                    {user.category}
                  </td>

                  <td className="px-4 py-3">
                    {user.response}
                  </td>

                  <td className="px-4 py-3">
                    {user.attendanceStatus ? (
                      <Text>
                        ✅ Present
                      </Text>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() =>
                          openConfirm(user.id)
                        }
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
        onClose={() =>
          setConfirmOpen(false)
        }
      />

    </div>
  );
}
