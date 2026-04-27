"use client";

import clsx from "clsx";
import DateInput from "./DateInput";

const BASE =
  "block w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const SIZES = {
  sm: "h-8 px-3",
  md: "h-9 px-3",
  lg: "h-10 px-4",
};

const STATES = {
  default:
    "border-slate-200 focus:border-slate-300",

  error:
    "border-rose-300 text-rose-900 placeholder:text-rose-400 focus:border-rose-400",
};

export default function Input({
  size = "md",
  error = false,
  className,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  min,
  max,
  ...props
}) {
  const isFormattedDateInput = type === "date" || type === "datetime-local";

  if (isFormattedDateInput) {
    return (
      <DateInput
        type={type}
        size={size}
        error={error}
        className={className}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        min={min}
        max={max}
        {...props}
      />
    );
  }

  return (
    <input
      type={type}
      className={clsx(
        BASE,
        SIZES[size],
        error ? STATES.error : STATES.default,
        className
      )}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      {...props}
    />
  );
}
