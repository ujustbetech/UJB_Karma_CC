"use client";

import { useState } from "react";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";

import FormField from "@/components/ui/FormField";
import Select from "@/components/ui/Select";
import NumberInput from "@/components/ui/NumberInput";

import { buildDealDistribution } from "@/utils/referralCalculations";

export default function StatusDealCard({
    referralData,
    formState,
    setFormState,
    dealLogs,
    dealAlreadyCalculated,
    onStatusUpdate,
    onSaveDealLog,
}) {
    const toast = useToast();

    const [errors, setErrors] = useState({});
    const [savingStatus, setSavingStatus] = useState(false);
    const [savingDeal, setSavingDeal] = useState(false);

    const isDealLocked =
        referralData?.dealStatus === "Agreed % Transferred to UJustBe" ||
        referralData?.statusLogs?.some(
            (s) => s.status === "Agreed % Transferred to UJustBe"
        ) ||
        referralData?.dealLogs?.some(
            (log) => log.dealStatus === "Agreed % Transferred to UJustBe"
        );

    const latestDealLog =
        referralData?.dealLogs?.length > 0
            ? referralData.dealLogs[referralData.dealLogs.length - 1]
            : null;

    const previewDistribution = () => {
        if (isDealLocked && latestDealLog) {
            return latestDealLog;
        }

        const dealValueNum = Number(formState.dealValue || 0);
        if (!dealValueNum || dealValueNum <= 0) return null;

        return buildDealDistribution(dealValueNum, referralData);
    };

    const handleStatusSave = async () => {
        setSavingStatus(true);
        try {
            await onStatusUpdate(formState.dealStatus);
            toast.success("Status updated");
        } catch (e) {
            toast.error("Failed to update status");
        } finally {
            setSavingStatus(false);
        }
    };

    const handleDealSave = async () => {
        const dealValueNum = Number(formState.dealValue || 0);

        if (!dealValueNum || dealValueNum <= 0) {
            setErrors({ dealValue: "Enter a valid deal value" });
            return;
        }

        setErrors({});
        setSavingDeal(true);

        try {
            const dist = buildDealDistribution(dealValueNum, referralData);

            await onSaveDealLog({
                ...dist,
                dealValue: dealValueNum,
            });

            toast.success("Deal calculation saved");
        } catch (e) {
            toast.error("Failed to save deal");
        } finally {
            setSavingDeal(false);
        }
    };

    const dist = previewDistribution();

    return (
        <Card>
            <Text as="h3">Status & Deal</Text>

            <FormField label="Deal Status">
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
            </FormField>


            <div style={{ marginBottom: 16 }}>
                <Button
                    variant="primary"
                    onClick={handleStatusSave}
                    disabled={savingStatus}
                >
                    {savingStatus ? "Saving…" : "Update Status"}
                </Button>
            </div>

            <FormField
                label="Deal Value (₹)"
                error={errors.dealValue}
                required
            >
                <NumberInput
                    value={formState.dealValue}
                    onChange={(e) => {
                        setErrors({});
                        setFormState((prev) => ({
                            ...prev,
                            dealValue: e.target.value,
                        }));
                    }}
                    error={!!errors.dealValue}
                    disabled={isDealLocked}
                />
            </FormField>

            {dist && (
                <div style={{ marginTop: 12, marginBottom: 16 }}>
                    <Text as="h3">
                        {isDealLocked
                            ? "Final Distribution"
                            : "Distribution Preview"}
                    </Text>

                    <Text>
                        <strong>Total Agreed Amount:</strong> ₹
                        {Number(dist.agreedAmount || 0).toLocaleString("en-IN")}
                    </Text>
                    <Text>Orbiter: ₹{Number(dist.orbiterShare || 0)}</Text>
                    <Text>
                        Orbiter Mentor: ₹
                        {Number(dist.orbiterMentorShare || 0)}
                    </Text>
                    <Text>
                        Cosmo Mentor: ₹
                        {Number(dist.cosmoMentorShare || 0)}
                    </Text>
                    <Text>UJustBe: ₹{Number(dist.ujustbeShare || 0)}</Text>
                </div>
            )}

            {!isDealLocked && (
                <Button
                    variant="secondary"
                    onClick={handleDealSave}
                    disabled={savingDeal}
                >
                    {savingDeal
                        ? "Saving…"
                        : dealLogs?.length
                            ? "Update Deal Calculation"
                            : "Save Deal Calculation"}
                </Button>
            )}

            {isDealLocked && (
                <Text variant="caption" muted>
                    Deal locked. Agreed percentage transferred to UJustBe.
                </Text>
            )}
        </Card>
    );
}
