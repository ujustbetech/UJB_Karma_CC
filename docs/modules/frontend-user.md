---
module: frontend-user
title: Frontend User Module (Dashboard + Features)
status: draft
updatedAt: "2026-03-30"
---

## Overview
Authenticated user experience (OTP-authenticated) and user feature pages.

This module is tightly coupled to:
- `context/authContext.js` (client-side user state backed by cookie `crm_token`)
- `app/(user)/user/layout.js` (route guard + anti-flash)
- Firestore collections (mostly via `lib/utility_collection.js`, plus several direct collection names)

## Route-Group / Entry Points
- User layout & session guard: `app/(user)/user/layout.js`
- User dashboard landing: `app/(user)/user/page.js` (home)
- Feature pages:
  - Referrals:
    - `app/(user)/user/referrals/page.js`
    - `app/(user)/user/referrals/[id]/page.js`
  - Prospects:
    - `app/(user)/user/prospects/page.js`
    - `app/(user)/user/prospects/add/page.js`
    - `app/(user)/user/prospects/[id]/page.js`
  - Deals / redemption:
    - `app/(user)/user/deals/page.js`
  - CosmOrbiters marketplace:
    - `app/(user)/user/cosmorbiters/page.js`
    - `app/(user)/user/cosmorbiters/[id]/page.js`
  - Conclaves:
    - `app/(user)/user/conclave/page.js`
    - `app/(user)/user/conclave/[id]/page.js`
    - `app/(user)/user/conclave/meeting/[id]/page.js`
  - Monthly meetings:
    - `app/(user)/user/monthlymeeting/page.js`
    - `app/(user)/user/monthlymeeting/[id]/page.js`
  - Dewdrop content:
    - `app/(user)/user/dewdrop/content/page.js`
    - `app/(user)/user/dewdrop/content/[id]/page.js`
  - Contribution points:
    - `app/(user)/user/contribuitionpoint/page.js`
  - Profile:
    - `app/(user)/user/profile/page.js`

## Key Shared Dependencies
- Session & user state: `context/authContext.js` + protected session validation
- Firestore config and collection mapping:
  - `firebaseConfig.js`
  - `lib/utility_collection.js` (collection names via env)

## Primary Data Flows
### 1) Cookie session validation & route guard
- `app/(user)/user/layout.js` calls `GET /api/session/validate`
- While checking: returns `null` (prevents dashboard flash)
- On invalid session: redirects to `/login`

### 2) Agreement acceptance flow (home page)
- `app/(user)/user/page.js`:
  - reads `localStorage.getItem("mmUJBCode")`
  - loads user doc: `doc(db, COLLECTIONS.userDetail, ujbCode)`
  - if `agreementAccepted !== true`, prompts via SweetAlert
  - on acceptance:
    - calls `generateAgreementPDF()` from `utils/generateAgreementPDF.js`
    - uploads PDF to Firebase Storage
    - updates Firestore user doc fields:
      - `agreementAccepted: true`
      - `agreementAcceptedAt: new Date()`
      - `agreementType` (derived from `data.Category`)
      - `agreementPdfUrl`

### 3) Referrals (list + status updates + notifications)
- `app/(user)/user/referrals/page.js`:
  - obtains `currentUJB = sessionUser.profile.ujbCode` via `useAuth()`
  - realtime subscriptions:
    - “My Referrals”:
      - `where("cosmoOrbiter.ujbCode","==", currentUJB)` ordered by `timestamp desc`
    - “Passed Referrals”:
      - `where("orbiter.ujbCode","==", currentUJB)` ordered by `timestamp desc`
  - status changes:
    - `updateDoc` referral doc:
      - `dealStatus`
      - `"cosmoOrbiter.dealStatus"`
      - `statusLogs` (arrayUnion entries incl. `reason` for rejection)
      - `lastUpdated`
  - WhatsApp notifications:
    - observed inline `sendWhatsAppTemplate()` that directly calls Meta Graph from the client bundle
    - risk: a Meta Graph bearer token appears hardcoded in the page module
