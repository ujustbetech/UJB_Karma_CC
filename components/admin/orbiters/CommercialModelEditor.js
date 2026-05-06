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

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

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
        <Text variant="h4">Commission Preview</Text>

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
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Text variant="body">
                <strong>Commission Model:</strong>{" "}
                {model.modelType === COMMERCIAL_MODEL_TYPES.SINGLE
                  ? "Single Slab"
                  : "Multi Slab"}
              </Text>
              <Text variant="body">
                <strong>Matched Slab:</strong> {previewResult.slabLabel}
              </Text>
              <Text variant="body">
                <strong>Commission Type:</strong>{" "}
                {previewResult.commissionType === COMMISSION_VALUE_TYPES.PERCENTAGE
                  ? "Percentage"
                  : "Fixed Amount"}
              </Text>
              <Text variant="body">
                <strong>Commission Value:</strong>{" "}
                {previewResult.commissionType === COMMISSION_VALUE_TYPES.PERCENTAGE
                  ? `${previewResult.commissionValue}%`
                  : money(previewResult.commissionValue)}
              </Text>
              <Text variant="body">
                <strong>Total Commission Amount:</strong>{" "}
                {money(previewResult.commissionAmount)}
              </Text>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <Text variant="body" className="font-medium">
                Distribution Preview
              </Text>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded border border-slate-200 p-3">
                  <Text variant="body">
                    User A (Referrer): {COMMISSION_DISTRIBUTION.referrer}%
                  </Text>
                  <Text variant="body">{money(distributionPreview.referrer)}</Text>
                </div>
                <div className="rounded border border-slate-200 p-3">
                  <Text variant="body">
                    User A Mentor Orbiter:{" "}
                    {COMMISSION_DISTRIBUTION.referrerMentor}%
                  </Text>
                  <Text variant="body">
                    {money(distributionPreview.referrerMentor)}
                  </Text>
                </div>
                <div className="rounded border border-slate-200 p-3">
                  <Text variant="body">
                    User B Mentor Orbiter:{" "}
                    {COMMISSION_DISTRIBUTION.receiverMentor}%
                  </Text>
                  <Text variant="body">
                    {money(distributionPreview.receiverMentor)}
                  </Text>
                </div>
                <div className="rounded border border-slate-200 p-3">
                  <Text variant="body">
                    UJustBe Platform: {COMMISSION_DISTRIBUTION.platform}%
                  </Text>
                  <Text variant="body">{money(distributionPreview.platform)}</Text>
                </div>
              </div>
              <Text variant="body" className="mt-3">
                <strong>Total Distribution:</strong>{" "}
                {money(distributionPreview.totalCommissionAmount)}
              </Text>
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
