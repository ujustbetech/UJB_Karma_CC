import clsx from "clsx";

export default function Select({
  options = [],
  value,
  onChange,
  error = false,
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(
        "h-9 w-full rounded-lg bg-white px-3 text-sm outline-none",
        error
          ? "border border-rose-300 focus:border-rose-400"
          : "border border-slate-200 focus:border-slate-300"
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
