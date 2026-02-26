import clsx from "clsx";

/* ================================
   Base styles (LOCKED)
================================ */
const BASE =
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50";

/* ================================
   Size presets
================================ */
const SIZES = {
  sm: "h-8 px-3 text-sm",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
};

/* ================================
   Variants (REFERENCE-ALIGNED)
================================ */
const VARIANTS = {
  primary:
    "bg-slate-900 text-white hover:bg-slate-800",

  secondary:
    "bg-slate-100 text-slate-700 hover:bg-slate-200",

  outline:
    "border border-slate-200 text-slate-700 hover:bg-slate-100",

  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900",

  danger:
    "bg-rose-600 text-white hover:bg-rose-500",

  ghostDanger:
    "text-rose-600 hover:bg-rose-50",
};

/* ================================
   Component
================================ */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,      // ✅ extracted
  disabled = false,     // ✅ extracted
  type = "button",      // ✅ extracted
  className,
  children,
  ...rest               // ❗ only safe props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={clsx(
        BASE,
        SIZES[size],
        VARIANTS[variant],
        className
      )}
      {...rest}          // ✅ loading is NOT forwarded
    >
      {loading ? "Loading…" : children}
    </button>
  );
}
