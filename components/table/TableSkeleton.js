export default function TableSkeleton({ rows = 6, columns = 4 }) {
  return (
    <div className="rounded-lg border border-border bg-background">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex border-b border-border last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="flex-1 px-4 py-3"
            >
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
