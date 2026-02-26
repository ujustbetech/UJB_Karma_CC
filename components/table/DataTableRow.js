export default function DataTableRow({
  row,
  columns,
  selected,
  onToggle,
}) {
  return (
    <div className="grid grid-cols-[40px_repeat(auto-fit,minmax(0,1fr))] px-4 py-2 text-sm items-center">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
      />

      {columns.map((col) => (
        <div key={col.key}>
          {col.render
            ? col.render(row[col.key], row)
            : row[col.key]}
        </div>
      ))}
    </div>
  );
}
