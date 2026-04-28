"use client";

import { useCallback, useEffect, useState } from "react";
import { COLLECTIONS } from "@/lib/utility_collection";
import {
  applyCcReferralAdjustment,
  previewCcReferralAdjustment,
} from "@/services/ccReferralService";

export const useReferralAdjustment = (
  referralId,
  orbiterUjbCode,
  { collectionName = COLLECTIONS.referral, orbiterProfile = null, onRefresh = null } = {}
) => {
  const [loading, setLoading] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);
  const [error, setError] = useState(null);
  const [profileDocId, setProfileDocId] = useState(null);
  const [globalRemaining, setGlobalRemaining] = useState(0);
  const [feeType, setFeeType] = useState("adjustment");

  useEffect(() => {
    setLoadingInit(true);

    try {
      const bucket = orbiterProfile?.payment?.orbiter || {};
      setProfileDocId(orbiterProfile?.id || orbiterProfile?.ujbCode || null);
      setGlobalRemaining(Math.max(Number(bucket.adjustmentRemaining ?? 0), 0));
      setFeeType(bucket.feeType || "adjustment");
    } catch (e) {
      console.error(e);
      setError("Failed to load adjustment bucket");
    } finally {
      setLoadingInit(false);
    }
  }, [orbiterProfile]);

  const applyAdjustmentForRole = useCallback(
    async ({
      role,
      requestedAmount,
      dealValue,
      ujbCode,
      referral,
      previewOnly = false,
    }) => {
      const req = Math.max(0, Number(requestedAmount || 0));

      if (!ujbCode || req <= 0 || collectionName !== "CCReferral") {
        return { cashToPay: req, deducted: 0 };
      }

      setLoading(true);
      setError(null);

      try {
        const data = previewOnly
          ? await previewCcReferralAdjustment({
              id: referralId,
              role,
              requestedAmount: req,
              dealValue,
              ujbCode,
            })
          : await applyCcReferralAdjustment({
              id: referralId,
              role,
              requestedAmount: req,
              dealValue,
              ujbCode,
            });

        const adjustment = data.adjustment || {};

        if (!previewOnly) {
          setGlobalRemaining(
            Math.max(Number(adjustment.newGlobalRemaining || 0), 0)
          );
          await onRefresh?.();
        }

        return {
          previewOnly,
          deducted: Number(adjustment.deducted || 0),
          cashToPay: Number(adjustment.cashToPay || req),
          newGlobalRemaining: Number(adjustment.newGlobalRemaining || 0),
          logEntry: adjustment.logEntry,
        };
      } catch (e) {
        console.error(e);
        setError("Failed to apply adjustment");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [collectionName, onRefresh, referralId]
  );

  return {
    loading,
    loadingInit,
    error,
    profileDocId,
    globalRemaining,
    feeType,
    applyAdjustmentForRole,
  };
};
