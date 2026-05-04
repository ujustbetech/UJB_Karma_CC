export default function Table({ children }) {
  return (
    <div className="overflow-x-auto border-t border-slate-200 bg-background">
      <table className="min-w-full border-collapse">
        {children}
      </table>
    </div>
  );
}

