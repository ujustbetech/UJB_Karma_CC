import clsx from "clsx";
import { X } from "lucide-react";

/* ================================
   Variants
================================ */
const VARIANTS = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  error:
    "border-rose-200 bg-rose-50 text-rose-700",
  info:
    "border-slate-200 bg-white text-slate-700",
};

export default function Toast({
  type = "info",
  message,
  onClose,
}) {
  return (
    <div
      className={clsx(
        "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm",
        VARIANTS[type]
      )}
    >
      <span className="text-sm">
        {message}
      </span>

      <button
        onClick={onClose}
        className="ml-auto text-slate-400 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
