## Suggested Improvements

### 1. Unify Authentication and Authorization

- Move admin authentication away from client-only `sessionStorage` checks and enforce it server-side, similar to the user cookie/JWT flow.
- Standardize logout endpoints so frontend code and API routes use the same contract.
- Keep one clear auth model per audience:
  - user auth: OTP + secure session cookie
  - admin auth: OAuth + server-validated session/role

Why this matters:
- The current admin protection is weaker than the user flow.
- Auth mismatches make debugging and access control harder.

### 2. Centralize Sensitive Integrations on the Server

- Move all WhatsApp and other third-party token-based calls into `app/api/**` route handlers or server utilities.
- Remove any hardcoded bearer tokens or direct Meta Graph calls from client pages.
- Keep OpenAI, WhatsApp, and similar integrations behind server-only wrappers.

Why this matters:
- Client-side secrets are a major security risk.
- A single server integration layer is easier to rotate, monitor, and test.

### 3. Consolidate Firebase Setup

- Merge the duplicated Firebase client setup in `firebaseConfig.js` and `lib/firebase/firebaseClient.js`.
- Define one browser Firebase entry point and one admin/server Firebase entry point.
- Update imports so all modules consume the same shared initialization.

Why this matters:
- Duplicate initialization patterns create drift and inconsistent behavior.
- A single source of truth makes auth, Firestore, and storage access easier to maintain.

### 4. Strengthen Architectural Layering

- Reduce business logic inside route pages and move it into `services`, `hooks`, or domain helpers.
- Keep route files focused on orchestration and rendering.
- Expand the existing pattern used by the referral flow into other modules such as prospects, meetings, birthdays, and content management.

Why this matters:
- Many pages currently mix UI, Firestore queries, and workflow rules.
- Better separation improves reuse, testing, and onboarding.

### 5. Normalize Firestore Access Patterns

- Use `lib/utility_collection.js` consistently instead of mixing env-backed constants with hardcoded collection strings.
- Standardize document shapes, field names, and collection naming conventions.
- Introduce repository/helper functions for common Firestore reads and writes.

Why this matters:
- The app currently mixes direct collection strings and shared constants.
- Inconsistent data access increases regression risk when schemas evolve.

### 6. Fix Broken or Inconsistent Shared Utilities

- Review shared hooks and utilities for bad imports, legacy paths, and outdated assumptions.
- Example: `hooks/useUsers.js` appears to have inconsistent import paths and should be corrected or removed if unused.
- Remove unused abstractions and keep only the shared code that is actively maintained.

Why this matters:
- Broken shared utilities erode trust in the shared layer.
- Teams start duplicating logic when common helpers feel unreliable.

### 7. Improve Route Protection Strategy

- Keep middleware and layout guards aligned so route protection is not duplicated inconsistently.
- Use middleware for coarse protection and server/session validation for trusted enforcement.
- Add role-aware protection for admin routes.

Why this matters:
- The user area has both middleware and client checks, while admin relies on client checks only.
- A consistent strategy reduces edge cases and unauthorized UI exposure.

### 8. Introduce Stronger Configuration and Environment Validation

- Validate required environment variables at startup for Firebase, JWT, WhatsApp, OpenAI, and collection mappings.
- Fail fast when critical config is missing or malformed.
- Document required env vars in the docs folder.

Why this matters:
- This project depends heavily on env configuration, including collection names.
- Missing config can cause subtle runtime failures that are hard to trace.

### 9. Add Testing Around Critical Flows

- Add at least lightweight automated coverage for:
  - OTP login and session validation
  - logout and logout-all
  - referral creation
  - agreement acceptance flow
  - admin-only access boundaries
- Prioritize integration tests for API routes and high-value Firestore workflows.

Why this matters:
- The system contains important stateful flows with auth, sessions, and side effects.
- These are the most expensive areas to break silently.

### 10. Clean Up Legacy and Duplicate Files

- Remove obvious duplicate or backup files such as `page copy.js`, `copy` component folders, and stale variants after confirming they are unused.
- Keep only production paths in the source tree.
- Archive experiments in a separate branch or docs note instead of leaving them in active folders.

Why this matters:
- Duplicate files make the codebase harder to navigate and increase the chance of editing the wrong source.
- Cleanup will improve maintainability immediately.

### 11. Formalize Module Ownership and Documentation

- Extend the existing `docs/modules` documentation so each major module includes:
  - entry points
  - data sources
  - write paths
  - security constraints
  - known risks
- Keep the docs updated whenever major route or schema changes are introduced.

Why this matters:
- The project already has a strong start on module docs.
- Keeping those docs current will make future refactors much safer.

### 12. Prioritized Implementation Order

- Phase 1:
  - remove client-side secrets
  - fix auth/logout mismatches
  - unify Firebase setup
- Phase 2:
  - normalize Firestore access
  - move business logic into services/hooks
  - repair shared utilities
- Phase 3:
  - add tests
  - clean duplicate files
  - deepen architecture docs
