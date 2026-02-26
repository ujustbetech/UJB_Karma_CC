import { useState } from "react";
import {
  Wallet,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  PlusCircle
} from "lucide-react";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";

export default function PaymentSummary({
  agreedAmount = 0,
  cosmoPaid = 0,
  agreedRemaining = 0,
  ujbBalance = 0,
  paidTo = {},
  referralData = {},
  onAddPayment = () => {},
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const logs = referralData?.dealLogs || [];
  const deal = logs.length ? logs[logs.length - 1] : {};

  const orbiterShare = deal?.orbiterShare ?? 0;
  const orbiterMentorShare = deal?.orbiterMentorShare ?? 0;
  const cosmoMentorShare = deal?.cosmoMentorShare ?? 0;
  const ujustbeShare = deal?.ujustbeShare ?? 0;

  const progress =
    agreedAmount > 0
      ? Math.min(100, (cosmoPaid / agreedAmount) * 100)
      : 0;

  const progressRounded = Math.round(progress);

  return (
    <>
      {/* Header */}
      <Text as="h3" variant="h3" className="flex items-center gap-2">
        <Wallet size={18} />
        Payments & Distribution
      </Text>

      {/* Summary Grid */}
      <div className="grid grid-cols-4 gap-4 mt-4">
        <div>
          <Text variant="caption" className="flex items-center gap-1">
            <FileText size={14} /> Agreed
          </Text>
          <Text variant="body" className="font-semibold">
            ₹{agreedAmount.toLocaleString("en-IN")}
          </Text>
        </div>

        <div>
          <Text variant="caption" className="flex items-center gap-1">
            <CheckCircle size={14} /> Paid
          </Text>
          <Text variant="body" className="font-semibold">
            ₹{cosmoPaid.toLocaleString("en-IN")}
          </Text>
        </div>

        <div>
          <Text variant="caption" className="flex items-center gap-1">
            <Clock size={14} /> Remaining
          </Text>
          <Text variant="body" className="font-semibold">
            ₹{agreedRemaining.toLocaleString("en-IN")}
          </Text>
        </div>

        <div>
          <Text variant="caption" className="flex items-center gap-1">
            <TrendingUp size={14} /> Progress
          </Text>
          <Text variant="body" className="font-semibold">
            {progressRounded}%
          </Text>
        </div>
      </div>

      {/* Modern Progress Bar (matches screenshot style) */}
      <div className="mt-5">
        {/* Top row */}
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-500">
            {progressRounded === 100
              ? "Payment completed"
              : `${progressRounded}% payment received`}
          </span>
          <span className="text-slate-700 font-medium">
            {progressRounded}%
          </span>
        </div>

        {/* Track */}
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-2 bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progressRounded}%` }}
          />
        </div>
      </div>

      {/* Breakdown Toggle */}
      <div
        className="flex items-center justify-between mt-5 cursor-pointer"
        onClick={() => setShowBreakdown(!showBreakdown)}
      >
        <Text variant="body" className="font-medium">
          Earnings Breakdown
        </Text>
        {showBreakdown ? (
          <ChevronUp size={18} />
        ) : (
          <ChevronDown size={18} />
        )}
      </div>

      {/* Breakdown Content */}
      {showBreakdown && (
        <div className="mt-3 space-y-2">
          <div className="flex justify-between">
            <Text variant="body">Orbiter</Text>
            <Text variant="body">
              ₹{orbiterShare.toLocaleString("en-IN")}
              <span className="text-slate-400 ml-2">
                Paid ₹{(paidTo.orbiter || 0).toLocaleString("en-IN")}
              </span>
            </Text>
          </div>

          <div className="flex justify-between">
            <Text variant="body">Orbiter Mentor</Text>
            <Text variant="body">
              ₹{orbiterMentorShare.toLocaleString("en-IN")}
              <span className="text-slate-400 ml-2">
                Paid ₹
                {(paidTo.orbiterMentor || 0).toLocaleString("en-IN")}
              </span>
            </Text>
          </div>

          <div className="flex justify-between">
            <Text variant="body">Cosmo Mentor</Text>
            <Text variant="body">
              ₹{cosmoMentorShare.toLocaleString("en-IN")}
              <span className="text-slate-400 ml-2">
                Paid ₹
                {(paidTo.cosmoMentor || 0).toLocaleString("en-IN")}
              </span>
            </Text>
          </div>

          <div className="flex justify-between">
            <Text variant="body">UJustBe</Text>
            <Text variant="body">
              ₹{ujustbeShare.toLocaleString("en-IN")}
            </Text>
          </div>

          <div className="flex justify-between">
            <Text variant="body">UJB Balance</Text>
            <Text variant="body">
              ₹{ujbBalance.toLocaleString("en-IN")}
            </Text>
          </div>
        </div>
      )}

      {/* Action */}
      <div className="mt-5">
        <Button
          variant="primary"
          onClick={onAddPayment}
          disabled={agreedRemaining <= 0}
          className="flex items-center gap-2"
        >
          <PlusCircle size={16} />
          Add Cosmo Payment
        </Button>
      </div>
    </>
  );
}
