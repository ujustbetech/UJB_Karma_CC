export async function createReferral(payload) {
  const response = await fetch("/api/user/referrals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || "Failed to create referral");
  }

  return data.referralId;
}

export async function updateReferralStatus({ id, status, rejectReason = "" }) {
  const response = await fetch(`/api/user/referrals/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status, rejectReason }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || "Failed to update referral");
  }

  return data.referral;
}
