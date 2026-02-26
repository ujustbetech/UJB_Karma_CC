export default function DataTableSkeleton({ columns }) {
  return (
    <div className="rounded-md border border-border bg-background">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[40px_repeat(auto-fit,minmax(0,1fr))] px-4 py-2 animate-pulse"
        >
          <div className="h-4 w-4 bg-muted rounded" />
          {columns.map((_, j) => (
            <div
              key={j}
              className="h-4 bg-muted rounded"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
