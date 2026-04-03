export function normalizeReferralItem(item) {
  if (!item) return null;

  const normalized = JSON.parse(JSON.stringify(item));

  if (!normalized.agreedValue && normalized.percentage != null) {
    normalized.agreedValue = {
      mode: "single",
      single: { type: "percentage", value: String(normalized.percentage) },
      multiple: { slabs: [], itemSlabs: [] },
    };
  }

  return normalized;
}

export function buildReferralId(currentNumber, now = new Date()) {
  const year1 = now.getFullYear() % 100;
  const year2 = (now.getFullYear() + 1) % 100;

  return `Ref/${year1}-${year2}/${String(currentNumber).padStart(8, "0")}`;
}

export function buildReferralWritePayload({
  referralId,
  leadDescription,
  selectedFor,
  otherName,
  otherPhone,
  otherEmail,
  selectedItem,
  finalItem,
  cosmoDetails,
  orbiterDetails,
  timestampValue,
}) {
  return {
    referralId,
    referralSource: "User",
    referralType: selectedFor === "self" ? "Self" : "Others",
    leadDescription,
    dealStatus: "Pending",
    lastUpdated: timestampValue,
    timestamp: timestampValue,
    cosmoUjbCode: cosmoDetails.ujbCode,
    cosmoOrbiter: {
      name: cosmoDetails.name,
      email: cosmoDetails.email,
      phone: cosmoDetails.phone,
      ujbCode: cosmoDetails.ujbCode,
      mentorName: cosmoDetails.mentorName || null,
      mentorPhone: cosmoDetails.mentorPhone || null,
    },
    orbiter: {
      name: orbiterDetails.name,
      email: orbiterDetails.email,
      phone: orbiterDetails.phone,
      ujbCode: orbiterDetails.ujbCode,
      mentorName: orbiterDetails.mentorName || null,
      mentorPhone: orbiterDetails.mentorPhone || null,
    },
    referredForName: selectedFor === "someone" ? otherName : null,
    referredForPhone: selectedFor === "someone" ? otherPhone : null,
    referredForEmail: selectedFor === "someone" ? otherEmail : null,
    service: selectedItem.type === "service" ? finalItem : null,
    product: selectedItem.type === "product" ? finalItem : null,
    dealLogs: [],
    followups: [],
    statusLogs: [],
  };
}

export function buildReferralNotifications({
  selectedItem,
  orbiterDetails,
  cosmoDetails,
}) {
  const itemLabel = selectedItem.label;

  return [
    {
      phone: orbiterDetails.phone,
      parameters: [
        orbiterDetails.name,
        `🚀 You’ve successfully passed a referral for ${itemLabel}.`,
      ],
    },
    {
      phone: cosmoDetails.phone,
      parameters: [
        cosmoDetails.name,
        `✨ You’ve received a referral for ${itemLabel}.`,
      ],
    },
  ];
}
