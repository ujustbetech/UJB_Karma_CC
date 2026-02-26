export default function TableHeader({ columns = [] }) {
  return (
    <thead>
      <tr className="border-b border-slate-100">
        {columns.map((col, i) => {
          // Support multiple formats:
          // { key, label }
          // { label }
          // "String column"
          const label =
            typeof col === "string" ? col : col.label;

          const uniqueKey =
            (typeof col === "object" && col.key) ||
            label ||
            i;

          return (
            <th
              key={uniqueKey}
              className="px-4 py-4 text-left text-sm font-medium text-slate-400"
            >
              {label}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
