# Plan 1 API Migration Todo

This checklist tracks the step-by-step migration from protected browser
Firestore access to authenticated API routes backed by portable repositories.

## Completed So Far

### Foundation implemented
- Shared API contracts/helpers added under `lib/api/`:
  - `contracts.mjs`
  - `response.mjs`
  - `request.mjs`
  - `logging.mjs`
- Shared auth guards and normalized auth context added under `lib/auth/`:
  - `userRequestAuth.mjs` with `requireUserSession(req)`
  - `adminRequestAuth.mjs` with `requireAdminSession(req, access?)`
  - `authContexts.mjs`
- Provider/repository foundation added under `lib/data/`:
  - `contracts.mjs`
  - `provider.mjs`
  - `firebase/provider.mjs`
  - `firebase/documentRepository.mjs`
  - `firebase/userRepository.mjs`
  - `firebase/referralRepository.mjs`
- Existing tests were updated to cover the new helpers in `tests/run-tests.mjs`.

### Referrals migration implemented
- User referrals API routes added/extended:
  - `app/api/user/referrals/route.js`
  - `app/api/user/referrals/[id]/route.js`
  - `app/api/user/referrals/[id]/discussion/route.js`
  - `app/api/user/referrals/[id]/chat/route.js`
  - `app/api/user/referrals/[id]/status/route.js`
- Referral server workflow/services added or updated:
  - `lib/referrals/referralServerWorkflow.mjs`
  - `lib/referrals/referralMutationWorkflow.mjs`
  - `services/referralService.js`
- Main user referrals UI migrated to authenticated API calls:
  - `app/(user)/user/referrals/page.js`
  - `app/(user)/user/referrals/[id]/page.js`
  - `components/referrals/ChatModal.js`
  - `components/referrals/tabs/DiscussionTab.js`
  - `components/referrals/tabs/OverviewTab.js`
  - `components/referrals/tabs/StakeholdersTab.js`
  - `components/referrals/ReferralDashboardMobile.js`
- Result: protected client Firestore usage has been removed from the main
  `/user/referrals` list/detail/discussion/chat path.

### CC referral detail flow implemented
- Dedicated authenticated route added:
  - `app/api/user/ccreferrals/[id]/route.js`
- Server-side workflow/services added:
  - `lib/referrals/ccReferralServerWorkflow.mjs`
  - `services/ccReferralService.js`
- Client hooks migrated from protected Firestore to authenticated API calls:
  - `hooks/useReferralDetails.js`
  - `hooks/useReferralPayments.js`
  - `hooks/useUjbDistribution.js`
  - `hooks/useReferralAdjustment.js`
- User page updated:
  - `app/(user)/user/ccreferral/[id]/page.js`
- Result: status updates, deal logs, followups, payments, payouts, and
  adjustment updates for `/user/ccreferral/[id]` now go through the API.
  Firebase Storage upload still happens client-side, but referral document
  updates after upload now go through the API instead of browser Firestore.

### Verification completed
- `npm.cmd test` passed after the implemented changes.
- `npm.cmd run build` passed after the implemented changes.
- Graphify was rebuilt after code changes.

### User home and discovery migration implemented
- User home/dashboard aggregation route added:
  - `app/api/user/home/route.js`
- User notifications route added:
  - `app/api/user/notifications/route.js`
- CosmOrbiter client services added:
  - `services/homeService.js`
  - `services/cosmorbitersService.js`
  - `services/userNotificationApiService.js`
- Protected home/dashboard UI migrated to authenticated API calls:
  - `app/(user)/user/page.js`
  - `components/home/NetworkOverview.js`
  - `components/home/EventEnrollmentCard.js`
  - `components/home/RecentReferrals.js`
  - `components/home/RecommendedServices.js`
  - `components/home/DewdropLearningSection.js`
  - `components/home/PerformanceSnapshot.js`
  - `components/home/NetworkActivity.js`
  - `components/home/NewlyAddedSection.js`
  - `components/home/TopOrbitersLeaderboard.js`
- Protected `cosmorbiters` UI migrated to authenticated API calls:
  - `app/(user)/user/cosmorbiters/page.js`
  - `app/(user)/user/cosmorbiters/[id]/page.js`
- Shared user shell/header migrated away from protected Firestore reads:
  - `components/mobile/MobileHeader.js`
  - `hooks/useUserNotifications.js`
- Cleanup completed for a leftover non-primary profile page:
  - `app/(user)/user/profile/page copy.js`
- Result: protected client Firestore usage has been removed from the active
  `/user` home/dashboard path, `/user/cosmorbiters` list/detail path, and
  shared notification/header read path.

### Verification updated
- `npm.cmd run build` passed after the latest user-surface migration changes.
- `npm.cmd test` currently fails in the existing Node test environment because
  `lib/referrals/referralServerWorkflow.mjs` imports `@/utils/*` aliases that
  are not resolved by the direct Node runner.
