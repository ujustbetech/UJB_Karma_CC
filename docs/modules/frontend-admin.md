---

## module: frontend-admin
title: Frontend Admin Module (Dashboards + Management)
status: draft
updatedAt: "2026-03-30"

## Overview

Admin experience: protected dashboards and management screens for orbiters/users, referrals, prospects, meetings, birthdays, conclaves, and content.

Most admin routes are client-side React pages that directly read/write Firestore, with some larger dashboards delegating to `components/admin/**`.

## Route-Group / Entry Points

- Admin route guard: `app/admin/layout.js`
- Admin layout + chrome:
  - `components/layout/AdminLayout.js`
  - `components/layout/Sidebar.js`
  - `components/layout/Topbar.js`
- Feature entry points (route handlers):
  - Admins:
    - `app/admin/users/manage/page.js` (CRUD list for `AdminUsers`)
    - `app/admin/users/add/page.js` (create `AdminUsers`)
  - Referrals:
    - `app/admin/referral/page.js` (dashboard + analytics)
    - `app/admin/referral/manage/page.js` (list/table + filters)
    - `app/admin/referral/add/page.js` (create referral + CP + WhatsApp notifications)
    - `app/admin/referral/[id]/page.js` (referral detail + status/payment/payout flows)
  - Prospects:
    - `app/admin/prospect/manage/page.js` (list/table + stage detection + Excel export)
    - `app/admin/prospect/add/page.js` (register prospect + email + WhatsApp)
    - `app/admin/prospect/edit/[id]/page.js` (multi-tab editing; delegates to many components)
    - `app/admin/prospect/export/page.js` (bulk export to Excel; reads subcollections)
  - Orbiters:
    - `app/admin/orbiters/page.js` (dashboard; delegates to `components/admin/orbiters/DashboardLayout.js`)
    - `app/admin/orbiters/list/page.js` (list/table with filters + delete)
    - `app/admin/orbiters/add/page.js` (create orbiter/cosmorbiter doc)
    - `app/admin/orbiters/[ujbcode]/page.js` (delegates to `components/admin/orbiters/OrbiterProfilePage`)
  - Monthly meetings:
    - `app/admin/monthlymeeting/page.js` (dashboard; delegates to `components/admin/monthlymeeting/MonthlyMeetingDashboard.js`)
    - `app/admin/monthlymeeting/list/page.js` (list/table + counts + delete)
    - `app/admin/monthlymeeting/add/page.js` (create meeting doc)
    - `app/admin/monthlymeeting/[eventId]/page.js` (edit meeting; fetches meeting + registeredUsers)
  - Birthdays:
    - `app/admin/birthday/page.js` (client birthday sender; delegates to `components/admin/birthday/BirthdayClient.js`)
    - `app/admin/birthday/list/page.js`, `app/admin/birthday/add/page.js`, `app/admin/birthday/edit/[id]/page.js` (delegated)
  - Conclaves:
    - `app/admin/conclave/list/page.js` (list/table)
    - `app/admin/conclave/add/page.js` (create conclave + convert selected ids to phone numbers)
    - `app/admin/conclave/edit/[eventId]/page.js` (edit conclave doc + add meetings)
    - `app/admin/conclave/addmeeting/[eventId]/page.js` (edit meeting details via section components)
  - Dewdrop / Content:
    - `app/admin/dewdrop/manage/page.js` (list/table + delete + CSV/Excel export)
    - `app/admin/dewdrop/category/page.js` (realtime category manager for `ContentCategory`)
    - `app/admin/dewdrop/add/page.js`, `app/admin/dewdrop/[id]/page.js` (delegated)
  - Kit:
    - `app/admin/kit/page.js`, `app/admin/kit/create/page.js`, `app/admin/kit/table/page.js` (mostly UI placeholders in current repo)

## Authorization Model

- Admin login is performed outside this module (see `app/page.js` in the auth doc). It stores user data in `sessionStorage` under `AdminData`.
- `app/admin/layout.js` reads `sessionStorage.getItem("AdminData")` and only renders the admin UI when authorized.

## Primary Data Flows (by feature)

### 1) Referrals

