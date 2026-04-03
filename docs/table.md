# Firestore Collection Map

This document summarizes the Firestore collections referenced in the codebase, what each collection appears to be used for, and where the naming currently looks inconsistent.

## Notes

- Some collection names are environment-driven through `COLLECTIONS` in [lib/utility_collection.js](/D:/projects/UJB_Karma_CC/lib/utility_collection.js).
- That means the exact runtime collection name may differ by environment, but the purpose is still visible from the code.
- The codebase currently mixes environment-driven names and hardcoded names.
- A few names look like legacy, duplicate, or dev-only collections and should probably be reviewed before more features are built on top of them.

## 1. Active Core Collections

These appear to be the main application collections in active use.

| Collection | Source | Purpose |
| --- | --- | --- |
| `COLLECTIONS.userDetail` | env-driven | Main user/orbiter profile collection. Used for profile pages, referral participant lookups, content partner lookup, birthdays, conclaves, and prospect workflows. |
| `COLLECTIONS.referral` | env-driven | Main referral collection. Stores referral details, status logs, deal logs, followups, uploads, participants, and timestamps. |
| `COLLECTIONS.prospect` | env-driven | Main prospect collection. Used for prospect lifecycle tracking, forms, followups, engagement state, and stage progression. |
| `COLLECTIONS.monthlyMeeting` | env-driven | Monthly meeting event records. Used for admin event management and user event views. |
| `COLLECTIONS.conclaves` | env-driven | Conclave stream/event records, including related meetings and participants. |
| `COLLECTIONS.birthdayCanva` | env-driven | Birthday creative/card data used by the birthday admin workflow. |
| `AdminUsers` | hardcoded | Admin account records used by admin login and admin management screens. |
| `user_sessions` | hardcoded | Session store for logged-in users, including expiry and revocation. |
| `otp_verifications` | hardcoded | Temporary OTP verification records with expiry and retry tracking. |
| `security_logs` | hardcoded | Audit/security log collection for failed OTP attempts and forced session actions. |
| `login_history` | hardcoded | Login audit trail for successful user sign-ins. |
| `ContentData` | hardcoded | Dewdrop/content library items, including metadata, files, tags, and publishing state. |
| `ContentCategory` | hardcoded | Dewdrop/content category definitions used while creating/editing content. |
| `counters` | hardcoded | Numeric counters used for generating human-readable IDs such as referral numbers. |
| `CPBoard` | hardcoded | Contribution point board per orbiter. Appears to store CP totals and an `activities` subcollection for activity history. |

## 2. Active Subcollections

These are nested under parent documents and appear to be part of active workflows.

| Subcollection Path | Purpose |
| --- | --- |
| `COLLECTIONS.monthlyMeeting/{eventId}/registeredUsers` | Registration records for a monthly meeting event. |
| `COLLECTIONS.conclaves/{conclaveId}/meetings` | Meetings associated with a conclave. |
| `CPBoard/{ujbCode}/activities` | Activity history used for contribution point actions and prospect/referral milestone tracking. |
| `COLLECTIONS.prospect/{prospectId}/prospectform` | Prospect form submissions/details. |
| `COLLECTIONS.prospect/{prospectId}/meetings` | Prospect meeting records. |
| `COLLECTIONS.prospect/{prospectId}/intromeetings` | Intro meeting records for prospect onboarding. |
| `Prospects/{prospectId}/engagementform` | Engagement records used in some admin prospect flows. This likely overlaps with the env-driven prospect path and should be reviewed. |
| `chats/{chatId}/messages` | Chat messages for a chat thread. |
| `referrals/{referralId}/discussionMessages` | Referral discussion messages. This uses a separate hardcoded parent collection name and looks inconsistent with `COLLECTIONS.referral`. |

## 3. Likely Legacy or Alternate Collections

These are referenced in the code, but the naming suggests legacy or partially migrated usage.

