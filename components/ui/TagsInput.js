"use client";

import { X } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

export default function TagsInput({
  value = [],
  onChange,
  placeholder = "Add tag and press Enter",
  error = false,
}) {
  const [input, setInput] = useState("");

  const addTag = (e) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      if (!value.includes(input.trim())) {
        onChange([...value, input.trim()]);
      }
      setInput("");
    }
  };

  return (
    <div
      className={clsx(
        "rounded-lg px-2 py-2",
        error
          ? "border border-rose-300"
          : "border border-slate-200"
      )}
    >
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-sm text-slate-700"
          >
            {tag}
            <button
              onClick={() =>
                onChange(value.filter((t) => t !== tag))
              }
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={addTag}
          placeholder={placeholder}
          className="flex-1 text-sm outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}