- Graphify was rebuilt after the latest code changes.

### Prospects migration implemented
- User prospects API route added:
  - `app/api/user/prospects/route.js`
- Prospect repository support added:
  - `lib/data/firebase/prospectRepository.mjs`
  - `lib/data/firebase/provider.mjs`
- Prospect client service added:
  - `services/prospectService.js`
- Protected user prospects UI migrated to authenticated API calls:
  - `app/(user)/user/prospects/page.js`
  - `app/(user)/user/prospects/add/page.js`
- Result: protected client Firestore usage has been removed from the user
  prospects list/add flow. Public assessment/feedback routes were already
  server-backed through `/api/prospects/[id]` and `/api/prospects/[id]/feedback`.

### Monthly meeting migration implemented
- User monthly meeting API routes added:
  - `app/api/user/monthlymeeting/route.js`
  - `app/api/user/monthlymeeting/[id]/route.js`
- Meeting repository support added:
  - `lib/data/firebase/meetingRepository.mjs`
  - `lib/data/firebase/provider.mjs`
- Monthly meeting client service added:
  - `services/monthlyMeetingService.js`
- Protected user monthly meeting UI migrated to authenticated API calls:
  - `app/(user)/user/monthlymeeting/page.js`
  - `app/(user)/user/monthlymeeting/[id]/page.js`
- Result: protected client Firestore usage has been removed from the
  `/user/monthlymeeting` list and detail path.

### Conclave migration implemented
- User conclave API routes added:
  - `app/api/user/conclave/route.js`
  - `app/api/user/conclave/[id]/route.js`
  - `app/api/user/conclave/[id]/meetings/[meetingId]/route.js`
- Conclave repository support added:
  - `lib/data/firebase/conclaveRepository.mjs`
  - `lib/data/firebase/provider.mjs`
- Conclave client service added:
  - `services/conclaveService.js`
- Protected user conclave UI migrated to authenticated API calls:
  - `app/(user)/user/conclave/page.js`
  - `app/(user)/user/conclave/[id]/page.js`
  - `app/(user)/user/conclave/meeting/[id]/page.js`
- Result: protected client Firestore usage has been removed from the
  `/user/conclave` list/detail/meeting path.

### Profile migration implemented
- Profile client service added:
  - `services/profileService.js`
- User profile page migrated to authenticated API read:
  - `app/(user)/user/profile/page.js`
- Profile edit sheets migrated to authenticated API writes:
  - `components/profile/EditHeroSheet.js`
  - `components/profile/tabs/EditAboutSheet.js`
  - `components/profile/tabs/EditAchievementSheet.js`
  - `components/profile/tabs/EditAdditionalInfoSheet.js`
  - `components/profile/tabs/EditBankDetailsSheet.js`
  - `components/profile/tabs/EditBusinessKycSheet.js`
  - `components/profile/tabs/EditBusinessSheet.js`
  - `components/profile/tabs/EditEducationInfoSheet.js`
  - `components/profile/tabs/EditHealthInfoSheet.js`
  - `components/profile/tabs/EditPersonalInfoSheet.js`
  - `components/profile/tabs/EditPersonalKycSheet.js`
  - `components/profile/tabs/EditProductSheet.js`
  - `components/profile/tabs/EditProfessionalInfoSheet.js`
  - `components/profile/tabs/EditServiceSheet.js`
- Result: protected client Firestore usage has been removed from the
  `/user/profile` read/update flow.

### Dewdrop migration implemented
- User dewdrop API routes added:
  - `app/api/user/dewdrop/route.js`
  - `app/api/user/dewdrop/[id]/route.js`
- Dewdrop client service added:
  - `services/dewdropService.js`
- Protected user dewdrop UI migrated to authenticated API calls:
  - `app/(user)/user/dewdrop/content/page.js`
  - `app/(user)/user/dewdrop/content/[id]/page.js`
- Result: protected client Firestore usage has been removed from the
  `/user/dewdrop/content` list/detail path, including view/like updates.

### User deals, redeem, and payments migration implemented
- User deals and redeem API routes added:
  - `app/api/user/deals/route.js`
  - `app/api/user/deals/[id]/route.js`
  - `app/api/user/redeem/route.js`
  - `app/api/user/payments/route.js`
- Shared user redemption workflows/services added:
  - `lib/redeem/userRedeemApiWorkflow.mjs`
  - `services/userCcMarketplaceService.js`
  - `services/userRedeemService.js`
- Protected user deals, redeem, and payments UI migrated to authenticated API calls:
  - `app/(user)/user/deals/page.js`
  - `app/(user)/user/deals/[id]/page.js`
  - `app/(user)/user/redeem/page.js`
  - `app/(user)/user/payments/page.js`