- `app/(user)/user/referrals/[id]/page.js`:
  - `onSnapshot(doc(db, COLLECTIONS.referral, id))`
  - derives `userRole`:
    - `cosmo` if current user matches `referral.cosmoUjbCode`
    - `orbiter` if matches `referral.orbiter.ujbCode`
    - else `admin`
  - renders `ReferralDashboardMobile`

### 4) Prospects
- `app/(user)/user/prospects/page.js`:
  - queries `COLLECTIONS.prospect` by:
    - `mentorUjbCode == ujbCode` (if ujbCode available)
    - `orbiterContact == phone` (if phone available)
  - merges/dedupes and sorts by `registeredAt.seconds desc`
- `app/(user)/user/prospects/add/page.js`:
  - fetches mentor with `getDoc(doc(db, "usersdetail", ujbCode))`
  - `addDoc(collection(db, COLLECTIONS.prospect), ...)`:
    - prospect info + mentor/orbiter linkage fields
    - `registeredAt: serverTimestamp()`, `userType: "orbiter"`
- `app/(user)/user/prospects/[id]/page.js` (assessment form):
  - uses subcollection:
    - `COLLECTIONS.prospect/{id}/prospectform`
  - prevents resubmission by checking whether subcollection already has docs
  - external calls:
    - CountriesNow API for country/city lists
  - on submit:
    - writes assessment doc to `prospectform`
    - CP logic:
      - ensures `CPBoard/{orbiter.ujbcode}` exists
      - writes `CPBoard/{orbiter.ujbcode}/activities` entry with activityNo `002`
      - updates `CPBoard/{orbiter.ujbcode}.totals`

### 5) Deals / redemption marketplace
- `app/(user)/user/deals/page.js`:
  - reads `localStorage.getItem("mmUJBCode")` and loads user from `COLLECTIONS.userDetail`
  - loads approved deals from direct collection `CCRedemption` and filters `status === "Approved"`
  - creates pending referral records via `addDoc(collection(db, "CCReferral"), ...)`

### 6) CosmOrbiters marketplace + referral submission
- `app/(user)/user/cosmorbiters/page.js`:
  - Firestore pagination over `COLLECTIONS.userDetail`:
    - `where("Category","==","CosmOrbiter")`
    - `orderBy("BusinessName")`, `limit(10)`, `startAfter(lastDoc)`
  - computes `aiScore` from services/products counts and `Verified`
- `app/(user)/user/cosmorbiters/[id]/page.js`:
  - loads business profile from `getDoc(doc(db, COLLECTIONS.userDetail, id))`
  - loads current orbiter profile from `getDoc(doc(db, COLLECTIONS.userDetail, currentUserUjbCode))`
  - favorites:
    - `favorites/${currentUserUjbCode}_${userDetails.ujbCode}`
  - referral count:
    - query `COLLECTIONS.referral` where `cosmoUjbCode == userDetails.ujbCode`
  - referral submission:
    - calls `submitReferral()` from `hooks/useReferral`

### 7) Dewdrop content (library + likes)
- `app/(user)/user/dewdrop/content/page.js`:
  - reads `ContentData` ordered by `AdminCreatedby desc`
- `app/(user)/user/dewdrop/content/[id]/page.js`:
  - reads `ContentData/{id}`
  - increments `totalViews` via `increment(1)`
  - likes:
    - increments `totallike` when first clicked (stateful `liked` guard)

### 8) Contribution points (CP board)
- `app/(user)/user/contribuitionpoint/page.js`:
  - loads `CPBoard/{ujbCode}/activities` ordered by `addedAt desc`
  - computes:
    - `totalPoints`
    - category totals by `categories` includes `"R" | "H" | "W"`
  - redemption requires `totalPoints >= 250`

### 9) Conclaves + RSVP
- `app/(user)/user/conclave/page.js`:
  - reads `COLLECTIONS.conclaves` and resolves leader name from `userdetails`
