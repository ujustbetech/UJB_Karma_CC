import { useRef, useState } from "react";
import { createReferral } from "@/services/referralService";

export function useReferral() {
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef(null);

  const submitReferral = async (payload) => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    const request = (async () => {
      try {
        setLoading(true);
        const referralId = await createReferral(payload);
        return referralId;
      } finally {
        setLoading(false);
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = request;

    try {
      return await request;
    } catch (error) {
      throw error;
    }
  };

  return { submitReferral, loading };
}
