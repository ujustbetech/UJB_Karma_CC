import assert from "node:assert/strict";

import {
  buildUserSessionRecord,
  buildUserSessionResponse,
  getLogoutAllRevocations,
  getLogoutCookieOptions,
  getUserSessionCookieOptions,
  shouldRefreshUserSession,
  USER_SESSION_MAX_AGE_MS,
  validateUserSessionRecord,
} from "../lib/auth/userSessionWorkflow.mjs";
import {
  buildBootstrapAdminRecord,
  buildAdminSessionPayload,
  findAuthorizedAdmin,
  shouldBootstrapAdmin,
  validateAdminSessionAccess,
} from "../lib/auth/adminAccessWorkflow.mjs";
import {
  buildAgreementAcceptanceUpdate,
  getAgreementTitle,
  getAgreementType,
  shouldPromptAgreement,
} from "../lib/agreements/agreementWorkflow.mjs";
import {
  buildReferralDuplicateKey,
  buildReferralLockId,
  buildReferralId,
  buildReferralNotifications,
  buildReferralWritePayload,
  isValidReferralEmail,
  isValidReferralPhone,
  normalizeReferralItem,
  validateReferralPayload,
} from "../lib/referrals/referralWorkflow.mjs";
import {
  buildReferralStatusUpdatePayload,
  getAcceptedReferralStatus,
  getRejectedReferralStatus,
  validateReferralCreationRequest,
  validateReferralStatusUpdate,
} from "../lib/referrals/referralMutationWorkflow.mjs";
import {
  REFERRAL_STATUSES,
  canTransitionReferralStatus,
  normalizeReferralStatus,
} from "../lib/referrals/referralStates.mjs";
import {
  REFERRAL_REWARD_TYPES,
  buildDealDistribution,
  getReferralRewardDetails,
} from "../utils/referralCalculations.js";

const results = [];

async function run(name, fn) {
  try {
    await fn();
    results.push({ name, status: "passed" });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, status: "failed", error });
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

const hasAdminAccess = (role) =>
  String(role || "").toLowerCase().includes("admin");

await run("OTP login creates a long-lived session record", () => {
  const now = 1_700_000_000_000;
  const session = buildUserSessionRecord({
    phone: "9999999999",
    ujbCode: "UJB001",
    userData: { Name: "Ruchita", Type: "Orbiter" },
    ip: "127.0.0.1",
    geo: { city: "Pune" },
    deviceInfo: { type: "Desktop" },
    now,
  });

  assert.equal(session.phone, "9999999999");
  assert.equal(session.name, "Ruchita");
  assert.equal(session.type, "Orbiter");
  assert.equal(session.expiry, now + USER_SESSION_MAX_AGE_MS);
});

await run("session validation rejects invalid sessions and refreshes near expiry", () => {
  const now = 1_700_000_000_000;

  assert.deepEqual(validateUserSessionRecord(null, now), {
    ok: false,
    reason: "missing",
  });
  assert.deepEqual(
    validateUserSessionRecord({ revoked: true, expiry: now + 1000 }, now),
    { ok: false, reason: "revoked" }
  );
  assert.deepEqual(
    validateUserSessionRecord({ revoked: false, expiry: now - 1 }, now),
    { ok: false, reason: "expired" }
  );
  assert.equal(
    shouldRefreshUserSession({ expiry: now + 1000 * 60 * 60 * 24 * 3 }, now),
    true
  );
  assert.equal(
    shouldRefreshUserSession({ expiry: now + 1000 * 60 * 60 * 24 * 20 }, now),
    false
  );
});

await run("logout and logout-all helpers expose cookie clearing and revocation targets", () => {
  const cookieOptions = getLogoutCookieOptions(true);
  assert.equal(cookieOptions.httpOnly, true);
  assert.equal(cookieOptions.secure, true);

  const revocations = getLogoutAllRevocations([
    { id: "a", ref: { update() {} }, data: () => ({ phone: "1" }) },
    { id: "b", ref: { update() {} }, data: () => ({ phone: "1" }) },
  ]);

  assert.deepEqual(
    revocations.map((item) => item.id),
    ["a", "b"]
  );
});

