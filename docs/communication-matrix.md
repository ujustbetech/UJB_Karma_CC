# Communication Matrix

Last updated: 2026-04-21

This document lists outbound project communications that go through:

- Email
- WhatsApp

It focuses on actual send paths and their triggers. Simple contact links like `wa.me/...` are listed separately at the end.

## Core Send Infrastructure

| Channel | Mechanism | Source |
|---|---|---|
| WhatsApp | Client helper -> `POST /api/send-whatsapp` -> Meta Graph API | `utils/whatsappClient.js`, `app/api/send-whatsapp/route.js`, `lib/server/whatsapp.js` |
| WhatsApp OTP | Dedicated route | `app/api/send-otp/route.js` |
| WhatsApp Birthday | Dedicated route | `app/api/send-birthday/route.js` |
| Email | Client-side EmailJS (`@emailjs/browser`) | Multiple admin prospect components |

## Communication Matrix

| Module / Screen | Channel | Trigger | Recipient(s) | Template / Message Type | File |
|---|---|---|---|---|---|
| Login OTP | WhatsApp | When OTP is requested | Login mobile number | Meta template `code` | `app/api/send-otp/route.js` |
| Birthday Admin | WhatsApp | Admin sends birthday wishes | Birthday user, then mentor if found | Meta template `daily_reminder` | `app/api/send-birthday/route.js` |
| Admin Prospect Add | Email | After prospect is created successfully | Selected orbiter email | EmailJS `service_acyimrs` + `template_cdm3n5x` | `app/admin/prospect/add/page.js` |
| Admin Prospect Add | WhatsApp | After prospect is created successfully | Prospect phone | Template `mentorbiter_assesment_form` | `app/admin/prospect/add/page.js` |
| Prospect Edit: Meeting Logs | Email | Schedule / reschedule / done actions | Prospect, and sometimes orbiter/NT | EmailJS generic body | `components/admin/prospect/FollowUps.js` |
| Prospect Edit: Meeting Logs | WhatsApp | Schedule / reschedule / done actions | Prospect, and sometimes orbiter/NT | Template-based meeting message | `components/admin/prospect/FollowUps.js` |
| Prospect Edit: Pre Enrollment Form | Email | Save / update | Prospect | EmailJS with feedback form link | `components/admin/prospect/AdditionalInfo.js` |
| Prospect Edit: Pre Enrollment Form | WhatsApp | Save / update | Prospect phone | Template `enrollment_journey` | `components/admin/prospect/AdditionalInfo.js` |
| Prospect Edit: Authentic Choice | Email | Status action confirmation | Prospect | Status-specific email body | `components/admin/prospect/Assesment.js` |
| Prospect Edit: Authentic Choice | WhatsApp | Status action confirmation | Prospect phone | Template `enrollment_journey` with status-specific body | `components/admin/prospect/Assesment.js` |
| Prospect Edit: Enrollment Status | Email | Row `Send` button | Prospect | Enrollment stage update email | `components/admin/prospect/EnrollmentStage.js` |
| Prospect Edit: Enrollment Status | WhatsApp | Row `Send` button | Prospect phone | Template `enrollment_journey` | `components/admin/prospect/EnrollmentStage.js` |
| Prospect Edit: Introduction to UJustBe | Email | Schedule / reschedule / done actions | Prospect, and sometimes NT/orbiter | Meeting-style email | `components/admin/prospect/EngagementActivity.js` |
| Prospect Edit: Introduction to UJustBe | WhatsApp | Schedule / reschedule / done actions | Prospect, and sometimes NT/orbiter | Template-based meeting message | `components/admin/prospect/EngagementActivity.js` |
| Prospect Edit: Terms Knowledge Transfer | Email | `Send Morning Episode` / `Send Evening Episode` | Prospect | Knowledge-transfer email | `components/admin/prospect/KnowledgeSharing4.js` |
| Prospect Edit: Terms Knowledge Transfer | WhatsApp | `Send Morning Episode` / `Send Evening Episode` | Prospect phone | Plain WhatsApp text | `components/admin/prospect/KnowledgeSharing4.js` |
| Prospect Edit: Knowledge Series | Email | `Send Morning Episode` / `Send Evening Episode` | Prospect | Knowledge-series email | `components/admin/prospect/KnowledgeSharing5.js` |
| Prospect Edit: Knowledge Series | WhatsApp | `Send Morning Episode` / `Send Evening Episode` | Prospect phone | Plain WhatsApp text | `components/admin/prospect/KnowledgeSharing5.js` |
| Prospect Edit: Mail for NT | Email | `Send NT Intro` | Prospect | NT intro email | `components/admin/prospect/NTIntro.js` |
| Prospect Edit: Mail for NT | WhatsApp | `Send NT Intro` | Prospect phone | Plain WhatsApp text | `components/admin/prospect/NTIntro.js` |
| Prospect Edit: Briefing on NT | Email | Schedule / reschedule / done actions | Prospect, and sometimes NT/orbiter | Meeting-style email | `components/admin/prospect/NTBriefCall.js` |
| Prospect Edit: Briefing on NT | WhatsApp | Schedule / reschedule / done actions | Prospect, and sometimes NT/orbiter | Template-based meeting message | `components/admin/prospect/NTBriefCall.js` |
| Prospect Edit: NT Introduction | Email | `Send Knowledge Series 9` | Prospect | Series email | `components/admin/prospect/KnowledgeSeries9.js` |
| Prospect Edit: NT Introduction | WhatsApp | `Send Knowledge Series 9` | Prospect phone | Plain WhatsApp text | `components/admin/prospect/KnowledgeSeries9.js` |
| Prospect Edit: Referrals Knowledge | Email | Morning / evening send actions | Prospect | Series email | `components/admin/prospect/KnowledgeSeries10.js` |
| Prospect Edit: Referrals Knowledge | WhatsApp | Morning / evening send actions | Prospect phone | Plain WhatsApp text | `components/admin/prospect/KnowledgeSeries10.js` |
| Prospect Edit: Monthly Meeting Knowledge | Email | `Send Assessment Mail` | Prospect | Assessment email | `components/admin/prospect/AssesmentMail.js` |
| Prospect Edit: Monthly Meeting Knowledge | WhatsApp | `Send Assessment Mail` | Prospect phone | Plain WhatsApp text | `components/admin/prospect/AssesmentMail.js` |
| Prospect Edit: As Lived Part 1 | Email | `Send Case Study` | Prospect | Case-study email | `components/admin/prospect/CaseStudy1.js` |
| Prospect Edit: As Lived Part 1 | WhatsApp | `Send Case Study` | Prospect phone | Plain WhatsApp text | `components/admin/prospect/CaseStudy1.js` |
| Prospect Edit: As Lived Part 2 | Email | `Send Case Study 2` | Prospect | Case-study email | `components/admin/prospect/CaseStudy2.js` |
| Prospect Edit: As Lived Part 2 | WhatsApp | `Send Case Study 2` | Prospect phone | Plain WhatsApp text | `components/admin/prospect/CaseStudy2.js` |
| Prospect Edit: Assessment Completion | Email | Save Day 16 assessment status | Prospect | Day 16 assessment result email | `components/admin/prospect/AssesmentBtn.js` |
| Prospect Edit: Assessment Completion | WhatsApp | Save Day 16 assessment status | Prospect phone | Plain WhatsApp text | `components/admin/prospect/AssesmentBtn.js` |
| Admin Referral Add | WhatsApp | After referral is created successfully | Orbiter + CosmoOrbiter | Template `referral_module` | `app/admin/referral/add/page.js` |
| Admin Referral Payout | WhatsApp | After payout is processed | Payout recipient if phone exists | Legacy direct Meta Graph template `referral_module` | `app/admin/referral/[id]/page.js` |
| User Referrals | WhatsApp | Referral deal status change | Orbiter + CosmoOrbiter | Dynamic status message via template `referral_module` | `app/(user)/user/referrals/page.js` |
| Referral Overview Tab | WhatsApp | Referral status confirmation/change | Orbiter + CosmoOrbiter | Dynamic status message via `/api/send-whatsapp` | `components/referrals/tabs/OverviewTab.js` |
| Monthly Meeting Add User | WhatsApp | User registered to event | Registered user phone | Template `register_mm` with event link | `components/admin/monthlymeeting/sections/AddUserSection.js` |

