import { useCallback, useEffect, useMemo, useState } from "react";

import {
  checkBirthdayEntryExists,
  fetchBirthdayUserOptions,
  saveBirthdayEntry,
} from "@/services/adminBirthdayService";
import { uploadBirthdayImage } from "@/services/birthdayImageUploadService";
import { getBirthdayDobInfo } from "@/services/birthdayShared";

export function useBirthdayCanvaForm(toast) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [dob, setDob] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [existing, setExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const result = await fetchBirthdayUserOptions();
      setUsers(result);
    } catch (error) {
      console.error(error);
      toast?.error("Failed to load users");
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const exactMatch = users.find(
      (user) => user.label.toLowerCase() === search.toLowerCase()
    );

    if (exactMatch) {
      setSelectedUser(exactMatch.value);
    }
  }, [search, users]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        user.label.toLowerCase().includes(search.toLowerCase())
      ),
    [search, users]
  );

  const selectedUserData = useMemo(
    () => users.find((user) => String(user.value) === String(selectedUser)),
    [selectedUser, users]
  );

  useEffect(() => {
    setDob(selectedUserData?.dob || "");
  }, [selectedUserData]);

  useEffect(() => {
    if (!selectedUser) {
      setExisting(false);
      return;
    }

    checkBirthdayEntryExists(selectedUser).then(setExisting).catch((error) => {
      console.error(error);
      setExisting(false);
    });
  }, [selectedUser]);

  const dobInfo = useMemo(() => getBirthdayDobInfo(dob), [dob]);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const resetForm = useCallback(() => {
    setSearch("");
    setSelectedUser("");
    setDob("");
    setImage(null);
    setPreview("");
    setExisting(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedUserData || !dob) {
      toast?.error("Please select a user with a valid date of birth");
      return;
    }

    if (!image) {
      toast?.error("Please upload a birthday image before saving");
      return;
    }

    setSaving(true);

    try {
      const imageUrl = await uploadBirthdayImage(selectedUserData.value, image);
      await saveBirthdayEntry({
        selectedUserData,
        dob,
        imageUrl,
      });

      toast?.success("Birthday creative saved successfully");
      resetForm();
    } catch (error) {
      console.error(error);
      toast?.error("Failed to upload the birthday image or save the entry");
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  }, [dob, image, resetForm, selectedUserData, toast]);

  return {
    dob,
    dobInfo,
    existing,
    filteredUsers,
    handleFileChange,
    handleSave,
    preview,
    saving,
    search,
    selectedUser,
    selectedUserData,
    setDob,
    setSearch,
    setSelectedUser,
    setShowConfirm,
    showConfirm,
  };
}
