"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  deleteBirthdayEntry,
  fetchBirthdayEntries,
} from "@/services/adminBirthdayService";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";

const PAGE_SIZE = 10;

export default function BirthdayListClient() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setRows(await fetchBirthdayEntries());
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to fetch data", "error");
      }
    }

    load();
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This Canva will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteBirthdayEntry(id);
      setRows((prev) => prev.filter((row) => row.id !== id));
      Swal.fire("Deleted!", "Canva deleted successfully", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to delete", "error");
    }
  };

  const getDaysLeft = (dob) => {
    if (!dob) return "-";

    const today = new Date();
    const birth = new Date(dob);
    const nextBirthday = new Date(
      today.getFullYear(),
      birth.getMonth(),
      birth.getDate()
    );

    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextBirthday - today;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    return `${days} days`;
  };

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  return (
    <Card>
      <Text variant="h2">Birthday Canva Status</Text>

      <div className="mt-6">
        <Table>
          <TableHeader
            columns={[
              { label: "Name" },
              { label: "Phone" },
              { label: "DOB" },
              { label: "Upcoming" },
              { label: "Image" },
              { label: "Action" },
            ]}
          />

          <tbody>
            {paginatedRows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center">
                  No data found
                </td>
              </tr>
            )}

            {paginatedRows.map((row) => (
              <TableRow key={row.id}>
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3">{row.phone}</td>
                <td className="px-4 py-3">
                  {new Date(row.dob).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })}
                </td>
                <td className="px-4 py-3">{getDaysLeft(row.dob)}</td>
                <td className="px-4 py-3">
                  {row.imageUrl ? (
                    <img
                      src={row.imageUrl}
                      alt="birthday"
                      className="h-12 w-12 rounded-full border object-cover"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="rounded bg-red-500 px-3 py-1 text-sm text-white transition hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm">
            Page {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </Card>
  );
}


