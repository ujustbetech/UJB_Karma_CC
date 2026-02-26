"use client";

import { useState } from "react";
import DataTableHeader from "./DataTableHeader";
import DataTableRow from "./DataTableRow";
import DataTableSkeleton from "./DataTableSkeleton";

export default function DataTable({
  columns,
  data,
  loading = false,
  bulkActions,
  headerActions,
  onSort,
}) {
  const [selectedRows, setSelectedRows] = useState([]);
  const [sort, setSort] = useState(null);

  const toggleAll = (checked) => {
    setSelectedRows(checked ? data.map((row) => row.id) : []);
  };

  const toggleRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id)
        ? prev.filter((r) => r !== id)
        : [...prev, id]
    );
  };

  const handleSort = (key) => {
    const next =
      sort?.key === key && sort.direction === "asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" };

    setSort(next);
    onSort?.(next);
  };

  if (loading) return <DataTableSkeleton columns={columns} />;

  return (
    <div className="rounded-md border border-border bg-background">
      <DataTableHeader
        columns={columns}
        allSelected={
          data.length > 0 && selectedRows.length === data.length
        }
        onToggleAll={toggleAll}
        sort={sort}
        onSort={handleSort}
        bulkActions={bulkActions}
        headerActions={headerActions}
        selectedCount={selectedRows.length}
      />

      <div className="divide-y divide-border">
        {data.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No records found.
          </div>
        ) : (
          data.map((row) => (
            <DataTableRow
              key={row.id}
              row={row}
              columns={columns}
              selected={selectedRows.includes(row.id)}
              onToggle={() => toggleRow(row.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
