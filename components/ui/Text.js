import clsx from "clsx";

/* ================================
   Text variants (LOCKED)
================================ */
const VARIANTS = {
  h1: "text-2xl font-semibold text-slate-900",
  h2: "text-lg font-semibold text-slate-900",
  h3: "text-base font-medium text-slate-900",

  body: "text-sm text-slate-700",
  muted: "text-sm text-slate-500",
  caption: "text-xs text-slate-400",
};

/* ================================
   Component
================================ */
export default function Text({
  as: Component = "span",
  variant = "body",
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={clsx(
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