- `app/(user)/user/conclave/[id]/page.js`:
  - reads:
    - conclave doc: `doc(db, COLLECTIONS.conclaves, id)`
    - meetings: `collection(db, COLLECTIONS.conclaves, id, "meetings")`
  - sets `localStorage.conclaveId = id` for navigation
- `app/(user)/user/conclave/meeting/[id]/page.js`:
  - reads `conclaveId` and `mmOrbiter` phone from localStorage
  - fetches:
    - user name by querying `COLLECTIONS.userDetail` on `MobileNo`
    - meeting doc: `conclaves/{conclaveId}/meetings/{id}`
    - leader name by querying `COLLECTIONS.userDetail` on `MobileNo == conclave.leader`
  - RSVP writes:
    - `conclaves/{conclaveId}/meetings/{id}/registeredUsers/{phoneNumber}`
    - merges fields:
      - `response: "Accepted" | "Declined"`
      - `reason?`
      - `responseTime`

### 10) Monthly meetings
- `app/(user)/user/monthlymeeting/page.js`:
  - loads events from direct Firestore collection `MonthlyMeeting`
  - if `localStorage.mmOrbiter` (storedPhoneNumber) exists, checks whether the user is registered:
    - reads `MonthlyMeeting/{eventId}/registeredUsers/{storedPhoneNumber}`
  - derives counts from nested arrays (e.g., `referralSections`, `prospectSections`, `requirementSections`, `sections`, `e2aSections`)
  - links to `/user/monthlymeeting/{event.id}`
- `app/(user)/user/monthlymeeting/[id]/page.js`:
  - fetches:
    - event doc: `MonthlyMeeting/{id}`
    - registered users: `MonthlyMeeting/{id}/registeredUsers` (doc id is phone)
    - each registered user’s name via `userdetails/{phone}` (reads `" Name"` field)
  - computes countdown based on `eventInfo.time`
  - provides tab navigation; content is implemented for `Agenda` and `Users` in this route file.

### 11) Profile
- `app/(user)/user/profile/page.js`:
  - uses `useAuth()` to get `ujbCode`
  - loads user data: `getDoc(doc(db, COLLECTIONS.userDetail, ujbCode))`
  - while loading: shows `ProfileSkeleton`
  - renders:
    - `ProfileHero` (receives `setUser` and `ujbCode`)
    - `ProfileTabs` which switches between tabs:
      - About, Business, Services, Achievements, Network, Finance, Secure
  - tab implementations live in `components/profile/**` (not in this route file).

## Security / Privacy Considerations
- Cookie-based session (`crm_token`) and httpOnly token handling.
- Several flows use `localStorage` as a cross-page state carrier:
  - `mmUJBCode` used by home agreement acceptance and deals page
  - `mmOrbiter` + `conclaveId` used by conclave meeting RSVP
- Risks observed during deep read:
  - Hardcoded Meta WhatsApp bearer token appears in client-side referral module implementation.

## Manual Verification Notes (to finalize)
1. Login -> ensure user route guard passes.
2. Visit home -> accept agreement -> confirm PDF upload + Firestore flags.
3. Update referral deal status -> confirm Firestore mutation + (observed) WhatsApp side effects.

## Shared Anchors & Cross-Module Links
- `firebaseConfig.js`: shared Firebase client setup (used to obtain `db` in user routes and agreement flow).
- `lib/utility_collection.js`: `COLLECTIONS` mapping used across user Firestore reads/writes (and birthday payloads in admin).
- `utils/generateAgreementPDF.js`: agreement PDF generation and upload flow used on `app/(user)/user/page.js`.

Cross-links:
- Auth/session APIs and cookie/JWT rules: [`backend-api.md`](./backend-api.md)
- Auth entry points (OTP + admin login): [`frontend-auth.md`](./frontend-auth.md)
- Admin dashboards and management flows: [`frontend-admin.md`](./frontend-admin.md)
- Module index: [`index.md`](./index.md)

