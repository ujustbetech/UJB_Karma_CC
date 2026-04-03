---
module: backend-api
title: Backend API Module (Next.js Route Handlers)
status: draft
updatedAt: "2026-03-30"
---

## Overview

This module describes Next.js route handlers under `app/api/**/route.js`, including auth/session, WhatsApp messaging, and AI topic generation.

## Route Handlers (observed)

All of the following files exist in the repo:

- `app/api/send-otp/route.js`
- `app/api/verify-otp/route.js`
- `app/api/session/validate/route.js`
- `app/api/send-whatsapp/route.js`
- `app/api/send-birthday/route.js`
- `app/api/generate-topic/route.js`
- `app/api/logout/route.js`
- `app/api/logout-all/route.js`
- `app/api/admin/force-logout/route.js`

## Detailed Contracts

### `POST /api/send-otp` (`app/api/send-otp/route.js`)

Request JSON:

- `phone` (string, required): must be exactly `10` digits (no explicit non-digit stripping in this route)

Validation / edge cases:

- Missing/invalid length => `400`:
  - `{ success: false, message: "Invalid phone number" }`
- User existence check:
  - Firestore: `usersdetail` where `"MobileNo" == mobile`
  - If empty => `404`:
    - `{ success: false, message: "This number is not registered." }`

Behavior:

- Generates:
  - OTP: random 4-digit string
  - expiry: `Date.now() + 5 minutes`
- Hashes OTP with `bcrypt` (salt rounds = 10)
- Stores OTP hash in:
  - `otp_verifications/{mobile}` with:
    - `otp` (hashed), `expiry`, `createdAt` (serverTimestamp), `attempts: 0`
- Sends WhatsApp OTP via Meta Graph:
  - POST `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`
  - Template name: `code`
  - Body component parameter: OTP text

Env vars / external dependencies:

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`

Responses:

- Success (200):
  - `{ success: true, message: "OTP sent successfully" }`
- WhatsApp API failure => `500`:
  - `{ success: false, message: whatsappResult.error?.message || "WhatsApp message failed" }`
- Unexpected error => `500`:
  - `{ success: false, message: "Internal server error" }`

### `POST /api/verify-otp` (`app/api/verify-otp/route.js`)

Request JSON:

- `phone` (string, required)
- `otp` (string/number, required)

Validation / edge cases:

- Missing `phone`/`otp` => `{ success: false, message: "Missing data" }` (no explicit status set)
- OTP verification reads:
  - Firestore: `otp_verifications/{mobile}`
- OTP not found => `{ success: false, message: "OTP not found" }`
- Expired OTP:
  - if `Date.now() > data.expiry`, deletes OTP doc and returns:
    - `{ success: false, message: "OTP expired" }`
- Too many attempts:
  - if `data.attempts >= 5` => `{ success: false, message: "Too many attempts" }`

OTP mismatch handling:

- `bcrypt.compare(otp, data.otp)`
- On mismatch:
  - updates `attempts: data.attempts + 1`
  - writes to `security_logs`:
    - `{ type: "FAILED_OTP", phone: mobile, time: Date.now() }`
  - returns `{ success: false, message: "Incorrect OTP" }`

On success:

1. Deletes OTP doc.
2. Loads user from:
  - `usersdetail` where `"MobileNo" == mobile`
  - If empty => `404` `{ success: false, message: "User not found" }`
  - Uses doc id as `ujbCode`.
3. Captures IP + geo (best-effort):
  - IP headers: `x-forwarded-for` first entry or `x-real-ip`
  - Geo lookup calls `http://ip-api.com/json/${ip}` when IP is known.
4. Detects deviceInfo from `user-agent` (type/OS/browser)
5. Session policy:
  - Queries `user_sessions` where:
    - `phone == mobile` and `revoked == false`
  - Filters active sessions by `expiry > Date.now()`
  - Caps to 3:
    - revokes oldest session by `createdAt` (sets `revoked: true`)
    - logs to `security_logs` with:
      - `type: "AUTO_REVOKE_OLDEST_SESSION"`, `phone`, `revokedSessionId`, `time`
6. Creates new session document:
  - `user_sessions/{uuid}` with:
    - `phone`, `ujbCode`, `name`, `type`
    - `ip`, `geo`, `deviceInfo`
    - `createdAt`, `expiry` (now + 180d), `revoked:false`
7. Writes login history:
  - `login_history` doc with `phone`, `ujbCode`, `ip`, `geo`, `deviceInfo`, `loginTime`
8. Creates JWT:
  - signed with `process.env.JWT_SECRET`
  - payload: `{ phone: mobile, sessionId, ujbCode }`
  - cookie token name: `crm_token`
  - cookie expiry/maxAge: 180d
9. Sets cookie:
  - httpOnly: `true`
  - secure: `NODE_ENV === "production"`
  - sameSite: `"lax"`
  - path: `"/"`

Responses:

- Success: JSON `{ success: true }` with `crm_token` cookie set
- Unexpected error: `{ success: false, message: "Server error" }` (no explicit status set)

