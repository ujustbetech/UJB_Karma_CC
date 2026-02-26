import { useState } from "react";
import { createReferral } from "@/services/referralService";

export function useReferral() {
  const [loading, setLoading] = useState(false);

  const submitReferral = async (payload) => {
    try {
      setLoading(true);
      const referralId = await createReferral(payload);
      return referralId;
    } finally {
      setLoading(false);
    }
  };

  return { submitReferral, loading };
}