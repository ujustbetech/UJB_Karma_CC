export default function Textarea({ error, className = "", ...props }) {
  return (
    <textarea
      rows={4}
      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${
        error ? "border-red-500" : "border-slate-200"
      } ${className}`}
      {...props}
    />
  );
}
