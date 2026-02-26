export default function Table({ children }) {
  return (
    <div className="overflow-hidden border-t border-slate-200 bg-background">
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  );
}