- Result: protected client Firestore usage has been removed from the active
  `/user/deals`, `/user/redeem`, and `/user/payments` flow.

### Shared cleanup advanced
- Shared notification hook cleanup completed:
  - `hooks/useUserNotifications.js`
  - `services/userNotificationApiService.js`
  - `services/userNotificationReadState.js`
- Unused protected client Firestore helpers removed:
  - `services/notificationService.js`
  - `hooks/useContentUpload.js`
  - `hooks/useEventDoc.js`
  - `hooks/useUsers.js`
- Result: the shared user notifications path now depends on authenticated API
  responses plus explicit local read-state storage, and dead Firestore-only
  helpers no longer remain in the active shared surface.

### Remaining public Firebase usage isolation started
- Removed an unused duplicate hook with direct Firestore/Storage access:
  - `hooks/useOrbiterSearch.js`
- Result: one misleading client-Firebase path has been eliminated, leaving the
  remaining intentional browser Firebase usage easier to inventory and migrate
  in later Phase D steps.

### Active user deals and redemption service cleanup implemented
- Active user marketplace and redemption pages rewired to API-backed user services:
  - `app/(user)/user/deals/page.js`
  - `app/(user)/user/deals/[id]/page.js`
  - `app/(user)/user/redeem/page.js`
  - `app/(user)/user/payments/page.js`
- User-facing API services confirmed as the active path:
  - `services/userCcMarketplaceService.js`
  - `services/userRedeemService.js`
- Result: the active user deals, redeem, and payments screens no longer depend
  on the legacy Firestore-backed `ccMarketplaceService` and `redeemService`.

### Admin redeem migration implemented
- Admin redeem API routes added:
  - `app/api/admin/redeem/route.js`
  - `app/api/admin/redeem/[id]/route.js`
- Admin redeem workflow/service added:
  - `lib/redeem/adminRedeemApiWorkflow.mjs`
  - `services/adminRedeemService.js`
- Admin redeem pages migrated to authenticated API calls:
  - `app/admin/redeem/add/page.js`
  - `app/admin/redeem/manage/page.js`
- Unused legacy shared services removed:
  - `services/redeemService.js`
  - `services/ccMarketplaceService.js`
- Result: the active admin redeem add/manage flow no longer depends on the
  legacy Firestore-backed redeem/marketplace services.

### Contribution points migration implemented
- User contribution point API routes added:
  - `app/api/user/contribution-points/route.js`
  - `app/api/user/contribution-points/[ujbCode]/route.js`
- Admin contribution point API routes added:
  - `app/api/admin/contribution-points/route.js`
  - `app/api/admin/contribution-points/[ujbCode]/route.js`
  - `app/api/admin/contribution-points/activities/route.js`
  - `app/api/admin/contribution-points/activities/[id]/route.js`
  - `app/api/admin/contribution-points/members/search/route.js`
  - `app/api/admin/contribution-points/assign/route.js`
- Contribution point workflow/services added:
  - `lib/contribution-points/apiWorkflow.mjs`
  - `services/userContributionPointService.js`
  - `services/adminContributionPointService.js`
  - `services/contributionPointShared.js`
- Unused legacy shared service removed:
  - `services/contributionPointService.js`
- Active user/admin contribution point screens migrated to authenticated API calls:
  - `app/(user)/user/contribuitionpoint/page.js`
  - `app/(user)/user/contribuitionpoint/[ujbCode]/page.js`
  - `app/admin/contribution-points/page.js`
  - `app/admin/contribution-points/activity/page.js`
  - `app/admin/contribution-points/add/page.js`
  - `app/admin/contribution-points/manage/page.js`
  - `app/admin/contribution-points/[ujbCode]/page.js`
- Result: the active contribution point user/admin screens no longer depend on
  the shared Firestore-backed `contributionPointService`.

### Birthday migration implemented
- Admin birthday API routes added:
  - `app/api/admin/birthday/route.js`
  - `app/api/admin/birthday/messages/route.js`
  - `app/api/admin/birthday/options/route.js`
  - `app/api/admin/birthday/[id]/route.js`
  - `app/api/admin/birthday/[id]/exists/route.js`
  - `app/api/admin/birthday/[id]/mark-sent/route.js`
- Birthday workflow/services added:
  - `lib/birthday/adminBirthdayApiWorkflow.mjs`
  - `services/adminBirthdayService.js`
  - `services/birthdayShared.js`
  - `services/birthdayImageUploadService.js`
- Unused legacy shared service removed:
  - `services/birthdayService.js`
- Active admin birthday hooks/components migrated away from browser Firestore:
  - `hooks/useBirthdayAdmin.js`
  - `hooks/useBirthdayCanvaForm.js`
  - `components/admin/birthday/BirthdayListClient.js`
  - `components/admin/birthday/BirthdayEditClient.js`
