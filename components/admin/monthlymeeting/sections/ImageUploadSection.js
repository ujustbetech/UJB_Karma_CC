'use client';

import { useEffect, useState } from 'react';
import { db, storage } from '@/firebaseConfig';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/utility_collection';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import ActionButton from '@/components/ui/ActionButton';
import { FormField, Select, Textarea } from '@/components/ui/form';
import { useToast } from '@/components/ui/ToastProvider';
import ConfirmModal from '@/components/ui/ConfirmModal';

import { FileText, Trash2, UploadCloud } from 'lucide-react';

export default function ImageUploadSection({ eventID, fetchData }) {
  const toast = useToast();

  const [sections, setSections] = useState([
    { id: Date.now(), type: '', image: null, description: '' },
  ]);

  const [uploadedImages, setUploadedImages] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [errors, setErrors] = useState({});

  // PRO states
  const [previewImages, setPreviewImages] = useState({});
  const [dragging, setDragging] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [progress, setProgress] = useState(0);
  const [viewer, setViewer] = useState(null);

  const fetchImages = async () => {
    const docRef = doc(db, COLLECTIONS.monthlyMeeting, eventID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setUploadedImages(docSnap.data().imageUploads || []);
    }
  };

  useEffect(() => {
    if (eventID) fetchImages();
  }, [eventID]);

  const clearError = (key) => {
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const handleFileChange = (index, file) => {
    const updated = [...sections];
    updated[index].image = file;
    setSections(updated);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImages((prev) => ({
        ...prev,
        [index]: url,
      }));
    }
  };

  const validate = (section, index) => {
    const newErrors = {};
    if (!section.type) newErrors[`type_${index}`] = 'Type is required';
    if (!section.image) newErrors[`image_${index}`] = 'Image is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async (index) => {
    const section = sections[index];   // ✅ FIRST define section

    if (!section || !section.image) {
      toast.error("Please select an image");
      return;
    }

    if (!section.type) {
      toast.error("Please select type");
      return;
    }

    try {
      setUploadingIndex(index);
      setProgress(10);

      const fileRef = ref(
        storage,
        `${COLLECTIONS.monthlyMeeting}/${eventID}/${section.type}/${Date.now()}_${section.image.name}`
      );

      const uploadTask = uploadBytesResumable(fileRef, section.image);

      uploadTask.on(
        'state_changed',
        (snap) => {
          const percent =
            (snap.bytesTransferred / snap.totalBytes) * 100;
          setProgress(Math.round(percent));
        },
        (err) => {
          console.error(err);
          toast.error('Upload failed');
          setUploadingIndex(null);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);

          const eventRef = doc(db, COLLECTIONS.monthlyMeeting, eventID);
          await updateDoc(eventRef, {
            imageUploads: arrayUnion({
              type: section.type,
              description: section.description,
              image: {
                name: section.image.name,
                url,
              },
              timestamp: new Date().toISOString(),
            }),
          });

          toast.success('Image uploaded');

          const updated = [...sections];
          updated[index] = {
            id: Date.now(),
            type: '',
            image: null,
            description: '',
          };

          setSections(updated);
          setPreviewImages((p) => ({ ...p, [index]: null }));

          setProgress(100);

          setTimeout(() => {
            setUploadingIndex(null);
            setProgress(0);
          }, 500);

          fetchData?.();
          fetchImages();
        }
      );
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
      setUploadingIndex(null);
    }
  };


  const handleDeleteImage = async () => {
    const upload = confirmDelete;
    if (!upload) return;

    try {
      const fileRef = ref(storage, upload.image.url);
      await deleteObject(fileRef);

      const docRef = doc(db, COLLECTIONS.monthlyMeeting, eventID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const updatedUploads = (docSnap.data().imageUploads || []).filter(
          (item) => item.image.url !== upload.image.url
        );

        await updateDoc(docRef, { imageUploads: updatedUploads });
        toast.success('Image deleted');
        fetchImages();
      }
    } catch (e) {
      console.error(e);
      toast.error('Delete failed');
    } finally {
      setConfirmDelete(null);
    }
  };

  const addSection = () => {
    setSections([
      ...sections,
      { id: Date.now(), type: '', image: null, description: '' },
    ]);
  };

  const removeSection = (index) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-7">

      {/* ========== Uploaded Images Gallery ========== */}
      <Card className="p-7 space-y-6">
        

        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-purple-600" />
          <Text as="h2">Creative</Text>
          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
            {uploadedImages.length}
          </span>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
          {uploadedImages.map((upload, index) => (
            <div key={index} className="mb-5 break-inside-avoid group">
              <Card className="p-3 border rounded-xl overflow-hidden">
                <div
                  className="relative cursor-pointer"
                  onClick={() => setViewer(upload.image.url)}
                >
                  <img
                    src={upload.image.url}
                    className="w-full rounded-lg"
                  />

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <ActionButton
                      icon={Trash2}
                      label=""
                      variant="ghostDanger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(upload);
                      }}
                    />
                  </div>
                </div>

                <Text className="mt-2 font-medium">{upload.type}</Text>

                <div
                  className="text-xs text-slate-500"
                  dangerouslySetInnerHTML={{ __html: upload.description }}
                />
              </Card>
            </div>
          ))}
        </div>
      </Card>

      {/* ========== Upload Form ========== */}
      <Card className="p-7 space-y-6">
        <Text as="h2" className="text-lg font-semibold">
          Upload Image Creatives
        </Text>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <Card key={section.id} className="p-6 space-y-4 border rounded-xl">

              <div className="flex justify-between items-center">
                <Text className="font-semibold">
                  Image Section {index + 1}
                </Text>

                {sections.length > 1 && (
                  <ActionButton
                    icon={Trash2}
                    label=""
                    variant="ghostDanger"
                    onClick={() => removeSection(index)}
                  />
                )}
              </div>

              <FormField
                label="Type"
                error={errors[`type_${index}`]}
                required
              >
                <Select
                  value={section.type}
                  onChange={(value) =>
                    handleInputChange(index, 'type', value)
                  }
                  options={[
                    { label: 'WhatsApp', value: 'WhatsApp' },
                    { label: 'Banner', value: 'Banner' },
                    { label: 'Email', value: 'Email' },
                  ]}
                />
              </FormField>

              <FormField
                label="Image"
                error={errors[`image_${index}`]}
                required
              >
                <label
                  className={`
      border-2 border-dashed rounded-xl p-6 text-center cursor-pointer block
      ${dragging ? 'bg-blue-50 border-blue-400' : 'border-slate-300'}
    `}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    handleFileChange(index, e.dataTransfer.files[0]);
                  }}
                >
                  {previewImages[index] ? (
                    <img
                      src={previewImages[index]}
                      className="h-40 mx-auto rounded-lg"
                    />
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                      <p className="text-slate-500">
                        Click or Drop image here
                      </p>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      clearError(`image_${index}`);
                      handleFileChange(index, e.target.files[0]);
                    }}
                  />
                </label>
              </FormField>


              <FormField label="Description">
                <Textarea
                  value={section.description}
                  onChange={(e) =>
                    handleInputChange(index, 'description', e.target.value)
                  }
                />
              </FormField>

              <Button onClick={() => handleUpload(index)}>
                Upload Image
              </Button>

              {uploadingIndex === index && (
                <div className="w-full bg-gray-200 h-2 rounded">
                  <div
                    className="bg-blue-600 h-2 rounded"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </Card>
          ))}

          <Button variant="secondary" onClick={addSection}>
            + Add Image Section
          </Button>
        </div>
      </Card>

      {/* Fullscreen Viewer */}
      {viewer && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
          onClick={() => setViewer(null)}
        >
          <img
            src={viewer}
            className="max-h-[90%] max-w-[90%] rounded-xl shadow-2xl"
          />
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete image?"
        description="This image will be permanently removed."
        onConfirm={handleDeleteImage}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}