### `GET /api/session/validate` (`app/api/session/validate/route.js`)

Inputs:

- Reads cookie: `crm_token`

Validation / failure responses:

- No token => `401` `{ message: "No token" }`
- JWT verify error => `401` `{ message: "Unauthorized" }`
- Session missing => `401` `{ message: "Session not found" }`
- Revoked/expired => `401` `{ message: "Session invalid" }`

Sliding refresh:

- If `expiry - now < 7 days`, updates session expiry:
  - `expiry = now + 180 days`

Success (`200`) response:

- `{`
  - `phone`
  - `role: "user"`
  - `profile: { ujbCode, name, type }`
  - `}`

### `POST /api/send-whatsapp` (`app/api/send-whatsapp/route.js`)

Request JSON:

- `phone` (required)
- `name` (optional)
- `message` (required)

Validation:

- Missing `phone` or `message` => `400`:
  - `{ error: "Missing phone or message" }`

Behavior:

- Formats `phone` to digits only.
- Sends WhatsApp template `referral_module` via Graph:
  - POST `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`
  - Template components:
    - body parameters: `[name || "User", message]`

Responses:

- Success: `{ success: true }`
- Graph failure: `500` with Graph JSON

### `POST /api/send-birthday` (`app/api/send-birthday/route.js`)

Request JSON:

- `user` (required object):
  - `phone` (required)
  - `name` (required)
  - `imageUrl` (optional)

Validation:

- Invalid payload => `400`:
  - `{ error: "Invalid payload" }`

Behavior:

1. Sends birthday WhatsApp template `daily_reminder` to `user.phone` (digits only).
2. Loads mentor from Firestore:
  - doc: `doc(db, COLLECTIONS.userDetail, originalPhone)`
3. If mentor doc exists and `Mentor Phone` exists:
  - generates pronoun-based mentor message using `Gender`
  - sends a second WhatsApp template to the mentor phone.

External dependencies:

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`

Responses:

- Success: `{ success: true, message: "Birthday messages sent successfully" }`
- Failure: `500` `{ error: "Failed to send message" }`

### `POST /api/generate-topic` (`app/api/generate-topic/route.js`)

Request JSON:

- `context` (string, used in prompt)

Behavior:

- Creates OpenAI client using `OPENAI_API_KEY`
- Calls chat completion:
  - model: `gpt-4o-mini`
  - system: "You generate business meeting topics."
  - user prompt: "Generate 5 business networking meeting topic ideas..." + `context`

Responses:

- Success: `{ text }`
- Failure => `500` `{ error: "AI failed" }`

### `POST /api/logout` (`app/api/logout/route.js`)

Behavior:

- Reads cookie `crm_token`
- If token exists:
  - verifies JWT with `JWT_SECRET`
  - revokes session in Firestore: `user_sessions/{sessionId}` sets `revoked:true`
- Always deletes cookie by setting `crm_token` to empty with:
  - `httpOnly:true`, `expires:new Date(0)`, `path:"/"`, `secure:true`, `sameSite:"strict"`

Response:

- `{ success: true }`

### `POST /api/logout-all` (`app/api/logout-all/route.js`)

Behavior:

- Reads `crm_token` and verifies JWT
- Queries `user_sessions` where `phone == decoded.phone`
- Revokes all matching sessions (`revoked:true`)

Response:

- `{ success: true }`

### `POST /api/admin/force-logout` (`app/api/admin/force-logout/route.js`)

Request JSON:

- `phone`

Behavior:

- Queries `user_sessions` where `phone == requested phone`
- Revokes all matching sessions (`revoked:true`)

Response:

- `{ success: true }`

## Env Vars & External Dependencies

- `JWT_SECRET`
- WhatsApp Graph:
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_ACCESS_TOKEN`
- OpenAI:
  - `OPENAI_API_KEY`

External network calls:

- Geo lookup: `http://ip-api.com/json/${ip}` (inside `verify-otp`)
- Meta WhatsApp Graph API (inside `send-otp`, `send-whatsapp`, `send-birthday`)
- OpenAI API (inside `generate-topic`)

## Known Integration Mismatch (to confirm with code)

- Frontend calls `POST /api/session/logout` but repo exposes:
  - `POST /api/logout`
  - `POST /api/logout-all`

## Shared Anchors & Cross-Module Links
- `firebaseConfig.js`:
  - Initializes the shared Firebase client objects used across backend handlers and frontend pages (`db`, `auth`, `storage`).
- `lib/utility_collection.js`:
  - Provides the `COLLECTIONS` mapping used by several routes (notably `send-birthday`).
- `utils/generateAgreementPDF.js`:
  - Used by the user home flow (agreement acceptance PDF generation + upload).

Cross-links:
- Auth/session flow details: [`frontend-auth.md`](./frontend-auth.md)
- User feature flows: [`frontend-user.md`](./frontend-user.md)
- Admin dashboards & management flows: [`frontend-admin.md`](./frontend-admin.md)
- Module index: [`index.md`](./index.md)