- `app/admin/referral/manage/page.js`
  - Firestore reads:
    - `collection(db, COLLECTIONS.referral)` ordered by `timestamp desc` (initial + pagination via `startAfter`)
  - UI filters:
    - search, referral type, deal status, orbiter filter
  - Mutations:
    - delete via `deleteDoc(doc(db, COLLECTIONS.referral, id))`
- `app/admin/referral/add/page.js`
  - Firestore reads:
    - loads all users from `collection(db, COLLECTIONS.userDetail)` for orbiter/cosmo selection
    - on selection, loads `selectedCosmo`/`selectedOrbiter` details via `getDoc(doc(db, COLLECTIONS.userDetail, ...))`
  - Mutations:
    - generates a `referralId` based on last existing referralId in `COLLECTIONS.referral`
    - creates a new referral record via `addDoc(collection(db, COLLECTIONS.referral), data)`
  - CP engine (client-side):
    - writes into `CPBoard/{orbiter.ujbCode}/activities` and updates `CPBoard/{orbiter.ujbCode}.totals`
  - External calls:
    - sends WhatsApp notifications by calling Meta Graph directly from the client with a **hardcoded** bearer token (see `sendWhatsAppTemplate()` / `fetch(...)` in the route file)
- `app/admin/referral/[id]/page.js`
  - Delegates major reads/writes to hooks:
    - `useReferralDetails(id)`, `useReferralPayments`, `useUjbDistribution`, `useReferralAdjustment`
  - External calls:
    - payout flow includes an inline WhatsApp sender that calls Meta Graph directly with a **hardcoded** bearer token

### 2) Prospects

- `app/admin/prospect/manage/page.js`
  - Firestore reads:
    - reads root prospect docs from `COLLECTIONS.prospect` and then derives “Current Stage” based on engagement/assessment flags (as implemented in the components)
  - Mutations:
    - deletes prospects and supports editing (navigation into edit route)
  - Export:
    - `xlsx` export (Excel)
- `app/admin/prospect/add/page.js`
  - Firestore reads:
    - loads users list from `collection(db, "usersdetail")`
  - External calls:
    - email: `emailjs.send(...)`
    - WhatsApp: `axios.post(https://graph.facebook.com/v22.0/..., { ... })` using **hardcoded** API URL and bearer token
  - Firestore writes:
    - creates a prospect doc in `collection(db, "Prospects")` (note: direct string collection usage in this route)
- `app/admin/prospect/edit/[id]/page.js`
  - Fetch:
    - reads the prospect doc via `getDoc(doc(db, COLLECTIONS.prospect, id))`
    - stores it as `eventData` and renders tab content from that state
  - Editor UX:
    - uses a tabbed editor (`activeTab`) where each tab delegates to a component under `components/admin/prospect/**`
    - wrapper tab list includes (examples): `EditProspectForm`, `ProspectFormDetails`, `FollowUpInfo`, `AssesmentBtn`, and many knowledge/NT/mail sections
  - Export:
    - includes a local CSV export helper that serializes `eventData` fields into a downloaded CSV
  - Save model:
    - most persistence is implemented inside the imported tab components; this wrapper coordinates which tab component is active
- `app/admin/prospect/export/page.js`
  - Reads root prospects from `collection(db, COLLECTIONS.prospect)`
  - Attempts to read engagement/prospect feedback subcollections for each prospect
  - Produces an Excel file via `xlsx`

### 3) Orbiters

- `app/admin/orbiters/page.js`
  - Delegates to `components/admin/orbiters/DashboardLayout.js`, which loads `usersdetail` to compute KPIs/charts
- `app/admin/orbiters/list/page.js`
  - Firestore reads:
    - `collection(db, COLLECTIONS.userDetail)` and maps `ProfileStatus`/`Status` variants to normalized status
  - Mutations:
    - delete via `deleteDoc(doc(db, COLLECTIONS.userDetail, userToDelete.id))`
- `app/admin/orbiters/add/page.js`
  - Reads:
    - loads potential mentors from `collection(db, COLLECTIONS.userDetail)` and scans for next UJB code
  - Writes:
    - creates new user doc via `setDoc(doc(db, COLLECTIONS.userDetail, finalCode), payload)`

### 4) Monthly meetings

- `app/admin/monthlymeeting/list/page.js`
  - Reads:
    - meeting list from `collection(db, COLLECTIONS.monthlyMeeting)`
    - for each meeting counts registered users by reading subcollection `registeredUsers`
  - Mutations:
    - deletes meeting doc
