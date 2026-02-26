import React, { useMemo, useState, useEffect } from "react";
import { buildDealDistribution } from "@/utils/referralCalculations";

import {
  IndianRupee,
  Calculator,
  Lock,
  Percent,
  Users,
  Wallet,
  TrendingUp
} from "lucide-react";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import NumberInput from "@/components/ui/NumberInput";

export default function ServiceDetailsCard({
  referralData,
  dealLogs,
  onSaveDealLog,
}) {
  const [localDealValue, setLocalDealValue] = useState("");

  /* =========================
     🔐 LOCK CONDITION
  ========================= */

  const isDealLocked =
    referralData?.dealStatus === "Agreed % Transferred to UJustBe" ||
    referralData?.dealStatus ===
      "Agreed Percentage Transferred to UJustBe" ||
    referralData?.statusLogs?.some(
      (s) => s.status === "Agreed % Transferred to UJustBe"
    ) ||
    referralData?.dealLogs?.some(
      (log) => log.dealStatus === "Agreed % Transferred to UJustBe"
    );

  /* =========================
     📌 LATEST DEAL LOG
  ========================= */

  const latestDealLog =
    referralData?.dealLogs?.length > 0
      ? referralData.dealLogs[referralData.dealLogs.length - 1]
      : null;

  /* =========================
     🔁 SYNC DEAL VALUE FROM DB
  ========================= */

  useEffect(() => {
    if (latestDealLog?.dealValue) {
      setLocalDealValue(latestDealLog.dealValue);
    }
  }, [latestDealLog]);

  /* =========================
     🔍 DISTRIBUTION
  ========================= */

  const previewDistribution = useMemo(() => {
    if (isDealLocked && latestDealLog) {
      return {
        agreedAmount: latestDealLog.agreedAmount,
        orbiterShare: latestDealLog.orbiterShare,
        orbiterMentorShare: latestDealLog.orbiterMentorShare,
        cosmoMentorShare: latestDealLog.cosmoMentorShare,
        ujustbeShare: latestDealLog.ujustbeShare,
      };
    }

    const dealValueNum = Number(localDealValue);
    if (!dealValueNum || dealValueNum <= 0) return null;

    return buildDealDistribution(dealValueNum, referralData);
  }, [localDealValue, referralData, isDealLocked, latestDealLog]);

  /* =========================
     💾 SAVE DEAL
  ========================= */

  const handleSaveDeal = () => {
    if (isDealLocked) {
      alert(
        "Deal is locked. Agreed percentage already transferred to UJustBe."
      );
      return;
    }

    if (!previewDistribution) {
      alert("Enter valid deal value first.");
      return;
    }

    onSaveDealLog({
      ...previewDistribution,
      dealValue: Number(localDealValue),
    });
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator size={18} />
        <Text as="h3" variant="h3">
          Service / Product Deal Details
        </Text>
      </div>

      {/* Deal Value Input */}
      <div className="mt-4">
        <FormField label="Deal Value (₹)">
          <div className="flex items-center gap-2">
            <IndianRupee size={16} />
            <NumberInput
              value={localDealValue}
              onChange={(e) => setLocalDealValue(e.target.value)}
              disabled={isDealLocked}
              placeholder="Enter deal value"
            />
          </div>
        </FormField>
      </div>

      {/* Distribution Preview */}
      {previewDistribution && (
        <div className="mt-5 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} />
            <Text variant="h3">
              {isDealLocked ? "Final Distribution" : "Distribution Preview"}
            </Text>
          </div>

          <div className="p-3 rounded border border-slate-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Percent size={14} />
              <Text variant="body">
                <strong>Total Agreed Amount:</strong>{" "}
                ₹{previewDistribution.agreedAmount.toLocaleString("en-IN")}
              </Text>
            </div>

            <div className="space-y-2 mt-3">
              <div className="flex justify-between border border-slate-200 rounded px-3 py-2">
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <Text variant="body">Orbiter</Text>
                </div>
                <Text variant="body">
                  ₹{previewDistribution.orbiterShare}
                </Text>
              </div>

              <div className="flex justify-between border border-slate-200 rounded px-3 py-2">
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <Text variant="body">Orbiter Mentor</Text>
                </div>
                <Text variant="body">
                  ₹{previewDistribution.orbiterMentorShare}
                </Text>
              </div>

              <div className="flex justify-between border border-slate-200 rounded px-3 py-2">
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <Text variant="body">Cosmo Mentor</Text>
                </div>
                <Text variant="body">
                  ₹{previewDistribution.cosmoMentorShare}
                </Text>
              </div>

              <div className="flex justify-between border border-slate-200 rounded px-3 py-2">
                <div className="flex items-center gap-2">
                  <Wallet size={14} />
                  <Text variant="body">UJustBe</Text>
                </div>
                <Text variant="body">
                  ₹{previewDistribution.ujustbeShare}
                </Text>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {!isDealLocked && (
        <div className="mt-4">
          <Button variant="primary" onClick={handleSaveDeal}>
            {dealLogs?.length
              ? "Update Deal Calculation"
              : "Save Deal Calculation"}
          </Button>
        </div>
      )}

      {/* Locked Notice */}
      {isDealLocked && (
        <div className="mt-4 p-3 border border-slate-200 rounded bg-gray-50 flex items-start gap-2">
          <Lock size={16} className="mt-1" />
          <Text variant="muted">
            Deal locked. Agreed percentage already transferred to UJustBe.
          </Text>
        </div>
      )}
    </>
  );
}
