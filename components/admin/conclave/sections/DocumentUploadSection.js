"use client";

import { useState, useRef, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { storage, db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import FormField from "@/components/ui/FormField";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";
import { useToast } from "@/components/ui/ToastProvider";

export default function DocumentUploadSection({
  conclaveId,
  meetingId,
  fetchData,
}) {
  const toast = useToast();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [description, setDescription] = useState("");
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);

  const fileInputRef = useRef(null);

  /* ================= FETCH ================= */
  const fetchUploads = async () => {
    if (!conclaveId || !meetingId) return;

    const docRef = doc(
      db,
      COLLECTIONS.conclaves,
      conclaveId,
      "meetings",
      meetingId
    );

    const snap = await getDoc(docRef);

    if (snap.exists()) {
      setUploads(snap.data().documentUploads || []);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, [conclaveId, meetingId]);

  /* ================= UPLOAD ================= */

  const handleUpload = async () => {
    if (!selectedFiles.length || !description) {
      toast.error("Please select files and add description");
      return;
    }

    setLoading(true);

    try {
      const uploadedFiles = [];

      for (const file of selectedFiles) {
        const fileRef = ref(
          storage,
          `Conclaves/${conclaveId}/${meetingId}/${Date.now()}_${file.name}`
        );

        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);

        uploadedFiles.push({
          name: file.name,
          url,
        });
      }

      const docRef = doc(
        db,
        COLLECTIONS.conclaves,
        conclaveId,
        "meetings",
        meetingId
      );

      await updateDoc(docRef, {
        documentUploads: [
          ...uploads,
          {
            description,
            files: uploadedFiles,
            timestamp: Date.now(),
          },
        ],
      });

      toast.success("Documents uploaded");

      setSelectedFiles([]);
      setDescription("");
      fetchUploads();
      fetchData?.();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    }

    setLoading(false);
  };

  /* ================= DELETE ================= */

  const openDelete = (timestamp) => {
    setSelectedTimestamp(timestamp);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const updated = uploads.filter(
        (u) => u.timestamp !== selectedTimestamp
      );

      const docRef = doc(
        db,
        COLLECTIONS.conclaves,
        conclaveId,
        "meetings",
        meetingId
      );

      await updateDoc(docRef, {
        documentUploads: updated,
      });

      toast.success("Document deleted");
      setDeleteOpen(false);
      fetchUploads();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  /* ================= TABLE ================= */

  const columns = [
    { key: "no", label: "#" },
    { key: "desc", label: "Description" },
    { key: "date", label: "Uploaded On" },
    { key: "files", label: "Files" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="space-y-6">

      {/* ================= EXISTING UPLOADS ================= */}
      <Card>
        <Text variant="h2">Uploaded Documents</Text>
      </Card>

      <Card>
        <Table>
          <TableHeader columns={columns} />
          <tbody>
            {uploads.length === 0 ? (
              <TableRow>
                <td colSpan={5} className="px-4 py-4 text-center">
                  No documents uploaded
                </td>
              </TableRow>
            ) : (
              uploads.map((upload, index) => (
                <TableRow key={upload.timestamp}>
                  <td className="px-4 py-3">{index + 1}</td>

                  <td className="px-4 py-3">
                    {upload.description}
                  </td>

                  <td className="px-4 py-3">
                    {new Date(upload.timestamp).toLocaleString("en-IN")}
                  </td>

                  <td className="px-4 py-3">
                    <ul className="list-disc pl-4">
                      {upload.files.map((file, i) => (
                        <li key={i}>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            {file.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </td>

                  <td className="px-4 py-3">
                    <Button
                      variant="danger"
                      onClick={() =>
                        openDelete(upload.timestamp)
                      }
                    >
                      Delete
                    </Button>
                  </td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      {/* ================= UPLOAD FORM ================= */}
      <Card className="space-y-6">
        <Text variant="h2">Upload Meeting Documents</Text>

        <FormField label="Select Files" required>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            ref={fileInputRef}
            onChange={(e) =>
              setSelectedFiles(Array.from(e.target.files))
            }
          />
        </FormField>

        {selectedFiles.length > 0 && (
          <ul className="list-disc pl-4">
            {selectedFiles.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
        )}

        <FormField label="Description" required>
          <Textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />
        </FormField>

        <div className="flex justify-end">
          <Button onClick={handleUpload}>
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </Card>

      <ConfirmModal
        open={deleteOpen}
        title="Delete Document"
        description="Are you sure you want to delete this upload?"
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />

    </div>
  );
}