await run("session response and cookie helpers remain stable", () => {
  const payload = buildUserSessionResponse({
    phone: "9999999999",
    ujbCode: "UJB001",
    name: "Ruchita",
    type: "Orbiter",
  });

  assert.deepEqual(payload, {
    phone: "9999999999",
    role: "user",
    profile: {
      ujbCode: "UJB001",
      name: "Ruchita",
      type: "Orbiter",
    },
  });

  const cookie = getUserSessionCookieOptions(false);
  assert.equal(cookie.maxAge, USER_SESSION_MAX_AGE_MS / 1000);
});

await run("admin-only access boundaries stay role-aware", () => {
  const docs = [
    { data: () => ({ email: "member@example.com", role: "Member" }) },
    {
      data: () => ({
        email: "admin@example.com",
        role: "Admin",
        name: "Admin User",
      }),
    },
  ];

  const denied = findAuthorizedAdmin(docs, "member@example.com", hasAdminAccess);
  assert.equal(denied.ok, false);

  const allowed = findAuthorizedAdmin(docs, "admin@example.com", hasAdminAccess);
  assert.equal(allowed.ok, true);

  const payload = buildAdminSessionPayload(allowed.adminData, {
    email: "admin@example.com",
    name: "Fallback Name",
    picture: "photo.png",
  });
  assert.equal(payload.name, "Admin User");

  assert.equal(
    validateAdminSessionAccess({ role: "Member" }, hasAdminAccess).ok,
    false
  );
  assert.equal(
    validateAdminSessionAccess({ ...payload, designation: "" }, hasAdminAccess).ok,
    true
  );
});

await run("first admin login bootstraps when admin registry is empty", () => {
  assert.equal(shouldBootstrapAdmin([]), true);
  assert.equal(shouldBootstrapAdmin([{ data: () => ({}) }]), false);

  const bootstrap = buildBootstrapAdminRecord({
    email: "founder@example.com",
    name: "Founder",
    picture: "photo.png",
  });

  assert.equal(bootstrap.email, "founder@example.com");
  assert.equal(bootstrap.role, "Admin");
  assert.equal(bootstrap.designation, "Founding Admin");
  assert.equal(bootstrap.bootstrap, true);
});

await run("agreement acceptance workflow remains consistent", () => {
  assert.equal(shouldPromptAgreement({ agreementAccepted: false }), true);
  assert.equal(shouldPromptAgreement({ agreementAccepted: true }), false);
  assert.equal(getAgreementTitle("CosmOrbiter"), "Listed Partner Agreement");
  assert.equal(getAgreementType("Orbiter"), "PARTNER");

  const acceptedAt = new Date("2026-04-03T10:00:00Z");
  assert.deepEqual(
    buildAgreementAcceptanceUpdate({
      category: "CosmOrbiter",
      pdfUrl: "https://example.com/agreement.pdf",
      acceptedAt,
    }),
    {
      agreementAccepted: true,
      agreementAcceptedAt: acceptedAt,
      agreementType: "LISTED_PARTNER",
      agreementPdfUrl: "https://example.com/agreement.pdf",
    }
  );
});

await run("referral creation workflow builds ids, payloads, and notifications", () => {
  assert.equal(
    buildReferralId(3010, new Date("2026-04-03T00:00:00Z")),
    "Ref/26-27/00003010"
  );

  const item = normalizeReferralItem({ name: "Design", percentage: 15 });
  assert.equal(item.agreedValue.single.value, "15");

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
  assert.equal(payload.service.name, "Coaching");

  const notifications = buildReferralNotifications({
    selectedItem: { label: "Coaching" },
    orbiterDetails: { name: "Orbiter", phone: "6666666666" },
    cosmoDetails: { name: "Cosmo", phone: "7777777777" },
  });

  assert.equal(notifications.length, 2);
});

