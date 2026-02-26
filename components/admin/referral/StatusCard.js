import React from "react";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";

import FormField from "@/components/ui/FormField";
import Select from "@/components/ui/Select";

import {
  Activity,
  RefreshCw,
  Clock,
  CircleDot
} from "lucide-react";

export default function StatusCard({
  formState,
  setFormState,
  onUpdate,
  statusLogs = [],
}) {
  return (
    <>
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={18} />
          <div>
            <Text className="font-semibold">Deal Status</Text>
            <Text variant="caption" className="text-gray-500">
              Track referral progress
            </Text>
          </div>
        </div>

        <StatusBadge status={formState.dealStatus || "Pending"} />
      </div>

      {/* STATUS CONTROL */}
      <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className="text-gray-500" />
          <Text variant="label">Change Status</Text>
        </div>

        <div className="flex items-center flex-col gap-2">
          <Select
            value={formState.dealStatus}
            onChange={(value) =>
              setFormState((prev) => ({
                ...prev,
                dealStatus: value,
              }))
            }
            options={[
              { label: "Pending", value: "Pending" },
              { label: "Reject", value: "Reject" },
              { label: "Not Connected", value: "Not Connected" },
              { label: "Called but Not Answered", value: "Called but Not Answered" },
              { label: "Discussion in Progress", value: "Discussion in Progress" },
              { label: "Hold", value: "Hold" },
              { label: "Deal Won", value: "Deal Won" },
              { label: "Deal Lost", value: "Deal Lost" },
              { label: "Work in Progress", value: "Work in Progress" },
              { label: "Work Completed", value: "Work Completed" },
              {
                label: "Received Part Payment and Transferred to UJustBe",
                value: "Received Part Payment and Transferred to UJustBe",
              },
              {
                label: "Received Full and Final Payment",
                value: "Received Full and Final Payment",
              },
              {
                label: "Agreed % Transferred to UJustBe",
                value: "Agreed % Transferred to UJustBe",
              },
            ]}
          />

          <Button
            variant="primary"
            onClick={() => onUpdate(formState.dealStatus)}
            className="w-full"
          >
            Update Status
          </Button>
        </div>
      </div>

      {/* STATUS HISTORY */}
      {statusLogs.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <Text className="font-semibold">Status Timeline</Text>
          </div>

          <div className="mt-5">
            {statusLogs.map((log, i) => {
              const ts = log.updatedAt;
              const dateString =
                ts && ts.seconds
                  ? new Date(ts.seconds * 1000).toLocaleString()
                  : ts
                    ? new Date(ts).toLocaleString()
                    : "";

              const isLast = i === statusLogs.length - 1;
              const status = (log.status || "").toLowerCase();

              let dotColor = "bg-slate-500";

              if (status.includes("won") || status.includes("completed"))
                dotColor = "bg-green-500";
              else if (status.includes("lost") || status.includes("reject"))
                dotColor = "bg-red-500";
              else if (status.includes("pending") || status.includes("hold"))
                dotColor = "bg-yellow-500";
              else if (status.includes("progress") || status.includes("discussion"))
                dotColor = "bg-blue-500";
              else if (status.includes("payment") || status.includes("transferred"))
                dotColor = "bg-purple-500";

              return (
                <div key={i} className="flex gap-4">

                  {/* LEFT RAIL */}
                  <div className="flex flex-col items-center w-5 shrink-0">
                    {/* BIGGER DOT */}
                    <div className={`w-3 h-3 mt-1 rounded-full ${dotColor}`} />

                    {/* CONNECTOR */}
                    {!isLast && (
                      <div className="w-[2px] h-5 border border-slate-300 bg-slate-300 mt-1" />
                    )}
                  </div>

                  {/* RIGHT CONTENT */}
                  <div className="pb-6">
                    <Text variant="body" className="font-medium">
                      {log.status}
                    </Text>

                    <Text variant="caption" className="text-gray-400">
                      {dateString}
                    </Text>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


      )}
    </>
  );
}
