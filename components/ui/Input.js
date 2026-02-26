import clsx from "clsx";

/* ================================
   Base styles (LOCKED)
================================ */
const BASE =
  "block w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

/* ================================
   Size presets
================================ */
const SIZES = {
  sm: "h-8 px-3",
  md: "h-9 px-3",
  lg: "h-10 px-4",
};

/* ================================
   State styles
================================ */
const STATES = {
  default:
    "border-slate-200 focus:border-slate-300",

  error:
    "border-rose-300 text-rose-900 placeholder:text-rose-400 focus:border-rose-400",
};

/* ================================
   Component
================================ */
export default function Input({
  size = "md",
  error = false,
  className,
  ...props
}) {
  return (
    <input
      className={clsx(
        BASE,
        SIZES[size],
        error ? STATES.error : STATES.default,
        className
      )}
      {...props}
    />
  );
}
