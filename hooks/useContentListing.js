import { useCallback, useEffect, useMemo, useState } from "react";

import {
  deleteContentEntry,
  fetchContentListing,
} from "@/services/contentService";

export function useContentListing(toast) {
  const [content, setContent] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [partnerFilter, setPartnerFilter] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const perPage = 10;

  const loadContent = useCallback(async () => {
    setLoading(true);

    try {
      const data = await fetchContentListing();
      setContent(data);
    } catch (error) {
      console.error(error);
      toast?.error("Failed to fetch content");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const filtered = useMemo(() => {
    return content.filter((item) => {
      const nameMatch = (item.name || "")
        .toLowerCase()
        .includes(search.toLowerCase());

      const partnerMatch = partnerFilter
        ? item.partnerType.toLowerCase().includes(partnerFilter.toLowerCase())
        : true;

      const typeMatch = typeFilter
        ? item.type.toLowerCase().includes(typeFilter.toLowerCase())
        : true;

      const statusMatch = statusFilter ? item.status === statusFilter : true;

      return nameMatch && partnerMatch && typeMatch && statusMatch;
    });
  }, [content, partnerFilter, search, statusFilter, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [partnerFilter, search, statusFilter, typeFilter]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page]
  );

  const resetFilters = useCallback(() => {
    setSearch("");
    setPartnerFilter("");
    setTypeFilter("");
    setStatusFilter("");
  }, []);

  const openDelete = useCallback((item) => {
    setContentToDelete(item);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!contentToDelete?.id) return;

    await deleteContentEntry(contentToDelete.id);
    toast?.success("Content deleted");
    setDeleteOpen(false);
    setContentToDelete(null);
    await loadContent();
  }, [contentToDelete, loadContent, toast]);

  return {
    confirmDelete,
    contentToDelete,
    deleteOpen,
    filtered,
    loading,
    openDelete,
    page,
    paginated,
    partnerFilter,
    perPage,
    resetFilters,
    search,
    setDeleteOpen,
    setPage,
    setPartnerFilter,
    setSearch,
    setStatusFilter,
    setTypeFilter,
    statusFilter,
    typeFilter,
  };
}
