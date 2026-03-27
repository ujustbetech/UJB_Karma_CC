"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import DateInput from "@/components/ui/DateInput";
import FormField from "@/components/ui/FormField";
import ActionButton from "@/components/ui/ActionButton";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";
import { useToast } from "@/components/ui/ToastProvider";

import { Pencil, Trash2 } from "lucide-react";

export default function EditConclavePage() {

  const { eventId } = useParams();
  const id = eventId;

  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);

  const [conclave, setConclave] = useState({
    conclaveStream: "",
    startDate: "",
    initiationDate: "",
    leaderRole: "",
    ntRoles: "",
  });

  const [meetings, setMeetings] = useState([]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);

  const columns = [
    { key: "name", label: "Meeting Name" },
    { key: "mode", label: "Mode" },
    { key: "time", label: "Date & Time" },
    { key: "actions", label: "Actions" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(
        doc(db, COLLECTIONS.conclaves, id)
      );

      if (snap.exists()) {
        const data = snap.data();
        setConclave({
          conclaveStream: data.conclaveStream || "",
          startDate: data.startDate || "",
          initiationDate: data.initiationDate || "",
          leaderRole: data.leaderRole || "",
          ntRoles: data.ntRoles || "",
        });
      }

      const meetingsSnap = await getDocs(
        collection(db, COLLECTIONS.conclaves, id, "meetings")
      );

      const list = meetingsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setMeetings(list);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleConclaveChange = (name, value) => {
    setConclave((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateConclave = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(
        doc(db, COLLECTIONS.conclaves, id),
        {
          ...conclave,
        }
      );
      toast.success("Conclave updated successfully");
    } catch {
      toast.error("Update failed");
    }
  };

  const openDelete = (m) => {
    setMeetingToDelete(m);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!meetingToDelete) return;
    try {
      await deleteDoc(
        doc(
          db,
          COLLECTIONS.conclaves,
          id,
          "meetings",
          meetingToDelete.id
        )
      );
      toast.success("Meeting deleted");
      setDeleteOpen(false);
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  const formatDateTime = (time) => {
    if (!time?.seconds) return "—";
    const date = new Date(time.seconds * 1000);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Conclave Form */}
      <Card className="mb-4">
        <div className="pb-3 border-b">
          <Text as="h3">Conclave Information</Text>
        </div>

        <form
          onSubmit={handleUpdateConclave}
          className="space-y-6 pt-6"
        >

          <FormField label="Conclave Name">
            <Input
              value={conclave.conclaveStream}
              disabled={loading}
              className={loading ? "animate-pulse bg-slate-200" : ""}
              onChange={(e) =>
                handleConclaveChange(
                  "conclaveStream",
                  e.target.value
                )
              }
            />
          </FormField>

          <FormField label="Start Date">
            <DateInput
              value={conclave.startDate}
              disabled={loading}
              className={loading ? "animate-pulse bg-slate-200" : ""}
              onChange={(v) =>
                handleConclaveChange("startDate", v)
              }
            />
          </FormField>

          <FormField label="Initiation Date">
            <DateInput
              value={conclave.initiationDate}
              disabled={loading}
              className={loading ? "animate-pulse bg-slate-200" : ""}
              onChange={(v) =>
                handleConclaveChange(
                  "initiationDate",
                  v
                )
              }
            />
          </FormField>

          <FormField label="Leader Role">
            <Textarea
              value={conclave.leaderRole}
              disabled={loading}
              className={loading ? "animate-pulse bg-slate-200" : ""}
              onChange={(e) =>
                handleConclaveChange(
                  "leaderRole",
                  e.target.value
                )
              }
            />
          </FormField>

          <FormField label="NT Roles">
            <Textarea
              value={conclave.ntRoles}
              disabled={loading}
              className={loading ? "animate-pulse bg-slate-200" : ""}
              onChange={(e) =>
                handleConclaveChange(
                  "ntRoles",
                  e.target.value
                )
              }
            />
          </FormField>

          <div className="flex justify-end">
            <Button type="submit">
              Save Changes
            </Button>
          </div>

        </form>
      </Card>

      {/* Meetings Table */}
      <Card>
        <Table>
          <TableHeader columns={columns} />
          <tbody>

            {/* Skeleton */}
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full rounded-md bg-slate-200 animate-pulse" />
                    </td>
                  ))}
                </TableRow>
              ))
            }

            {/* Actual */}
            {!loading &&
              meetings.map((m) => (
                <TableRow key={m.id}>
                  <td className="px-4 py-3">
                    {m.meetingName}
                  </td>
                  <td className="px-4 py-3">
                    {m.mode}
                  </td>
                  <td className="px-4 py-3">
                    {formatDateTime(m.datetime)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Tooltip content="Edit">
                        <ActionButton
                          icon={Pencil}
                          onClick={() =>
                            router.push(
                              `/admin/conclave/addmeeting/${m.id}?conclaveId=${id}`
                            )
                          }
                        />
                      </Tooltip>

                      <Tooltip content="Delete">
                        <ActionButton
                          icon={Trash2}
                          variant="danger"
                          onClick={() =>
                            openDelete(m)
                          }
                        />
                      </Tooltip>
                    </div>
                  </td>
                </TableRow>
              ))
            }

          </tbody>
        </Table>
      </Card>

      <ConfirmModal
        open={deleteOpen}
        title="Delete Meeting"
        description={`Delete ${meetingToDelete?.meetingName}?`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}