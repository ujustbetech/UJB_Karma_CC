'use client';

import { useEffect, useRef, useState } from 'react';

import { doc, updateDoc, getDoc, db } from '@/services/adminMonthlyMeetingFirebaseService';
import { COLLECTIONS } from '@/lib/utility_collection';
import {
  appendMonthlyMeetingAuditLogs,
  buildMonthlyMeetingAuditEntry,
  diffMonthlyMeetingFields,
} from '@/lib/monthlymeeting/monthlyMeetingAudit.mjs';
import {
  deleteAdminMonthlyMeetingFile,
  uploadAdminMonthlyMeetingFile,
} from '@/services/adminMonthlyMeetingService';

import {
  FileText,
  UploadCloud,
  File,
  Trash2,
  Clock,
  Search,
  Eye
} from 'lucide-react';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormField, Textarea } from '@/components/ui/form';
import { useToast } from '@/components/ui/ToastProvider';
import ConfirmModal from '@/components/ui/ConfirmModal';

const CATEGORIES = ['Agenda', 'Minutes', 'Report', 'Finance', 'General'];

export default function DocumentUploadSection({ eventID, fetchData, currentAdmin }) {
  const toast = useToast();

  const [selectedDocs, setSelectedDocs] = useState([]);
  const [docDescription, setDocDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [documentUploads, setDocumentUploads] = useState([]);
  const [search, setSearch] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fileInputRef = useRef(null);

  const fetchDocs = async () => {
    const refDoc = doc(db, COLLECTIONS.monthlyMeeting, eventID);
    const snap = await getDoc(refDoc);
    if (snap.exists()) {
      setDocumentUploads(snap.data().documentUploads || []);
    }
  };

  useEffect(() => {
    if (eventID) fetchDocs();
  }, [eventID]);

  const handleUpload = async () => {
    if (!selectedDocs.length || !docDescription) {
      toast.error('Select files & enter description');
      return;
    }

    setLoading(true);
    const uploaded = [];
    const refDoc = doc(db, COLLECTIONS.monthlyMeeting, eventID);
    const snap = await getDoc(refDoc);
    const currentUploads = snap.exists() ? snap.data().documentUploads || [] : [];

    for (const file of selectedDocs) {
      const upload = await uploadAdminMonthlyMeetingFile(eventID, {
        file,
        module: 'meetingMedia',
        folder: 'documents',
      });
      uploaded.push({
        name: file.name,
        url: upload.url,
        path: upload.path,
      });
      setProgress(Math.round(((uploaded.length || 1) / selectedDocs.length) * 100));
    }

    const nextUploads = [
      ...currentUploads,
      {
        description: docDescription,
        category,
        files: uploaded,
        timestamp: new Date().toISOString()
      },
    ];

    await updateDoc(refDoc, {
      documentUploads: nextUploads,
      auditLogs: appendMonthlyMeetingAuditLogs(
        snap.data()?.auditLogs,
        diffMonthlyMeetingFields(
          snap.data() || {},
          { ...(snap.data() || {}), documentUploads: nextUploads },
          ['documentUploads']
        ).map((change) =>
          buildMonthlyMeetingAuditEntry({
            section: 'Documents',
            field: change.field,
            before: change.before,
            after: change.after,
            actor: currentAdmin,
          })
        ),
      ),
      updatedBy: {
        name: currentAdmin?.name || currentAdmin?.email || 'Admin',
        role: currentAdmin?.role || '',
        identity: currentAdmin?.identity?.id || currentAdmin?.email || '',
      },
      updatedAt: new Date(),
    });

    setSelectedDocs([]);
    setDocDescription('');
    setProgress(0);
    fileInputRef.current.value = '';

    fetchData?.();
    fetchDocs();
    toast.success('Uploaded');
    setLoading(false);
  };

  const handleDelete = async (upload) => {
    try {
      // Delete from storage ONLY if path exists
      for (const file of upload.files) {
        if (file.path) {
          await deleteAdminMonthlyMeetingFile(eventID, {
            path: file.path,
            module: 'meetingMedia',
          });
        }
      }

      const refDoc = doc(db, COLLECTIONS.monthlyMeeting, eventID);

      const snap = await getDoc(refDoc);
      const current = snap.data().documentUploads || [];

      const updated = current.filter(
        u => u.timestamp !== upload.timestamp
      );

      await updateDoc(refDoc, {
        documentUploads: updated,
        auditLogs: appendMonthlyMeetingAuditLogs(
          snap.data()?.auditLogs,
          diffMonthlyMeetingFields(
            snap.data() || {},
            { ...(snap.data() || {}), documentUploads: updated },
            ['documentUploads']
          ).map((change) =>
            buildMonthlyMeetingAuditEntry({
              section: 'Documents',
              field: change.field,
              before: change.before,
              after: change.after,
              actor: currentAdmin,
            })
          ),
        ),
        updatedBy: {
          name: currentAdmin?.name || currentAdmin?.email || 'Admin',
          role: currentAdmin?.role || '',
          identity: currentAdmin?.identity?.id || currentAdmin?.email || '',
        },
        updatedAt: new Date(),
      });

      fetchDocs();
      toast.success('Deleted');

    } catch (err) {
      console.error("DELETE ERROR:", err);
      toast.error('Delete failed');
    }
  };


  const filtered = documentUploads.filter(d =>
    d.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;

    try {
      // Delete files from storage if path exists
      for (const file of deleteTarget.files) {
        if (file.path) {
          await deleteAdminMonthlyMeetingFile(eventID, {
            path: file.path,
            module: 'meetingMedia',
          });
        }
      }

      const refDoc = doc(db, COLLECTIONS.monthlyMeeting, eventID);
      const snap = await getDoc(refDoc);
      const current = snap.data().documentUploads || [];

      const updated = current.filter(
        u => u.timestamp !== deleteTarget.timestamp
      );

      await updateDoc(refDoc, {
        documentUploads: updated,
        auditLogs: appendMonthlyMeetingAuditLogs(
          snap.data()?.auditLogs,
          diffMonthlyMeetingFields(
            snap.data() || {},
            { ...(snap.data() || {}), documentUploads: updated },
            ['documentUploads']
          ).map((change) =>
            buildMonthlyMeetingAuditEntry({
              section: 'Documents',
              field: change.field,
              before: change.before,
              after: change.after,
              actor: currentAdmin,
            })
          ),
        ),
        updatedBy: {
          name: currentAdmin?.name || currentAdmin?.email || 'Admin',
          role: currentAdmin?.role || '',
          identity: currentAdmin?.identity?.id || currentAdmin?.email || '',
        },
        updatedAt: new Date(),
      });

      fetchDocs();
      toast.success('Document deleted');

    } catch (err) {
      console.error("DELETE ERROR:", err);
      toast.error('Delete failed');
    }

    setConfirmOpen(false);
    setDeleteTarget(null);
  };


  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-blue-600" />
        <Text as="h2">Documents</Text>
        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
          {documentUploads.length}
        </span>
      </div>

      {/* Upload */}
      <Card className="p-5 space-y-4 border border-slate-200 rounded-xl">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            setSelectedDocs(Array.from(e.dataTransfer.files));
          }}
          className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition ${dragging ? 'bg-blue-50 border-blue-400' : 'border-slate-300'
            }`}
        >
          <UploadCloud className="w-5 h-5 mx-auto mb-2" />
          <Text>Drop files or click to upload</Text>

          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={(e) =>
              setSelectedDocs(Array.from(e.target.files || []))
            }
          />
        </div>

        {loading && (
          <div className="w-full bg-gray-200 h-2 rounded">
            <div
              className="bg-blue-600 h-2 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <FormField label="Description" required>
          <Textarea
            value={docDescription}
            onChange={(e) => setDocDescription(e.target.value)}
          />
        </FormField>

        <FormField label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 w-full"
          >
            {CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </FormField>

        <div className="flex justify-end">
          <Button onClick={handleUpload} disabled={loading}>
            Upload
          </Button>
        </div>
      </Card>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* History */}
      <div className="space-y-4">
        {filtered.map((upload, index) => (
          <Card key={index} className="p-5 border border-slate-200 rounded-xl">
            <div className="flex justify-between">
              <div>
                <Text className="font-semibold">{upload.description}</Text>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(upload.timestamp).toLocaleString()}
                </div>
              </div>

              <Trash2
                className="w-4 h-4 text-red-500 cursor-pointer"
                onClick={() => {
                  setDeleteTarget(upload);
                  setConfirmOpen(true);
                }}
              />
            </div>

            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              {upload.category || 'General'}
            </span>

            <ul className="mt-3 space-y-2">
              {upload.files.map((file, i) => (
                <li key={i} className="flex items-center gap-2">
                  <File className="w-4 h-4 text-slate-500" />
                  <span
                    className="underline cursor-pointer"
                    onClick={() => setPreviewFile(file)}
                  >
                    {file.name}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white w-[80%] h-[80%] rounded-xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe src={previewFile.url} className="w-full h-full" />
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Delete this document?"
        description="All files inside this upload will be permanently removed."
        onConfirm={handleDeleteConfirmed}
        onClose={() => setConfirmOpen(false)}
      />
    </Card>
  );
}




