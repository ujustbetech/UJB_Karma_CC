import Text from "@/components/ui/Text";
import clsx from "clsx";

export default function FormField({
  label,
  error,
  required = false,
  children,
  className,
}) {
  return (
    <div className={clsx("space-y-1", className)}>
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && (
            <span className="ml-1 text-rose-500">*</span>
          )}
        </label>
      )}

      {children}

      {error && (
        <Text variant="caption" className="text-rose-600">
          {error}
        </Text>
      )}
    </div>
  );
}
