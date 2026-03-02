'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';
import { encryptData, decryptData } from '@/utils/encryption';

/* ---------------- FILE HELPERS ---------------- */

function generateFileName(ujbcode, category, description, file) {
  const date = new Date();
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const DD = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  const timestamp = `${YYYY}${MM}${DD}T${hh}${mm}${ss}`;
  const ext = (file?.name || '').split('.').pop();
  return `${ujbcode}_${timestamp}_${category}_${description}.${ext}`;
}

function getBasePath(ujbcode, mobile) {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `UserAssets/${year}/${month}/${ujbcode}-${mobile}`;
}

async function uploadWithMeta(file, fullPath) {
  const fileRef = ref(storage, fullPath);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return {
    url,
    path: fullPath,
    fileName: fullPath.split('/').pop()
  };
}

/* ---------------- MAIN HOOK ---------------- */

export default function useOrbiterProfile(ujbcode, toast) {
  const [loading, setLoading] = useState(false);
  const [docId, setDocId] = useState('');
  const [formData, setFormData] = useState({});
  const [residentStatus, setResidentStatus] = useState('');
  const [taxSlab, setTaxSlab] = useState('');

  /* PROFILE PHOTO */
  const [profilePic, setProfilePic] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');

  const [serviceImagesTemp, setServiceImagesTemp] = useState({});

  /* PERSONAL KYC */
  const [personalKYC, setPersonalKYC] = useState({
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    addressProof: null,
  });

  const [personalKYCPreview, setPersonalKYCPreview] = useState({
    aadhaarFront: "",
    aadhaarBack: "",
    panCard: "",
    addressProof: "",
  });

  /* BUSINESS KYC */
  const [businessKYC, setBusinessKYC] = useState({
    gst: null,
    shopAct: null,
    businessPan: null,
    cheque: null,
    addressProof: null,
  });

  const [businessKYCPreview, setBusinessKYCPreview] = useState({
    gst: "",
    shopAct: "",
    businessPan: "",
    cheque: "",
    addressProof: "",
  });

  /* BANK PROOF */
  const [bankProofFile, setBankProofFile] = useState(null);
  const [bankProofPreview, setBankProofPreview] = useState('');

  /* ---------------- MULTI ACHIEVEMENTS ---------------- */

  const [achievementFiles, setAchievementFiles] = useState([]);
  const [achievementPreviews, setAchievementPreviews] = useState([]);



  /* ---------------- FETCH USER ---------------- */

  useEffect(() => {
    const fetchUser = async () => {
      if (!ujbcode) return;

      try {
        const q = query(
          collection(db, COLLECTIONS.userDetail),
          where('UJBCode', '==', ujbcode)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const data = userDoc.data();

          setDocId(userDoc.id);
          setFormData(data);

          setResidentStatus(data.residentStatus || '');
          setTaxSlab(data.taxSlab || '');

          if (data.ProfilePhotoURL) {
            setProfilePreview(data.ProfilePhotoURL);
          }

          /* PERSONAL KYC PREVIEW */
          if (data.personalKYC) {
            setPersonalKYCPreview({
              aadhaarFront: data.personalKYC?.aadhaarFront?.url || "",
              aadhaarBack: data.personalKYC?.aadhaarBack?.url || "",
              panCard: data.personalKYC?.panCard?.url || "",
              addressProof: data.personalKYC?.addressProof?.url || "",
            });
          }

          /* BUSINESS KYC PREVIEW */
          if (data.businessKYC) {
            setBusinessKYCPreview({
              gst: data.businessKYC?.gst?.url || "",
              shopAct: data.businessKYC?.shopAct?.url || "",
              businessPan: data.businessKYC?.businessPan?.url || "",
              cheque: data.businessKYC?.cheque?.url || "",
              addressProof: data.businessKYC?.addressProof?.url || "",
            });
          }

          /* BANK PREVIEW */
          if (data.bankDetails?.proofFile?.url) {
            setBankProofPreview(data.bankDetails.proofFile.url);
          }
if (data.bankDetails) {
  setFormData(prev => ({
    ...prev,
    bankDetails: {
      ...data.bankDetails, // 🔥 keep all existing fields
      accountHolderName: decryptData(data.bankDetails.accountHolderName),
      bankName: decryptData(data.bankDetails.bankName),
      accountNumber: decryptData(data.bankDetails.accountNumber),
      ifscCode: decryptData(data.bankDetails.ifscCode),
    }
  }));
}
       

          if (data.achievementCertificates?.length) {
            setAchievementPreviews(
              data.achievementCertificates.map(file => ({
                name: file.fileName,
                size: '',
                preview: file.url,
                type: 'saved'
              }))
            );
          }

        }
      } catch (e) {
        toast.error('Failed to load profile');
      }
    };

    fetchUser();
  }, [ujbcode]);


  useEffect(() => {
    if (!formData?.achievementCertificates) return;

    const mapped = formData.achievementCertificates.map((item) => {
      const isPDF =
        item.fileName?.toLowerCase().endsWith(".pdf") ||
        item.url?.toLowerCase().includes(".pdf");

      return {
        ...item,
        preview: isPDF ? "PDF" : item.url,
        isNew: false
      };
    });

    setAchievementPreviews(mapped);
  }, [formData?.achievementCertificates]);

  /* ---------------- HANDLERS ---------------- */

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleResidentChange = (value) => {
    setResidentStatus(value);
    if (value === 'Resident') setTaxSlab('5%');
    else if (value === 'Non-Resident') setTaxSlab('20%');
    else setTaxSlab('');
  };

  const handleProfilePhotoChange = (file) => {
    setProfilePic(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handlePersonalKYCChange = (field, file) => {
    setPersonalKYC(prev => ({ ...prev, [field]: file }));
    setPersonalKYCPreview(prev => ({
      ...prev,
      [field]: URL.createObjectURL(file)
    }));
  };

  const handleAchievementFilesChange = (files) => {
    if (!files || files.length === 0) return;

    const mapped = Array.from(files).map((file) => {
      const isPDF = file.type === "application/pdf";

      return {
        file,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        preview: isPDF ? "PDF" : URL.createObjectURL(file),
        isNew: true
      };
    });

    setAchievementPreviews((prev) => [...prev, ...mapped]);
  };



  const removeAchievementFile = (indexToRemove) => {
    setAchievementPreviews((prev) =>
      prev.filter((_, i) => i !== indexToRemove)
    );
  };




  const handleServiceImagesChange = (index, files) => {
    const valid = [...files].slice(0, 5);

    setServiceImagesTemp(prev => ({
      ...prev,
      [index]: valid
    }));
  };

  const removeServiceImage = (index, fileIndex) => {
    setServiceImagesTemp(prev => {
      const updated = [...(prev[index] || [])];
      updated.splice(fileIndex, 1);

      return {
        ...prev,
        [index]: updated
      };
    });
  };


  const handleBusinessKYCChange = (field, file) => {
    setBusinessKYC(prev => ({ ...prev, [field]: file }));
    setBusinessKYCPreview(prev => ({
      ...prev,
      [field]: URL.createObjectURL(file)
    }));
  };

  const handleBankProofChange = (file) => {
    setBankProofFile(file);
    setBankProofPreview(URL.createObjectURL(file));
  };


  const approveBusiness = async () => {
    try {
      if (!docId) return;

      const startDate = new Date();
      const nextRenewal = new Date();
      nextRenewal.setFullYear(startDate.getFullYear() + 1);

      const subscriptionData = {
        startDate: startDate.toISOString(),
        nextRenewalDate: nextRenewal.toISOString(),
        approvedOn: startDate.toISOString(),
        status: 'active',
      };

      const userRef = doc(db, COLLECTIONS.userDetail, docId);

      await updateDoc(userRef, {
        subscription: subscriptionData,
      });

      // update local state
      setFormData((prev) => ({
        ...prev,
        subscription: subscriptionData,
      }));

      toast.success('Business approved successfully');
    } catch (err) {
      console.error(err);
      toast.error('Approval failed');
    }
  };

  function extractAllTags(data) {
    const tags = new Set();

    const add = (arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach(t => {
        if (t && t !== '—') tags.add(t.trim());
      });
    };

    add(data.Skills);
    add(data.LanguagesKnown);
    add(data.InterestArea);
    add(data.HealthParameters);
    add(data.Hobbies);

    data.services?.forEach(s => {
      add(s.keywords);
      add(s.targetAudience);
      add(s.proofPoints);
    });

    data.products?.forEach(p => {
      add(p.keywords);
    });

    return Array.from(tags);
  }


  /* ---------------- SAVE ---------------- */

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const mobile = formData?.MobileNo || 'nomobile';
      const basePath = getBasePath(ujbcode, mobile);

      let profileURL = formData.ProfilePhotoURL || "";
      if (profilePic) {
        const fileName = generateFileName(ujbcode, 'profile', 'photo', profilePic);
        const meta = await uploadWithMeta(profilePic, `${basePath}/profile/${fileName}`);
        profileURL = meta.url;
      }

      /* PERSONAL KYC */
      const personalKycData = { ...formData.personalKYC };

      for (const key in personalKYC) {
        if (personalKYC[key]) {
          const fileName = generateFileName(ujbcode, "kyc", key, personalKYC[key]);
          personalKycData[key] = await uploadWithMeta(
            personalKYC[key],
            `${basePath}/PersonalKYC/${fileName}`
          );
        }
      }

      /* BUSINESS KYC */
      const businessKycData = { ...formData.businessKYC };

      for (const key in businessKYC) {
        if (businessKYC[key]) {
          const fileName = generateFileName(ujbcode, "businessKYC", key, businessKYC[key]);
          businessKycData[key] = await uploadWithMeta(
            businessKYC[key],
            `${basePath}/BusinessKYC/${fileName}`
          );
        }
      }

      /* BANK */
   /* ---------------- BANK ---------------- */

let encryptedBankDetails = null;

if (formData.bankDetails) {
  encryptedBankDetails = {
    accountHolderName: encryptData(formData.bankDetails.accountHolderName || ''),
    bankName: encryptData(formData.bankDetails.bankName || ''),
    accountNumber: encryptData(formData.bankDetails.accountNumber || ''),
    ifscCode: encryptData(formData.bankDetails.ifscCode || ''),
    proofType: formData.bankDetails.proofType || '',
    proofFile: null
  };
}

/* Upload new file if selected */
if (bankProofFile) {
  const fileName = generateFileName(
    ujbcode,
    "bank",
    "proof",
    bankProofFile
  );

  const meta = await uploadWithMeta(
    bankProofFile,
    `${basePath}/Bank/${fileName}`
  );

  encryptedBankDetails.proofFile = meta; // ✅ store metadata only
}

/* If no new file but old metadata exists */
if (!bankProofFile && formData.bankDetails?.proofFile?.url) {
  encryptedBankDetails.proofFile =
    formData.bankDetails.proofFile;
}

      const finalServices = await Promise.all(
        (formData.services || []).map(async (srv, index) => {
          const tempFiles = serviceImagesTemp[index] || [];
          let uploadedImages = srv.images || [];

          for (let i = 0; i < tempFiles.length; i++) {
            const file = tempFiles[i];

            const fileName = generateFileName(
              ujbcode,
              'service',
              `img_${index}_${i}`,
              file
            );

            const path = `${basePath}/Services/${fileName}`;
            const meta = await uploadWithMeta(file, path);

            uploadedImages.push({
              url: meta.url,
              name: file.name,
              size: file.size,
              type: file.type,
              isCover: uploadedImages.length === 0
            });
          }

          return {
            ...srv,
            images: uploadedImages
          };
        })
      );


      /* ---------------- FINAL ACHIEVEMENT SAVE LOGIC ---------------- */

      let finalAchievements = [];

      /* 1️⃣ Keep existing files still visible */
      achievementPreviews.forEach((item) => {
        if (!item.isNew && item.url) {
          finalAchievements.push({
            fileName: item.fileName,
            path: item.path,
            url: item.url
          });
        }
      });

      /* 2️⃣ Upload new files */
      const newItems = achievementPreviews.filter(
        (item) => item.isNew && item.file
      );

      for (let i = 0; i < newItems.length; i++) {
        const file = newItems[i].file;

        const fileName = generateFileName(
          ujbcode,
          "achievement",
          `certificate_${i}`,
          file
        );

        const meta = await uploadWithMeta(
          file,
          `${basePath}/Achievements/${fileName}`
        );

        finalAchievements.push({
          fileName: meta.fileName,
          path: meta.path,
          url: meta.url
        });
      }




      const finalData = {
        ...formData,
        residentStatus,
        taxSlab,
        ProfilePhotoURL: profileURL,
        personalKYC: personalKycData,
        businessKYC: businessKycData,
        bankDetails: encryptedBankDetails,
        services: finalServices,
        achievementCertificates: finalAchievements,
      };

      const userRef = doc(db, COLLECTIONS.userDetail, docId);
      await updateDoc(userRef, finalData);

      toast.success('Profile updated successfully');

    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleResidentChange,
    residentStatus,
    taxSlab,
    profilePreview,
    handleProfilePhotoChange,
    personalKYCPreview,
    handlePersonalKYCChange,
    businessKYCPreview,
    handleBusinessKYCChange,
    bankProofPreview,
    handleBankProofChange,
    handleSubmit,
    loading,
    serviceImagesTemp,
    handleServiceImagesChange,
    removeServiceImage,
    // 🔥 ADD THESE
    approveBusiness,
    achievementPreviews,
    handleAchievementFilesChange,
    removeAchievementFile
  };


}
