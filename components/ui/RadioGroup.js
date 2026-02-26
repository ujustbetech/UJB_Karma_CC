export default function RadioGroup({
  options = [],
  value,
  onChange,
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-2 text-sm text-slate-700"
        >
          <input
            type="radio"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-4 w-4 border-slate-300"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
