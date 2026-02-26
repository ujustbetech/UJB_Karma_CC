export default function Input({ ...props }) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
    />
  );
}