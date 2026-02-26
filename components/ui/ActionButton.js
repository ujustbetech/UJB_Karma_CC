import clsx from "clsx";
import Tooltip from "@/components/ui/Tooltip";

/* ================================
   Base styles (LOCKED)
================================ */
const BASE =
  "inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50";

/* ================================
   Size presets
================================ */
const SIZES = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
};

/* ================================
   Variants (REFERENCE-ALIGNED)
================================ */
const VARIANTS = {
  ghost:
    "text-slate-400 hover:bg-slate-100 hover:text-slate-900",

  ghostDanger:
    "text-slate-400 hover:bg-rose-50 hover:text-rose-600",
};

/* ================================
   Component
================================ */
export default function ActionButton({
  icon: Icon,
  label,
  variant = "ghost",
  size = "sm",
  className,
  ...props
}) {
  const button = (
    <button
      type="button"
      className={clsx(
        BASE,
        SIZES[size],
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
    </button>
  );

  if (!label) return button;

  return (
    <Tooltip content={label}>
      {button}
    </Tooltip>
  );
}
