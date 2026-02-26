import { ChevronUp, ChevronDown } from "lucide-react";

export default function DataTableHeader({
  columns,
  allSelected,
  onToggleAll,
  sort,
  onSort,
  bulkActions,
  headerActions,
  selectedCount,
}) {
  return (
    <div className="border-b border-border">
      {/* Top bar */}
      {(bulkActions || headerActions) && (
        <div className="flex items-center justify-between px-4 py-2">
          <div>
            {selectedCount > 0 && bulkActions?.(selectedCount)}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
          </div>
        </div>
      )}

      {/* Column headers */}
      <div className="grid grid-cols-[40px_repeat(auto-fit,minmax(0,1fr))] px-4 py-2 text-xs font-medium text-muted-foreground">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) => onToggleAll(e.target.checked)}
        />

        {columns.map((col) => (
          <button
            key={col.key}
            onClick={() => col.sortable && onSort(col.key)}
            className="flex items-center gap-1 text-left"
          >
            {col.label}
            {sort?.key === col.key &&
              (sort.direction === "asc" ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              ))}
          </button>
        ))}
      </div>
    </div>
  );
}
