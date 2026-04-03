"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

import Swal from "sweetalert2";

import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";

import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";

const PAGE_SIZE = 10;

export default function BirthdayListClient() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);

  /* ---------------- FETCH ---------------- */

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(
          collection(db, COLLECTIONS.birthdayCanva)
        );

        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setRows(data);
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to fetch data ❌", "error");
      }
    }

    load();
  }, []);

  /* ---------------- DELETE ---------------- */

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
      await deleteDoc(doc(db, COLLECTIONS.birthdayCanva, id));

      // remove from UI instantly
      setRows((prev) => prev.filter((row) => row.id !== id));

      Swal.fire("Deleted!", "Canva deleted successfully ✅", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to delete ❌", "error");
    }
  };

  /* ---------------- DAYS CALCULATION ---------------- */

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

    if (days === 0) return "🎉 Today";
    return `${days} days`;
  };

  /* ---------------- PAGINATION ---------------- */

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  /* ---------------- UI ---------------- */

  return (
    <Card>
      <Text variant="h2">🎂 Birthday Canva Status</Text>

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
                <td colSpan={6} className="text-center py-6">
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

                <td className="px-4 py-3">
                  {getDaysLeft(row.dob)}
                </td>

                <td className="px-4 py-3">
                  {row.imageUrl ? (
                    <img
                      src={row.imageUrl}
                      alt="birthday"
                      className="w-12 h-12 rounded-full object-cover border"
                    />
                  ) : (
                    "-"
                  )}
                </td>

                {/* DELETE BUTTON */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-end mt-4 gap-3 items-center">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm">
            Page {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </Card>
  );
}
