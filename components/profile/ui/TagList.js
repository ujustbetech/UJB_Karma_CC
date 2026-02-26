export default function TagList({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="text-xs bg-gray-200 px-3 py-1 rounded-full"
        >
          {item}
        </span>
      ))}
    </div>
  );
}