# SSOT - login
## Status: Implemented

**Domain:** auth  
**Module:** login  
**Last Updated:** 2026-04-09

## 1) Purpose and boundaries
This file is the single source of truth for the **login** module.

## 2) Implemented surface
### Routes
- /login

### API dependencies
- /api/send-otp
- /api/verify-otp
- /api/admin/session/login

### Core implementation surface
- app/(auth)/login/page.js
- context/authContext.js
- hooks/useAdminSession.js

## 3) Data and collection contract
- user_sessions, otp_verifications, security_logs, login_history

## 4) Business rules and validation behavior
- Auth/session lifecycle and redirects.

## 5) Error and failure modes
- Unauthorized/invalid session handling must follow auth/session contracts.
- Invalid route params or missing records must return explicit not-found UI/API behavior.

## 6) Cross-module dependency contract (Section 12 style)
### 12A) Depends on
- auth/session modules for access control.
- shared collections and module data contracts.

### 12B) Controlled by
- role checks and session validity.

### 12C) Emits
- Module-specific firestore/api mutations and UI state transitions.

### 12D) Listens
- Upstream data changes from linked modules.

### 12E) Reverse impact
- Any route/API contract change here can affect linked admin/user/api modules.

## 7) Verification checklist
- Open listed routes and verify happy/error states.
- Verify linked APIs return expected success/error payload shapes.
- Verify auth guard behavior for protected routes.

## 8) Frontend contract notes (05C-style, concise)
- Route map and key states: loading, empty, error, success.
- Form-bearing pages require field validation and clear user feedback.
- Accessibility baseline: keyboard navigation, visible focus, readable error states.

## 9) Assumptions, ambiguity log, and planned gaps
- This doc reflects current as-built implementation.
- Planned modules require route + API implementation before status can switch to Implemented.
