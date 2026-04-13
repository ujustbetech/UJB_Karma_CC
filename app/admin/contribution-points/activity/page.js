"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import {
  importCpActivities,
  parseCpActivityWorkbook,
} from "@/services/contributionPointService";

export default function ContributionPointActivityImportPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    setMessage("");

    if (!file) {
      setRows([]);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      setRows(parseCpActivityWorkbook(buffer));
    } catch (error) {
      console.error("Failed to parse CP activity workbook", error);
      setMessage("Could not read the selected file.");
      setRows([]);
    }
  };

  const handleImport = async () => {
    if (!rows.length) {
      setMessage("Upload a workbook before importing.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await importCpActivities(rows);
      setMessage(`Imported ${rows.length} contribution point activities.`);
    } catch (error) {
      console.error("Failed to import CP activities", error);
      setMessage("Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" variant="h1">Contribution Point Activity Import</Text>
        <Text variant="muted">
          Upload the CP activity workbook and preview rows before import.
        </Text>
      </div>

      <Card className="space-y-4 shadow-sm">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-600"
        />

        <Button onClick={handleImport} loading={loading}>
          Import Activity
        </Button>

        {message ? <Text variant="muted">{message}</Text> : null}
      </Card>

      <Card className="overflow-hidden shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <Text variant="h2">Preview</Text>
        </div>

        {rows.length === 0 ? (
          <div className="p-4">
            <Text variant="muted">No rows loaded yet.</Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Activity</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Points</th>
                  <th className="px-4 py-3 font-medium">Purpose</th>
                  <th className="px-4 py-3 font-medium">Month</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 25).map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{row.activityName}</td>
                    <td className="px-4 py-3">{row.categories.join(", ")}</td>
                    <td className="px-4 py-3">{row.points}</td>
                    <td className="px-4 py-3">{row.purpose || "-"}</td>
                    <td className="px-4 py-3">{row.month || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
