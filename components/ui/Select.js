"use client";

import clsx from "clsx";

export default function Select({
  options = [],
  value,
  onChange,
  error = false,
}) {
  // ✅ Remove duplicate values (based on value)
  const uniqueOptions = options.filter(
    (opt, index, self) =>
      index === self.findIndex((o) => o.value === opt.value)
  );

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
      {uniqueOptions.map((opt, index) => (
        <option
          key={`${opt.value}-${index}`} // ✅ ALWAYS UNIQUE
          value={opt.value}
        >
          {opt.label}
        </option>
      ))}
    </select>
  );
}