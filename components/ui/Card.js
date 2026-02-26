import clsx from "clsx";

/* ================================
   Base styles (LOCKED)
================================ */
const BASE =
  "rounded-2xl bg-white";

/* ================================
   Padding presets
================================ */
const PADDING = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

/* ================================
   Variants (REFERENCE-ALIGNED)
================================ */
const VARIANTS = {
  default:
    "border border-slate-100",

  dashed:
    "border border-dashed border-slate-200",

  subtle:
    "border border-slate-100 bg-slate-50",
};

/* ================================
   Component
================================ */
export default function Card({
  children,
  variant = "default",
  padding = "md",
  className,
  ...props
}) {
  return (
    <div
      className={clsx(
        BASE,
        VARIANTS[variant],
        PADDING[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
