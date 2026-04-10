# SSOT - referral
## Status: Implemented

**Domain:** admin  
**Module:** referral  
**Last Updated:** 2026-04-09

## 1) Purpose and boundaries
This file is the single source of truth for the **referral** module.

## 2) Implemented surface
### Routes
- /admin/referral
- /admin/referral/manage
- /admin/referral/add
- /admin/referral/[id]

### API dependencies
- /api/send-whatsapp
- /api/admin/session/validate

### Core implementation surface
- app/admin/**
- components/layout/nav.config.js
- components/layout/Sidebar.js

## 3) Data and collection contract
- COLLECTIONS from lib/config/publicEnv.js
- module-specific firestore docs as implemented

## 4) Business rules and validation behavior
- Admin nav-aligned module contract.

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
