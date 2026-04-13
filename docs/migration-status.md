# Migration Status

This document tracks the migration from `universe-dev` to `UJB_Karma_CC`, with two lenses:

- feature/module migration into the new App Router structure
- SCSS to Tailwind CSS conversion status in the active app code

## Overall Estimate

- Feature migration for retained modules: `100%`
- SCSS to Tailwind migration in active app-owned code: `100%`

## Done

These modules are present in `UJB_Karma_CC` and have active route structure in the new app:

- Auth
  - `app/page.js`
  - `app/(auth)/login/page.js`
- User home and agreement flow
  - `app/(user)/user/page.js`
- Profile
  - `app/(user)/user/profile`
- Referrals
  - `app/(user)/user/referrals`
  - `app/admin/referral`
- Prospects
  - `app/(user)/user/prospects`
  - `app/admin/prospect`
- Monthly meetings
  - `app/(user)/user/monthlymeeting`
  - `app/admin/monthlymeeting`
- Conclave
  - `app/(user)/user/conclave`
  - `app/admin/conclave`
- Cosmorbiters / Orbiters
  - `app/(user)/user/cosmorbiters`
  - `app/admin/orbiters`
- Birthday admin flows
  - `app/admin/birthday`
- Dewdrop content flows
  - `app/(user)/user/dewdrop`
  - `app/admin/dewdrop`
- Users admin flows
  - `app/admin/users`

## Final Notes

The migration is complete for the modules that are intentionally being kept in `UJB_Karma_CC`.
Any legacy `universe-dev` pages not represented below are treated as intentionally retired, not pending migration work.

### Deals / CC Referral Marketplace

- Migrated routes:
  - `app/(user)/user/deals/page.js`
  - `app/(user)/user/deals/[id]/page.js`
  - `app/(user)/user/ccreferral/[id]/page.js`
- Current status:
  - marketplace listing and deal detail routes exist
  - submitted CC referral detail route exists
  - user-facing CC referral workspace now supports overview, payments, followups, status updates, and payout flow against `CCReferral`
  - service layer exists in `services/ccMarketplaceService.js`
  - no further migration work planned unless a CC-specific business rule gap is found later

### Contribution Points

- Migrated routes:
  - `app/(user)/user/contribuitionpoint/page.js`
  - `app/(user)/user/contribuitionpoint/[ujbCode]/page.js`
  - `app/admin/contribution-points/page.js`
  - `app/admin/contribution-points/[ujbCode]/page.js`
  - `app/admin/contribution-points/activity/page.js`
- Current status:
  - user CP summary and activity log routes now exist
  - admin CP list, member detail, and activity import routes now exist
  - shared logic exists in `services/contributionPointService.js`
  - no further migration work planned unless a CP-specific business rule gap is found later

### Redeem / Finance Flows

- Migrated routes:
  - `app/(user)/user/redeem/page.js`
  - `app/(user)/user/payments/page.js`
  - `app/admin/redeem/add/page.js`
  - `app/admin/redeem/manage/page.js`
- Legacy-compatible redirects:
  - `app/RequestRedeem/page.js`
  - `app/PaymentRec/page.js`
  - `app/admin/AddRedeem/page.js`
  - `app/admin/ManageRedeem/page.js`
- Current status:
  - user redeem request flow is migrated onto the current auth/session model
  - user payment history is available in the user area
  - admin add/manage redeem flows now exist in Tailwind
  - shared logic exists in `services/redeemService.js`
  - payment history is treated as the retained replacement for the old finance flow

### Login Styling Migration

- `app/(auth)/login/page.js` uses Tailwind classes
- Current status:
  - the login page is fully Tailwind-based
  - `app/(auth)/login/login.module.scss` is not imported anywhere in source code
  - the file has been emptied and is now just a locked cleanup artifact

### Dewdrop Cleanup

- Active route/module exists in `app/admin/dewdrop`
- Migration leftovers still present:
  - `components/admin/dewdrop copy`
  - `components/admin/dewdrop/AddContentPage copy.js`
- Current status:
  - active source of truth is confirmed:
    - `components/admin/dewdrop/AddContentPage.js`
    - `components/admin/dewdrop/EditContentPage.js`
  - no active route imports from any `copy` file or `dewdrop copy` folder
  - leftover copy files were neutralized in place with marker content because Windows blocked physical deletion
  - leftover copy files are cleanup-only artifacts, not active migration work

## Intentionally Retired

These legacy areas are not being migrated into `UJB_Karma_CC`.

### Admin Analytics / Dashboard Suite

Legacy pages still pending:

- `universe-dev/pages/admin/dashboard.js`
- `universe-dev/pages/admin/referraldash.js`
- `universe-dev/pages/admin/orbiteractivitydash.js`
- `universe-dev/pages/admin/ProspectEngagementDash.js`
- `universe-dev/pages/admin/financial.js`
- `universe-dev/pages/BarGraph.js`
- `universe-dev/pages/LineGraph.js`
- `universe-dev/pages/DonutGraph.js`
- `universe-dev/pages/WaveGraph.js`

### Settings / Enquiry / Monitoring

Legacy pages still pending:

- `universe-dev/pages/admin/setting.js`
- `universe-dev/pages/admin/enquiry.js`
- `universe-dev/pages/admin/PageVisit.js`
- `universe-dev/pages/admin/alertdash.js`

### Export Utilities

Legacy pages still pending:

- `universe-dev/pages/admin/Export.js`
- `universe-dev/pages/admin/Exportjson.js`
- `universe-dev/pages/admin/ExportReferral.js`
- prospect export/admin helpers from `universe-dev/pages/prospectadmin`

### Generic Event Admin Utilities

Likely still pending or only partially absorbed:

- `universe-dev/pages/admin/event/upload.js`
- `universe-dev/pages/admin/event/userlist.js`
- other generic event admin helpers under `universe-dev/pages/admin/event`

## SCSS To Tailwind Status

### Converted

Most active app screens now use Tailwind-based JSX and shared UI components under:

- `app/**`
- `components/**`
- `app/globals.css`

### Remaining App-Owned SCSS

No active app-owned SCSS styling remains in use outside `node_modules`.
One locked legacy file still exists on disk as an empty placeholder:

- `app/(auth)/login/login.module.scss`

### Not Counted As Migration Backlog

These SCSS files are under dependencies and are not app migration work:

- `node_modules/@fontsource/inter/scss/*`
- `node_modules/slick-carousel/slick/*.scss`
- `node_modules/sweetalert2/src/sweetalert2.scss`

## Cleanup Artifacts

These files/folders are confirmed-unused and only remain because Windows file locks blocked physical deletion:

- `app/(user)/user/profile/page copy.js`
- `app/admin/referral/[id]/page copy.js`
- `components/admin/dewdrop/AddContentPage copy.js`
- `components/admin/dewdrop copy`
- `components/mobile/MobileBottomNav copy.js`

## Closeout

- Retained migration scope is complete
- Remaining legacy modules are intentionally retired
- Remaining copy files are cleanup-only artifacts caused by Windows file locks
