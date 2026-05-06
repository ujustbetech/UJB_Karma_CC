"use client";

import { useMemo } from "react";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

import {
  buildCommissionDistribution,
  calculateCommissionFromCommercialModel,
  COMMERCIAL_MODEL_TYPES,
  COMMISSION_DISTRIBUTION,
  COMMISSION_VALUE_TYPES,
  normalizeCommercialModel,
  validateCommercialModel,
} from "@/utils/commercialModel";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export default function CommercialModelEditor({
  value,
  onChange,
  previewDealValue,
  onPreviewDealValueChange,
}) {
  const model = useMemo(() => normalizeCommercialModel(value), [value]);
  const validation = useMemo(() => validateCommercialModel(model), [model]);
  const previewResult = useMemo(
    () => calculateCommissionFromCommercialModel(previewDealValue, model),
    [previewDealValue, model]
  );
  const distributionPreview = useMemo(
    () =>
      previewResult
        ? buildCommissionDistribution(previewResult.commissionAmount)
        : null,
    [previewResult]
  );

  const updateModel = (nextModel) => {
    onChange(normalizeCommercialModel(nextModel));
  };

  const updateSingle = (key, nextValue) => {
    updateModel({
      ...model,
      singleSlab: {
        ...model.singleSlab,
        [key]: nextValue,
      },
    });
  };

  const updateMultiSlab = (index, key, nextValue) => {
    const slabs = [...model.multiSlab.slabs];
    slabs[index] = {
      ...slabs[index],
      [key]: nextValue,
    };

    updateModel({
      ...model,
      multiSlab: { slabs },
    });
  };

  const addSlab = () => {
    updateModel({
      ...model,
      multiSlab: {
        slabs: [
          ...model.multiSlab.slabs,
          {
            min: "",
            max: "",
            commissionType: COMMISSION_VALUE_TYPES.PERCENTAGE,
            value: "",
          },
        ],
      },
    });
  };

  const removeSlab = (index) => {
    updateModel({
      ...model,
      multiSlab: {
        slabs: model.multiSlab.slabs.filter((_, slabIndex) => slabIndex !== index),
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField label="Commercial Model Type">
          <Select
            value={model.modelType}
            onChange={(nextValue) =>
              updateModel({
                ...model,
                modelType: nextValue,
              })
            }
            options={[
              { label: "Single Slab", value: COMMERCIAL_MODEL_TYPES.SINGLE },
              { label: "Multi Slab", value: COMMERCIAL_MODEL_TYPES.MULTI },
            ]}
          />
        </FormField>
      </div>

      {model.modelType === COMMERCIAL_MODEL_TYPES.SINGLE ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Commission Type">
            <Select
              value={model.singleSlab.commissionType}
              onChange={(nextValue) => updateSingle("commissionType", nextValue)}
              options={[
                {
                  label: "Percentage",
                  value: COMMISSION_VALUE_TYPES.PERCENTAGE,
                },
                {
                  label: "Fixed Amount",
                  value: COMMISSION_VALUE_TYPES.FIXED,
                },
              ]}
            />
          </FormField>

          <FormField
            label={
              model.singleSlab.commissionType === COMMISSION_VALUE_TYPES.PERCENTAGE
                ? "Commission Percentage"
                : "Fixed Commission Amount"
            }
          >
            <Input
              type="number"
              min="0"
              step="0.01"
              value={model.singleSlab.value}
              onChange={(event) => updateSingle("value", event.target.value)}
              placeholder={
                model.singleSlab.commissionType === COMMISSION_VALUE_TYPES.PERCENTAGE
                  ? "10"
                  : "8000"
              }
            />
          </FormField>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Text variant="body" className="font-medium">
              Slab Configuration
            </Text>
            <Button variant="outline" onClick={addSlab}>
              Add Slab
            </Button>
          </div>

          {model.multiSlab.slabs.map((slab, index) => (
            <Card key={`slab-${index}`}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <FormField label="Minimum Deal Value">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={slab.min}
                    onChange={(event) =>
                      updateMultiSlab(index, "min", event.target.value)
                    }
                    placeholder="1"
                  />
                </FormField>

                <FormField label="Maximum Deal Value">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={slab.max}
                    onChange={(event) =>
                      updateMultiSlab(index, "max", event.target.value)
                    }
                    placeholder="Leave blank for no upper limit"
                  />
                </FormField>

                <FormField label="Commission Type">
                  <Select
                    value={slab.commissionType}
                    onChange={(nextValue) =>
                      updateMultiSlab(index, "commissionType", nextValue)
                    }
                    options={[
                      {
                        label: "Percentage",
                        value: COMMISSION_VALUE_TYPES.PERCENTAGE,
                      },
                      {
                        label: "Fixed Amount",
                        value: COMMISSION_VALUE_TYPES.FIXED,
                      },
                    ]}
                  />
                </FormField>

                <FormField label="Commission Value">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={slab.value}
                    onChange={(event) =>
                      updateMultiSlab(index, "value", event.target.value)
                    }
                    placeholder={
                      slab.commissionType === COMMISSION_VALUE_TYPES.PERCENTAGE
                        ? "8"
                        : "15000"
                    }
                  />
                </FormField>
              </div>

              <div className="mt-3 flex justify-end">
                <Button variant="ghost" onClick={() => removeSlab(index)}>
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!validation.isValid ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <Text variant="body" className="font-medium text-red-700">
            Fix the commercial model before saving
          </Text>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
            {validation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Card>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Text variant="h4">Live Commission Preview</Text>
            <Text variant="muted">
              Update slabs and instantly verify the final commission split.
            </Text>
          </div>
          <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Live Preview
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Sample Deal Value">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={previewDealValue}
              onChange={(event) => onPreviewDealValueChange(event.target.value)}
              placeholder="100000"
            />
          </FormField>
        </div>

        {previewResult && distributionPreview ? (
          <div className="mt-4 space-y-4">
            <div className="sticky top-4 z-10 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-lime-50 shadow-sm">
              <div className="border-b border-amber-200 bg-amber-100/70 px-4 py-3">
                <Text variant="body" className="font-semibold text-amber-900">
                  Commission Snapshot
                </Text>
                <Text variant="caption" className="text-amber-800">
                  This is the amount that will be distributed after the deal closes.
                </Text>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Commission Model
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {model.modelType === COMMERCIAL_MODEL_TYPES.SINGLE
                          ? "Single Slab"
                          : "Multi Slab"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Matched Slab
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {previewResult.slabLabel}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Commission Type
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {previewResult.commissionType === COMMISSION_VALUE_TYPES.PERCENTAGE
                          ? "Percentage"
                          : "Fixed Amount"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Commission Value
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {previewResult.commissionType === COMMISSION_VALUE_TYPES.PERCENTAGE
                          ? `${previewResult.commissionValue}%`
                          : money(previewResult.commissionValue)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-100">
                    Final Commission
                  </div>
                  <div className="mt-2 text-3xl font-bold">
                    {money(previewResult.commissionAmount)}
                  </div>
                  <div className="mt-2 text-sm text-emerald-50">
                    This full amount will be split across referrer, mentors, and
                    the platform.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <Text variant="body" className="font-semibold text-sky-900">
                  Distribution Preview
                </Text>
                <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
                  100% Auto Balanced
                </div>
              </div>
              <Text variant="caption" className="mt-1 text-sky-800">
                Preview of who gets paid from the final commission amount.
              </Text>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white bg-white p-4 shadow-sm">
                  <Text variant="body" className="font-medium text-slate-900">
                    User A (Referrer)
                  </Text>
                  <Text variant="caption" className="text-slate-500">
                    {COMMISSION_DISTRIBUTION.referrer}% share
                  </Text>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {money(distributionPreview.referrer)}
                  </div>
                </div>

                <div className="rounded-xl border border-white bg-white p-4 shadow-sm">
                  <Text variant="body" className="font-medium text-slate-900">
                    User A Mentor Orbiter
                  </Text>
                  <Text variant="caption" className="text-slate-500">
                    {COMMISSION_DISTRIBUTION.referrerMentor}% share
                  </Text>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {money(distributionPreview.referrerMentor)}
                  </div>
                </div>

                <div className="rounded-xl border border-white bg-white p-4 shadow-sm">
                  <Text variant="body" className="font-medium text-slate-900">
                    User B Mentor Orbiter
                  </Text>
                  <Text variant="caption" className="text-slate-500">
                    {COMMISSION_DISTRIBUTION.receiverMentor}% share
                  </Text>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {money(distributionPreview.receiverMentor)}
                  </div>
                </div>

                <div className="rounded-xl border border-white bg-white p-4 shadow-sm">
                  <Text variant="body" className="font-medium text-slate-900">
                    UJustBe Platform
                  </Text>
                  <Text variant="caption" className="text-slate-500">
                    {COMMISSION_DISTRIBUTION.platform}% share
                  </Text>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {money(distributionPreview.platform)}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-sky-200 bg-white px-4 py-3">
                <Text variant="body" className="font-medium text-slate-700">
                  Total Distribution
                </Text>
                <div className="mt-1 text-2xl font-bold text-sky-900">
                  {money(distributionPreview.totalCommissionAmount)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Text variant="muted" className="mt-3">
            Enter a valid deal value and complete the commercial model to see the
            commission and distribution preview.
          </Text>
        )}
      </Card>
    </div>
  );
}