## Special Notes

### Prospect Journey

The prospect journey is the largest communication surface in the project.

Related companion doc:

- `docs/prospect-tab-email-matrix.md`

That document is email-focused. This matrix includes both email and WhatsApp.

### WhatsApp Patterns

There are two WhatsApp patterns in the codebase:

1. Preferred path:
   - client helper -> `/api/send-whatsapp` -> `lib/server/whatsapp.js`
2. Legacy direct path:
   - direct Meta Graph `fetch(...)` from client code

Known legacy direct sender:

- `app/admin/referral/[id]/page.js`

### Email Pattern

Most email sends use the same EmailJS setup:

- service: `service_acyimrs`
- template: `template_cdm3n5x`

### Paths That Are Not Actual Sends

These are communication-related, but they do **not** send a message programmatically:

| Feature | Type | File |
|---|---|---|
| CosmOrbiter detail page | `wa.me` contact link | `app/(user)/user/cosmorbiters/[id]/page.js` |
| Business header | `wa.me` contact link | `components/cosmorbiters/BusinessHeader.js` |
| Monthly meeting registered users | Opens `wa.me` | `components/admin/monthlymeeting/sections/RegisteredUsersSection.js` |
| Conclave invited users | Marks invitation as `sent`, but does not actually send | `components/admin/monthlymeeting/sections/ConclaveSection.js` |

## Recommended Cleanup

- Move all remaining legacy direct WhatsApp sends to `/api/send-whatsapp`
- Move EmailJS sends behind server-side route handlers for consistency and security
- Standardize message logging so every communication records:
  - channel
  - trigger
  - recipient
  - template/body type
  - sent timestamp
  - success/failure
