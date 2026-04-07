"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";

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
    leader: "",
    ntMembers: [],
    orbiters: [],
    leaderRole: "",
    ntRoles: "",
  });
  const [meetings, setMeetings] = useState([]);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    meetingName: "",
    datetime: "",
    agenda: "",
    mode: "online",
    link: "",
    venue: "",
  });

  const convertTimestampToInput = (ts) => {
    if (!ts?.seconds) return "";
    const date = new Date(ts.seconds * 1000);
    const pad = (value) => value.toString().padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const convertInputToTimestamp = (value) => {
    if (!value) return null;
    return Timestamp.fromDate(new Date(value));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.conclaves, id));

      if (snap.exists()) {
        const data = snap.data();

        setConclave({
          conclaveStream: data.conclaveStream || "",
          startDate: convertTimestampToInput(data.startDate),
          initiationDate: convertTimestampToInput(data.initiationDate),
          leader: data.leader || "",
          ntMembers: data.ntMembers || [],
          orbiters: data.orbiters || [],
          leaderRole: data.leaderRole || "",
          ntRoles: data.ntRoles || "",
        });
      }

      const meetingsSnap = await getDocs(
        collection(db, COLLECTIONS.conclaves, id, "meetings")
      );

      const list = meetingsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      list.sort(
        (a, b) => (b.datetime?.seconds || 0) - (a.datetime?.seconds || 0)
      );

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

  const handleChange = (name, value) => {
    setConclave((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMeetingChange = (event) => {
    setMeetingForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    try {
      await updateDoc(doc(db, COLLECTIONS.conclaves, id), {
        ...conclave,
        startDate: convertInputToTimestamp(conclave.startDate),
        initiationDate: convertInputToTimestamp(conclave.initiationDate),
      });

      toast.success("Updated successfully");
    } catch {
      toast.error("Update failed");
    }
  };

  const handleMeetingSubmit = async (event) => {
    event.preventDefault();

    try {
      await addDoc(collection(db, COLLECTIONS.conclaves, id, "meetings"), {
        ...meetingForm,
        datetime: Timestamp.fromDate(new Date(meetingForm.datetime)),
        createdAt: Timestamp.now(),
      });

      toast.success("Meeting added");
      setShowMeetingForm(false);
      fetchData();
    } catch {
      toast.error("Failed to add meeting");
    }
  };

  return (
    <Card>
      <Text as="h3">Edit Conclave</Text>

      <div className="my-4">
        <Button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          onClick={() => setShowMeetingForm(true)}
        >
          + Add Meeting
        </Button>
      </div>

      {showMeetingForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">Add Meeting</h2>

            <form onSubmit={handleMeetingSubmit} className="space-y-3">
              <input
                name="meetingName"
                placeholder="Meeting Name"
                onChange={handleMeetingChange}
                className="w-full border p-2 rounded"
              />

              <input
                type="datetime-local"
                name="datetime"
                onChange={handleMeetingChange}
                className="w-full border p-2 rounded"
              />

              <textarea
                name="agenda"
                placeholder="Agenda"
                onChange={handleMeetingChange}
                className="w-full border p-2 rounded"
              />

              <button className="bg-blue-600 text-white px-4 py-2 rounded">
                Create
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <h3 className="text-lg font-semibold">Meetings</h3>

        {loading ? (
          <p className="text-sm text-slate-500">Loading meetings...</p>
        ) : (
          meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="flex justify-between items-center border p-3 rounded"
            >
              <div>
                <p className="font-medium">{meeting.meetingName}</p>
                <p className="text-sm text-gray-500">{meeting.mode}</p>
              </div>

              <button
                className="bg-orange-500 text-white px-3 py-1 rounded"
                onClick={() =>
                  router.push(
                    `/admin/conclave/addmeeting/${meeting.id}?conclaveId=${id}`
                  )
                }
              >
                Edit
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleUpdate} className="space-y-6 mt-6">
        <FormField label="Conclave Name">
          <Input
            value={conclave.conclaveStream}
            onChange={(event) =>
              handleChange("conclaveStream", event.target.value)
            }
          />
        </FormField>

        <FormField label="Leader">
          <Input value={conclave.leader} disabled />
        </FormField>

        <FormField label="NT Members">
          <div className="flex flex-wrap gap-2">
            {conclave.ntMembers.map((member, index) => (
              <span
                key={index}
                className="bg-blue-100 px-3 py-1 rounded-full text-sm"
              >
                {member}
              </span>
            ))}
          </div>
        </FormField>

        <FormField label="Orbiters">
          <div className="flex flex-wrap gap-2">
            {conclave.orbiters.map((member, index) => (
              <span
                key={index}
                className="bg-green-100 px-3 py-1 rounded-full text-sm"
              >
                {member}
              </span>
            ))}
          </div>
        </FormField>

        <FormField label="Start Date">
          <input
            type="datetime-local"
            value={conclave.startDate}
            onChange={(event) =>
              handleChange("startDate", event.target.value)
            }
            className="w-full border p-2 rounded"
          />
        </FormField>

        <FormField label="Initiation Date">
          <input
            type="datetime-local"
            value={conclave.initiationDate}
            onChange={(event) =>
              handleChange("initiationDate", event.target.value)
            }
            className="w-full border p-2 rounded"
          />
        </FormField>

        <Button type="submit">Save Changes</Button>
      </form>
    </Card>
  );
}
