import clsx from "clsx";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";

/* ================================
   Base styles
================================ */
const BASE_STYLES =
  "flex items-center justify-between border-t border-border bg-background px-4 py-2";

/* ================================
   Pagination component
================================ */
export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}) {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  return (
    <div className={BASE_STYLES}>
      {/* Left: Info */}
      <Text variant="meta">
        Page {page} of {totalPages}
      </Text>

      {/* Right: Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
