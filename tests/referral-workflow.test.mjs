import test from "node:test";
import assert from "node:assert/strict";

import {
  buildReferralId,
  buildReferralNotifications,
  buildReferralWritePayload,
  normalizeReferralItem,
} from "../lib/referrals/referralWorkflow.mjs";

test("referral workflow normalizes legacy percentage items", () => {
  const item = normalizeReferralItem({
    name: "Design",
    percentage: 15,
  });

  assert.equal(item.agreedValue.single.type, "percentage");
  assert.equal(item.agreedValue.single.value, "15");
});

test("referral workflow builds stable referral ids", () => {
  const referralId = buildReferralId(3010, new Date("2026-04-03T00:00:00Z"));
  assert.equal(referralId, "Ref/26-27/00003010");
});

test("referral workflow builds payloads for someone else and notification fanout", () => {
  const payload = buildReferralWritePayload({
    referralId: "Ref/26-27/00003010",
    leadDescription: "Warm lead",
    selectedFor: "someone",
    otherName: "Lead Name",
    otherPhone: "8888888888",
    otherEmail: "lead@example.com",
    selectedItem: { type: "service", label: "Coaching" },
    finalItem: { name: "Coaching" },
    cosmoDetails: {
      ujbCode: "COS001",
      name: "Cosmo",
      email: "cosmo@example.com",
      phone: "7777777777",
    },
    orbiterDetails: {
      ujbCode: "ORB001",
      name: "Orbiter",
      email: "orbiter@example.com",
      phone: "6666666666",
    },
    timestampValue: "SERVER_TS",
  });

  assert.equal(payload.referralType, "Others");
  assert.equal(payload.referredForName, "Lead Name");
  assert.equal(payload.service.name, "Coaching");
  assert.equal(payload.product, null);
  assert.deepEqual(payload.followups, []);

  const notifications = buildReferralNotifications({
    selectedItem: { label: "Coaching" },
    orbiterDetails: { name: "Orbiter", phone: "6666666666" },
    cosmoDetails: { name: "Cosmo", phone: "7777777777" },
  });

  assert.equal(notifications.length, 2);
  assert.match(notifications[0].parameters[1], /Coaching/);
  assert.match(notifications[1].parameters[1], /Coaching/);
});
