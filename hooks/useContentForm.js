"use client";
import { useState } from "react";

export function useContentForm() {
  const [form, setForm] = useState({
    contentName: "",
    contentType: "Normal",
    contentFormat: "",
    description: "",
    categoryId: "",
    categoryName: "",
    partnerId: "",
    partnerName: "",
    partnerDesig: "",
    tags: [],
    videoUrl: "",
    blogUrl: "",
    ownerType: "UJB",
    owner: null,
    status: "draft",
  });

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    setForm(prev => ({
      ...prev,
      contentName: "",
      description: "",
      tags: [],
      videoUrl: "",
      blogUrl: "",
      status: "draft",
    }));
  };

  return { form, update, reset };
}