- `app/admin/monthlymeeting/add/page.js`
  - Writes:
    - creates new meeting doc in `collection(db, COLLECTIONS.monthlyMeeting)` with initialized arrays/sections
- `app/admin/monthlymeeting/[eventId]/page.js`
  - Reads:
    - fetches meeting doc with `getDoc(doc(db, COLLECTIONS.monthlyMeeting, eventId))`
    - subscribes to `onSnapshot(collection(..., "registeredUsers"))` to count attendance
  - Mutations:
    - “Save All Changes” invokes `ref.current.save()` on section components when they are dirty

### 5) Birthdays

- `app/admin/birthday/page.js` + delegated components (`BirthdayClient`)
  - Reads:
    - birthday candidate list from Firestore (`COLLECTIONS.birthdayCanva` as mapped)
  - External calls:
    - sends WhatsApp messages via backend `POST /api/send-birthday`
  - Mutations:
    - marks sent status in Firestore after successful send

### 6) Conclaves

- `app/admin/conclave/list/page.js`
  - Reads:
    - list from `COLLECTIONS.conclaves` and supports filtering
  - Mutations:
    - deletes conclave doc
- `app/admin/conclave/add/page.js`
  - Reads:
    - loads selectable users from `COLLECTIONS.userDetail`
  - Mutations:
    - creates conclave in `COLLECTIONS.conclaves`, converting selected ids to phone numbers (leader/ntMembers/orbiters)
- `app/admin/conclave/edit/[eventId]/page.js`
  - Reads:
    - conclave doc and `meetings` subcollection
  - Mutations:
    - updates conclave doc and can add meetings via `addDoc(collection(db, COLLECTIONS.conclaves, id, "meetings"), ...)`
- `app/admin/conclave/addmeeting/[eventId]/page.js`
  - Reads:
    - meeting doc via `getDoc(doc(db, COLLECTIONS.conclaves, conclaveId, "meetings", meetingId))`
  - “Save All Changes” calls section components’ save logic

### 7) Dewdrop content management

- `app/admin/dewdrop/manage/page.js`
  - Reads:
    - `getDocs(collection(db, "ContentData"))`
  - Mutations:
    - delete via `deleteDoc(doc(db, "ContentData", id))`
  - Exports:
    - CSV/Excel via `xlsx`
- `app/admin/dewdrop/category/page.js`
  - Realtime:
    - `onSnapshot(collection(db, "ContentCategory"))` ordered by `order asc`
  - Writes:
    - add/edit/toggle/reorder categories and record activity arrays on edit

## Security / Privacy Considerations

- Admin authorization is based on client-side `sessionStorage` gating (`AdminData`). There is no server-side authorization guard in the route files themselves.
- Several admin routes send WhatsApp via client-side Meta Graph calls with hardcoded bearer tokens:
  - `app/admin/referral/add/page.js`
  - `app/admin/referral/[id]/page.js`
  - `app/admin/prospect/add/page.js`
- Birthday messaging uses the backend route `POST /api/send-birthday` (safer because it centralizes token usage server-side).

## Manual Verification Notes

1. Login as admin and confirm `app/admin/layout.js` gates access correctly.
2. Test referral add -> ensure:
  - Firestore `COLLECTIONS.referral` doc is created
  - CPBoard updates happen
  - WhatsApp notifications attempt successfully
3. Test birthday sender -> confirm:
  - Birthday candidates list loads
  - `POST /api/send-birthday` is called
  - Firestore sent status updates after success.

## Shared Anchors & Cross-Module Links

- `firebaseConfig.js`: shared Firebase client initialization used by admin pages and dashboards.
- `lib/utility_collection.js`: `COLLECTIONS` mapping for Firestore collection names referenced across admin routes.
- `utils/generateAgreementPDF.js`: used by the user home agreement flow (not part of admin flows, but referenced for the overall product journey).

Cross-links:

- Auth/session flow: `[frontend-auth.md](./frontend-auth.md)`
- User feature flows: `[frontend-user.md](./frontend-user.md)`
- Backend route contracts: `[backend-api.md](./backend-api.md)`
- Module index: [`index.md`](./index.md)

