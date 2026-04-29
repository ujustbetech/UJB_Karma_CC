"use client";

import clsx from "clsx";
import { forwardRef, useMemo, useRef } from "react";
import {
  formatValueForDisplayInput,
  getDateInputPlaceholder,
  normalizeValueForStorageInput,
} from "@/lib/utils/dateFormat";

const BASE =
  "block w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const SIZES = {
  sm: "h-8 px-3",
  md: "h-9 px-3",
  lg: "h-10 px-4",
};

const STATES = {
  default: "border-slate-200 focus:border-slate-300",
  error:
    "border-rose-300 text-rose-900 placeholder:text-rose-400 focus:border-rose-400",
};

const DateInput = forwardRef(function DateInput(
  {
    type = "date",
    size = "md",
    error = false,
    className,
    onClick,
    onFocus,
    value,
    placeholder,
    ...props
  },
  forwardedRef
) {
  const inputRef = useRef(null);
  const displayValue = useMemo(
    () => formatValueForDisplayInput(value, type),
    [type, value]
  );
  const storageValue = useMemo(
    () => normalizeValueForStorageInput(value, type),
    [type, value]
  );

  const setRefs = (node) => {
    inputRef.current = node;

    if (typeof forwardedRef === "function") {
      forwardedRef(node);
      return;
    }

    if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  const openPicker = () => {
    if (typeof inputRef.current?.showPicker === "function") {
      try {
        inputRef.current.showPicker();
      } catch {
        // Ignore browsers that block programmatic picker opening.
      }
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        readOnly
        tabIndex={-1}
        value={displayValue}
        placeholder={placeholder || getDateInputPlaceholder(type)}
        className={clsx(
          BASE,
          SIZES[size],
          error ? STATES.error : STATES.default,
          "pr-10",
          className
        )}
      />

      <input
        ref={setRefs}
        type={type}
        value={storageValue}
        placeholder={placeholder || getDateInputPlaceholder(type)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        onClick={(event) => {
          openPicker();
          onClick?.(event);
        }}
        onFocus={(event) => {
          openPicker();
          onFocus?.(event);
        }}
        {...props}
      />
    </div>
  );
});

export default DateInput;

