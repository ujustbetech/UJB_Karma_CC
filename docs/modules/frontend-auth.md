---
module: frontend-auth
title: Frontend Auth Module (OTP + Admin Login)
status: draft
updatedAt: "2026-03-30"
---

## Overview
This module covers authentication entry points and session wiring between the frontend and backend Route Handlers.

## Entry Points
- `app/layout.js`
- `app/page.js` (admin login landing)
- `app/(auth)/login/page.js` (user OTP login)
- `context/authContext.js` (client-side session state + logout)
- User session gating: `app/(user)/user/layout.js`
- Backend endpoints used by this module:
  - `app/api/send-otp/route.js`
  - `app/api/verify-otp/route.js`
  - `app/api/session/validate/route.js`
  - Logout endpoints (observed mismatch; see Security section)

## Key Flows
### 1) User OTP Login (Send OTP -> Verify OTP -> Cookie)
- OTP login screen (`app/(auth)/login/page.js`) performs:
  - On mount: `fetch("/api/session/validate", { credentials: "include" })`
    - if `res.status === 200`, redirects to `/user`
  - Step 1: user submits phone to `POST /api/send-otp` with JSON `{ phone }`
    - expects `{ success: true }` to proceed to OTP entry
  - Step 2: when OTP length reaches 4, it calls `POST /api/verify-otp` with JSON `{ phone, otp }`
    - expects `{ success: true }`
    - on success redirects to `/user`
- Backend session cookie is `crm_token` (JWT, set by `POST /api/verify-otp`)
- User pages rely on session validation through:
  - `context/authContext.js` and/or
  - `app/(user)/user/layout.js` calling `GET /api/session/validate`

Detailed backend contracts: see `docs/modules/backend-api.md`.

## Diagrams

### OTP Auth Flow
```mermaid
flowchart TD
  A[User enters phone] --> B[POST /api/send-otp]
  B --> C[WhatsApp sends OTP (template: code)]
  C --> D[User enters 4-digit OTP]
  D --> E[POST /api/verify-otp]
  E --> F[Create JWT cookie: crm_token]
  F --> G[GET /api/session/validate]
  G --> H[Protected user route renders / redirects to /user]
```

### Session Usage (Client Guards)
```mermaid
flowchart LR
  P[AuthProvider] --> V1[GET /api/session/validate]
  V1 --> U[User context state]
  L[app/(user)/user/layout.js] --> V2[GET /api/session/validate]
  V2 --> G1[If invalid: redirect to /login]
  A[app/admin/layout.js] --> S[sessionStorage AdminData gate]
```

### 2) Admin Login (Microsoft OAuth)
- Admin login (`app/page.js`):
  - On mount: if `sessionStorage.getItem("AdminData")` exists, redirects to `/admin/orbiters`
  - `handleMicrosoftLogin`:
    - `signInWithPopup(auth, microsoftProvider)` using Firebase auth
    - reads Firestore collection `AdminUsers` and matches by email (case-insensitive)
    - if not matched: alerts "You are not an Admin"
    - if matched: builds `AdminData`:
      - `email`, `name`, `role`, `designation`
      - `photo` prefers Firestore `matchedAdmin.photo`, otherwise `user.photoURL`
    - stores `AdminData` in `sessionStorage`
    - redirects to `/admin/orbiters`

### 3) Session Validation & Route Guarding
- `context/authContext.js`:
  - On mount: calls `GET /api/session/validate` (cookie-based) with `credentials: "include"`
  - If `res.ok`: stores response JSON in `user` context
  - Else: sets `user = null` and clears `loading`
  - Provides `logout()` which triggers a POST to `/api/session/logout` (see mismatch note below)
- `app/(user)/user/layout.js`:
  - Runs `GET /api/session/validate`
  - While checking: returns `null` to prevent dashboard flash
  - If `res.status !== 200` (or network error): redirects to `/login`

## Security Model
### JWT cookie & session validation
- Cookie name: `crm_token`
- Set during `POST /api/verify-otp`:
  - `httpOnly: true`
  - `secure: process.env.NODE_ENV === "production"`
  - `sameSite: "lax"`
  - `path: "/"`, `maxAge`: 180 days
- `GET /api/session/validate`:
  - verifies JWT with `process.env.JWT_SECRET`
  - checks:
    - session exists in `user_sessions/{sessionId}`
    - not revoked
    - `Date.now() <= expiry`
  - applies sliding refresh:
    - if expiry is within 7 days, extends expiry to 180 days from now

### OTP validation
- OTP generation & storage:
  - stored hashed in `otp_verifications/{mobile}`:
    - `otp` (bcrypt hash), `expiry` (5 minutes), `attempts`
- Verification:
  - max attempts: `attempts >= 5` => "Too many attempts"
  - expired OTP => doc deleted

### Device/session policy
- Auto-revoke oldest session:
  - when active sessions (`revoked == false && expiry > now`) reach `>= 3`
  - revokes oldest by `createdAt` and logs to `security_logs`
- Device + geo details are captured and stored with the created session.

## Logout Endpoint Mismatch (to confirm)
`context/authContext.js` calls `POST /api/session/logout` but the repo does not contain `app/api/session/logout/route.js`.
Observed alternatives in the repo:
- `POST /api/logout`
- `POST /api/logout-all`
- There is also `POST /api/admin/force-logout` which revokes sessions by `phone`.

## Env Vars & External Dependencies (to finalize)
- `JWT_SECRET`
- WhatsApp integration vars:
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_ACCESS_TOKEN`
- Microsoft OAuth config (if present elsewhere)

## Manual Verification Notes
1. Phone login: request OTP, verify OTP, then refresh browser and ensure `GET /api/session/validate` succeeds.
2. Session expiry: simulate expiry by adjusting Firestore session expiry; confirm `401` behavior.
3. Logout: trigger `logout()` from UI and confirm cookie is removed and protected routes redirect.

## Shared Anchors & Cross-Module Links
- `firebaseConfig.js`: shared initialization used by both API handlers and auth/login pages.
- `lib/utility_collection.js`: collection-name mapping used across modules (admin and user features).
- `utils/generateAgreementPDF.js`: agreement PDF flow lives in the user home flow.

Cross-links:
- Backend session/OTP contracts: [`backend-api.md`](./backend-api.md)
- User route guard and feature flows: [`frontend-user.md`](./frontend-user.md)
- Admin login + admin routes: [`frontend-admin.md`](./frontend-admin.md)
- Module index: [`index.md`](./index.md)

