"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import StatusBadge from "@/components/ui/StatusBadge";

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
      const snap = await getDocs(
        collection(db, COLLECTIONS.birthdayCanva)
      );

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setRows(data);
    }

    load();
  }, []);

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

    // if birthday already passed this year
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

      {/* TABLE */}
      <div className="mt-6">
        <Table>
          <TableHeader
            columns={[
              { label: "Name" },
              { label: "Phone" },
              { label: "DOB" },
              { label: "Upcoming" },
              { label: "Image" },
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
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-end mt-4 gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </button>

          <span>
            Page {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </Card>
  );
}