await run("referral create validation rejects self-referrals and duplicates", () => {
  const payload = {
    selectedItem: { type: "service", label: "Coaching" },
    leadDescription: "Warm lead",
    selectedFor: "self",
    cosmoDetails: {
      ujbCode: "ORB001",
      email: "same@example.com",
      phone: "9999999999",
    },
    orbiterDetails: {
      ujbCode: "ORB001",
      email: "same@example.com",
      phone: "9999999999",
    },
  };

  assert.equal(validateReferralPayload(payload).ok, false);
  assert.equal(
    validateReferralCreationRequest({
      payload: {
        ...payload,
        cosmoDetails: {
          ujbCode: "COS001",
          email: "cosmo@example.com",
          phone: "8888888888",
        },
      },
      isDuplicate: true,
    }).ok,
    false
  );
  assert.equal(isValidReferralPhone("99999"), false);
  assert.equal(isValidReferralEmail("bad-email"), false);
});

await run("referral duplicate keys and lock ids remain stable", () => {
  const duplicateKey = buildReferralDuplicateKey({
    selectedItem: { type: "service", label: "Coaching" },
    selectedFor: "someone",
    otherName: "Lead Name",
    otherPhone: "+91 88888 88888",
    otherEmail: "lead@example.com",
    cosmoDetails: { ujbCode: "COS001", email: "cosmo@example.com", phone: "7777777777" },
    orbiterDetails: { ujbCode: "ORB001", email: "orbiter@example.com", phone: "6666666666" },
  });

  assert.match(duplicateKey, /target:918888888888/);
  assert.match(buildReferralLockId(duplicateKey), /^user-referral-/);
});

await run("referral status workflow supports accept and reject transitions", () => {
  assert.equal(normalizeReferralStatus("Reject"), REFERRAL_STATUSES.REJECTED);
  assert.equal(
    canTransitionReferralStatus(
      REFERRAL_STATUSES.PENDING,
      getAcceptedReferralStatus()
    ),
    true
  );
  assert.equal(
    validateReferralStatusUpdate({
      currentStatus: REFERRAL_STATUSES.PENDING,
      nextStatus: getRejectedReferralStatus(),
      rejectReason: "",
    }).ok,
    false
  );

  const acceptedPayload = buildReferralStatusUpdatePayload({
    nextStatus: getAcceptedReferralStatus(),
    now: new Date("2026-04-03T00:00:00Z"),
  });
  assert.equal(acceptedPayload.status, REFERRAL_STATUSES.ACCEPTED);

  const rejectedPayload = buildReferralStatusUpdatePayload({
    nextStatus: getRejectedReferralStatus(),
    rejectReason: "Not a fit",
    now: new Date("2026-04-03T00:00:00Z"),
  });
  assert.equal(rejectedPayload.rejectReason, "Not a fit");
});

await run("referral percentage rewards calculate against the deal value", () => {
  const item = {
    agreedValue: {
      mode: "single",
      single: {
        type: "percentage",
        value: 10,
      },
    },
  };

  const reward = getReferralRewardDetails(10000, item);
  const distribution = buildDealDistribution(10000, { service: item });

  assert.equal(reward.rewardType, REFERRAL_REWARD_TYPES.PERCENTAGE);
  assert.equal(reward.rewardAmount, 1000);
  assert.equal(distribution.agreedAmount, 1000);
});

await run("referral fixed rewards stay as rupee amounts", () => {
  const item = {
    agreedValue: {
      mode: "single",
      single: {
        type: "fixed",
        value: 10,
      },
    },
  };

  const reward = getReferralRewardDetails(10000, item);
  const distribution = buildDealDistribution(10000, { service: item });

  assert.equal(reward.rewardType, REFERRAL_REWARD_TYPES.FIXED);
  assert.equal(reward.rewardAmount, 10);
  assert.equal(distribution.agreedAmount, 10);
  assert.equal(distribution.percentage, 0);
});

const failed = results.filter((result) => result.status === "failed");

console.log(`\n${results.length - failed.length}/${results.length} checks passed`);

if (failed.length) {
  process.exitCode = 1;
}
