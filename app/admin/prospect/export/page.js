"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export default function ExportProspects() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prospects", {
        credentials: "include",
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload.message || "Failed to load prospects");
      }

      const prospects = Array.isArray(payload.prospects) ? payload.prospects : [];

      const rows = prospects.map((item) => ({
        id: item.id || "",
        prospectName: item.prospectName || "",
        prospectPhone: item.prospectPhone || "",
        email: item.email || "",
        occupation: item.occupation || "",
        orbiterName: item.orbiterName || "",
        orbiterContact: item.orbiterContact || "",
        type: item.type || "",
        userType: item.userType || "",
        source: item.source || "",
        status: item.status || "",
        nextFollowupDate: item.nextFollowupDate || "",
        lastEngagementDate: item.lastEngagementDate || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Prospects");
      XLSX.writeFile(workbook, "Prospects_Export.xlsx");
    } catch (error) {
      console.error("Prospect export failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="m-button-5" onClick={handleExport} disabled={loading}>
      {loading ? "Exporting..." : "Export"}
    </button>
  );
}
