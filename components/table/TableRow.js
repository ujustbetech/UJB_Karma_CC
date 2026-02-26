export default function TableRow({ children }) {
  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      {children}
    </tr>
  );
}
