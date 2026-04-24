"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import {
  compareDateValues,
  formatValueForDisplayInput,
  getDateInputPlaceholder,
  isValidDisplayDate,
  isValidDisplayDateTime,
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
  default:
    "border-slate-200 focus:border-slate-300",

  error:
    "border-rose-300 text-rose-900 placeholder:text-rose-400 focus:border-rose-400",
};

function buildSyntheticEvent(originalEvent, nextValue) {
  return {
    ...originalEvent,
    target: {
      ...(originalEvent?.target || {}),
      value: nextValue,
    },
    currentTarget: {
      ...(originalEvent?.currentTarget || originalEvent?.target || {}),
      value: nextValue,
    },
  };
}

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
  const [displayValue, setDisplayValue] = useState("");

  const formattedValue = useMemo(
    () => formatValueForDisplayInput(value, type),
    [type, value]
  );

  useEffect(() => {
    if (isFormattedDateInput) {
      setDisplayValue(formattedValue);
    }
  }, [formattedValue, isFormattedDateInput]);

  if (!isFormattedDateInput) {
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

  const isValidValue =
    type === "datetime-local"
      ? isValidDisplayDateTime(displayValue)
      : isValidDisplayDate(displayValue);

  const validateRange = (nextValue) => {
    if (!nextValue) return "";

    const normalizedValue = normalizeValueForStorageInput(nextValue, type);
    if (min && compareDateValues(normalizedValue, min, { includeTime: type === "datetime-local" }) < 0) {
      return `Enter a date on or after ${formatValueForDisplayInput(min, type)}.`;
    }

    if (max && compareDateValues(normalizedValue, max, { includeTime: type === "datetime-local" }) > 0) {
      return `Enter a date on or before ${formatValueForDisplayInput(max, type)}.`;
    }

    return "";
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      className={clsx(
        BASE,
        SIZES[size],
        error ? STATES.error : STATES.default,
        className
      )}
      value={displayValue}
      onChange={(event) => {
        const nextDisplayValue = event.target.value;
        setDisplayValue(nextDisplayValue);

        if (!onChange) return;

        if (!nextDisplayValue) {
          onChange(buildSyntheticEvent(event, ""));
          return;
        }

        const nextIsValid =
          type === "datetime-local"
            ? isValidDisplayDateTime(nextDisplayValue)
            : isValidDisplayDate(nextDisplayValue);

        if (!nextIsValid) {
          return;
        }

        const normalizedValue = normalizeValueForStorageInput(nextDisplayValue, type);
        const rangeMessage = validateRange(nextDisplayValue);

        if (rangeMessage) {
          event.target.setCustomValidity(rangeMessage);
          event.target.reportValidity();
          return;
        }

        event.target.setCustomValidity("");
        onChange(buildSyntheticEvent(event, normalizedValue));
      }}
      onBlur={(event) => {
        const trimmedValue = String(displayValue || "").trim();

        if (!trimmedValue) {
          event.target.setCustomValidity("");
          onBlur?.(buildSyntheticEvent(event, ""));
          return;
        }

        if (!isValidValue) {
          const message =
            type === "datetime-local"
              ? `Use ${getDateInputPlaceholder(type)} format.`
              : `Use ${getDateInputPlaceholder(type)} format.`;
          event.target.setCustomValidity(message);
          event.target.reportValidity();
          return;
        }

        const rangeMessage = validateRange(trimmedValue);
        if (rangeMessage) {
          event.target.setCustomValidity(rangeMessage);
          event.target.reportValidity();
          return;
        }

        const normalizedValue = normalizeValueForStorageInput(trimmedValue, type);
        event.target.setCustomValidity("");
        setDisplayValue(formatValueForDisplayInput(normalizedValue, type));
        onBlur?.(buildSyntheticEvent(event, normalizedValue));
      }}
      placeholder={placeholder || getDateInputPlaceholder(type)}
      {...props}
    />
  );
}