| Collection | Purpose / Concern |
| --- | --- |
| `usersdetail` | User lookup collection used in OTP login and several older pages. Likely overlaps with `COLLECTIONS.userDetail`. |
| `usersDetail` | Another casing variant of the user detail collection. Looks like a duplicate naming path. |
| `UsersData` | Used in some Dewdrop/content files as a partner/user source. Likely overlaps with `COLLECTIONS.userDetail`. |
| `Prospects` | Hardcoded prospect collection used in multiple admin prospect components. Likely overlaps with `COLLECTIONS.prospect`. |
| `MonthlyMeeting` | Hardcoded meeting collection used in some user pages. Likely overlaps with `COLLECTIONS.monthlyMeeting`. |
| `Referral` | Hardcoded referral collection used in some home widgets. Likely overlaps with `COLLECTIONS.referral`. |
| `referrals` | Lowercase plural collection used by discussion messaging only. Likely overlaps with `COLLECTIONS.referral` but may represent a separate message container strategy. |
| `Orbiters` | Legacy orbiter collection used in a few home/mobile components. Likely overlaps with `COLLECTIONS.userDetail` or `COLLECTIONS.orbiter`. |

## 4. Dev or Demo Collections

These look like development-only or alternate-environment collections used by dashboard/home widgets.

| Collection | Purpose |
| --- | --- |
| `Referraldev` | Dev/demo referral collection used in dashboard widgets and leaderboard summaries. |
| `MonthlyMeeting_dev` | Dev/demo monthly meeting collection used in home event cards. |
| `Conclaves_dev` | Dev/demo conclave collection used in home event cards. |

## 5. Business-Specific Collections

These appear to support specific business flows outside the main referral/prospect model.

| Collection | Purpose |
| --- | --- |
| `CCRedemption` | Looks like redemption/deal records tied to contribution or rewards logic. |
| `CCReferral` | Appears to store referral/deal submissions in the deals/rewards flow. |

## 6. Collections Defined But Not Clearly Used

These are declared in `COLLECTIONS`, but I did not find strong active usage during this scan.

| Collection | Note |
| --- | --- |
| `COLLECTIONS.loginLogs` | Defined in the env-based collection map, but no clear active reads/writes were found in the scanned source files. |
| `COLLECTIONS.pageVisit` | Defined but not clearly used in the scanned source files. |
| `COLLECTIONS.doorstep` | Defined but not clearly used in the scanned source files. |
| `COLLECTIONS.orbiter` | Defined, but most active reads appear to use `COLLECTIONS.userDetail` instead. |

## 7. Cleanup Recommendations

The current Firestore naming is functional, but it is not fully consistent. The main cleanup opportunities are:

1. Standardize user storage around a single collection name.
   Current overlap: `COLLECTIONS.userDetail`, `usersdetail`, `usersDetail`, `UsersData`, and some older `Orbiters` usage.

2. Standardize prospect storage around a single parent collection.
   Current overlap: `COLLECTIONS.prospect` and `Prospects`.

3. Standardize referral storage around a single parent collection.
   Current overlap: `COLLECTIONS.referral`, `Referral`, `Referraldev`, and `referrals`.

4. Separate production and dev/demo collection names more clearly.
   Current overlap: `MonthlyMeeting` vs `MonthlyMeeting_dev`, `Conclaves` vs `Conclaves_dev`, `Referral` vs `Referraldev`.

5. Move remaining hardcoded collection names behind a shared config layer if they are intended to stay long-term.

## 8. High-Risk Inconsistencies

These are the mismatches most likely to cause bugs or data fragmentation:

- `COLLECTIONS.referral` vs `referrals`
- `COLLECTIONS.prospect` vs `Prospects`
- `COLLECTIONS.userDetail` vs `usersdetail` vs `usersDetail`
- `COLLECTIONS.monthlyMeeting` vs `MonthlyMeeting`
- `COLLECTIONS.userDetail` vs `UsersData`

If this project is heading toward a cleanup pass, these are the first places worth consolidating.
