export default function Button({ children, loading, ...props }) {
  return (
    <button
      {...props}
      className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition font-semibold text-white disabled:opacity-50"
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}