- Result: the active admin birthday list/add/edit/message flows now use
  authenticated API routes for Firestore reads/writes, while image upload stays
  isolated in a clearly named client storage helper.

## Phase A: Foundation
- [x] Add shared API response helpers.
- [x] Add shared user auth guard: `requireUserSession(req)`.
- [x] Add shared admin auth guard: `requireAdminSession(req, access?)`.
- [x] Normalize user/admin auth contexts.
- [x] Add repository contracts with JSDoc typedefs.
- [x] Add Firebase-backed provider resolver.
- [x] Add request validation helpers.
- [x] Add structured auth/provider logging helpers.
- [x] Verify current tests still pass.
- [x] Rebuild graphify knowledge graph after code changes.

## Phase B: User Feature Migration
- [x] Inventory direct client Firestore usage for the `referrals` family.
- [x] Migrate main `/user/referrals` list/detail/discussion/chat UI to `/api/user/referrals`.
- [x] Remove protected client Firestore usage from main `/user/referrals` UI path.
- [x] Migrate `/user/ccreferral/[id]` referral payments/followups/adjustment flow.
- [x] Remove protected client Firestore usage from `/user/ccreferral/[id]` referral document reads/writes.
- [x] Complete Phase B migration for the `referrals` family.
- [x] Inventory direct client Firestore usage for `prospects`.
- [x] Migrate `prospects` UI to `/api/user/prospects`.
- [x] Remove protected client Firestore usage from `prospects`.
- [x] Inventory direct client Firestore usage for `monthlymeeting`.
- [x] Migrate `monthlymeeting` UI to `/api/user/monthlymeeting`.
- [x] Remove protected client Firestore usage from `monthlymeeting`.
- [x] Inventory direct client Firestore usage for `conclave`.
- [x] Migrate `conclave` UI to `/api/user/conclave`.
- [x] Remove protected client Firestore usage from `conclave`.
- [x] Inventory direct client Firestore usage for `profile`.
- [x] Migrate `profile` UI to `/api/user/profile`.
- [x] Remove protected client Firestore usage from `profile`.
- [x] Inventory direct client Firestore usage for `dewdrop`.
- [x] Migrate `dewdrop` UI to `/api/user/dewdrop`.
- [x] Remove protected client Firestore usage from `dewdrop`.
- [x] Inventory direct client Firestore usage for the user home/dashboard path.
- [x] Migrate active `/user` dashboard widgets to authenticated API routes.
- [x] Remove protected client Firestore usage from the active `/user` home path.
- [x] Inventory direct client Firestore usage for `cosmorbiters`.
- [x] Migrate `cosmorbiters` UI to `/api/user/cosmorbiters`.
- [x] Remove protected client Firestore usage from `cosmorbiters`.
- [x] Migrate shared user notification/header reads to authenticated APIs.
- [x] Remove protected client Firestore usage from the shared user shell path.

## Phase C: Admin Hardening
- [x] Inventory direct client Firestore usage for admin `orbiters`.
- [x] Migrate admin `orbiters` to `/api/admin/orbiters`.
- [x] Inventory direct client Firestore usage for admin `prospects`.
- [x] Migrate admin `prospects` to `/api/admin/prospects`.
- [x] Inventory direct client Firestore usage for admin `referrals`.
- [x] Migrate admin `referrals` to `/api/admin/referrals`.
- [x] Inventory direct client Firestore usage for templates/settings.
- [x] Migrate templates/settings to `/api/admin/*`.
- [x] Inventory direct client Firestore usage for user management.
- [x] Migrate user management to `/api/admin/users`.
- [x] Centralize admin role checks in access-control services.

## Phase D: Shared Cleanup
- [x] Rewire active user `deals` pages to API-backed marketplace services.
- [x] Rewire active user `redeem` and `payments` pages to API-backed redemption services.
- [x] Migrate active admin `redeem` add/manage pages to authenticated API services.
- [x] Migrate active user/admin contribution point screens to authenticated API services.
- [x] Migrate active admin birthday flows to authenticated API services.
- [x] Refactor shared hooks to fetch through APIs or accept server data.
- [x] Remove unused protected client Firestore helpers.
- [x] Remove unused legacy marketplace/redemption shared services.
- [x] Remove unused legacy contribution point shared service.
- [x] Remove unused legacy birthday shared service.
- [ ] Isolate any remaining public Firebase usage behind clearly named hooks.
- [ ] Verify fresh user OTP-only login across migrated features.
- [ ] Verify fresh admin-only login across migrated admin flows.
- [ ] Verify expired/stale session failure behavior.
- [ ] Verify route/service tests do not depend on Firebase SDK types.
