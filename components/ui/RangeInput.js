export default function RangeInput({
  min = 0,
  max = 100,
  value,
  onChange,
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full"
    />
  );
}
