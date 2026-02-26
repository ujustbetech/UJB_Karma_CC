import { CheckCircle, Clock, XCircle } from "lucide-react";
import Badge from "./Badge";

/**
 * Locked status registry
 * ❗ Do not allow free-form values
 */
const STATUS_CONFIG = {
  approved: {
    label: "Approved",
    variant: "approved",
    icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    variant: "pending",
    icon: Clock,
  },
  rejected: {
    label: "Rejected",
    variant: "rejected",
    icon: XCircle,
  },
};

export default function StatusBadge({
  status,
  tone = "default", // "default" | "table"
  showIcon = true,
  className,
}) {
  const config = STATUS_CONFIG[status];

  if (!config) {
    console.warn(`Invalid status: ${status}`);
    return null;
  }

  const Icon = config.icon;
  const isTable = tone === "table";

  return (
    <Badge
      variant={isTable ? `table-${config.variant}` : config.variant}
      className={className}
    >
      {!isTable && showIcon && (
        <Icon
          className="mr-1 h-3.5 w-3.5"
          aria-hidden="true"
        />
      )}
      {config.label}
    </Badge>
  );
}
