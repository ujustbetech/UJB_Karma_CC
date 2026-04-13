# Prospect Edit Tab Email Matrix

Last updated: 2026-04-10

This document maps `/admin/prospect/edit/:id` tabs to email behavior in the current codebase.

## Journey Start (Add Prospect)

Before the edit tabs, the first email in this flow is sent from:

- Route: `/admin/prospect/add`
- Action: `Register Prospect` button
- Email count: `1`
- Recipient: selected MentOrbiter email (`orbiterEmail`)
- Trigger condition: after prospect document is created successfully in `Prospects`
- Component/file: `app/admin/prospect/add/page.js`

So the journey begins with **1 email from Add Prospect**, then the tab-based sends happen inside `/admin/prospect/edit/:id`.

## Onboarding Scope (first 7 tabs)

| # | Tab | Emails sent | When it sends | Recipient(s) |
|---|---|---:|---|---|
| 1 | Prospect Details | 0 | No email logic | — |
| 2 | Assesment Form | 0 | No email logic | — |
| 3 | Meeting Logs | 1 on schedule/reschedule, up to 2 on done | `Schedule/Reschedule` click sends meeting mail; `Done` click sends thank-you mails | Prospect (schedule/reschedule), Prospect + Orbiter (done, if emails available) |
| 4 | Pre Enrollment Form | 1 | `Save`/`Update` click | Prospect |
| 5 | Feedback Form | 0 | No email logic | — |
| 6 | Authentic Choice | 1 | Any status action click (`Choose to enroll`, `Declined`, `Need some time`, `Awaiting response`) | Prospect |
| 7 | Enrollment Status | 1 per row action | `Send` click in a stage row | Prospect |

## Full Tab-by-Tab Matrix

| # | Tab | Component | Emails sent | Trigger |
|---|---|---|---:|---|
| 1 | Prospect Details | `EditProspectForm` | 0 | No email logic |
| 2 | Assesment Form | `ProspectDetails` | 0 | No email logic |
| 3 | Meeting Logs | `FollowUps` | 1 or up to 2 extra | `Schedule/Reschedule` sends 1 (prospect), `Done` sends up to 2 (prospect + orbiter) |
| 4 | Pre Enrollment Form | `AdditionalInfo` | 1 | `Save`/`Update` |
| 5 | Feedback Form | `ProspectFeedback` | 0 | No email logic |
| 6 | Authentic Choice | `Assesment` | 1 | Status action confirmation |
| 7 | Enrollment Status | `EnrollmentStage` | 1 per row send | Row `Send` button |
| 8 | Engagement Logs | `Engagementform` | 0 | No email logic |
| 9 | Introduction to UJustBe | `EngagementActivity` | 1 or up to 2 extra | `Schedule/Reschedule` sends 1 (prospect), `Done` sends up to 2 (prospect + orbiter) |
| 10 | Terms Knowledge Transfer | `KnowledgeSharing4` | 1 per tab send | `Send Morning Episode` / `Send Evening Episode` |
| 11 | Knowledge Series | `KnowledgeSharing5` | 1 per tab send | `Send Morning Episode` / `Send Evening Episode` |
| 12 | Mail for NT | `NTIntro` | 1 | `Send NT Intro` |
| 13 | Briefing on NT | `NTBriefCall` | 1 or up to 2 extra | `Schedule/Reschedule` sends 1 (prospect), `Done` sends up to 2 (prospect + orbiter) |
| 14 | NT Introduction | `KnowledgeSeries9` | 1 | `Send Knowledge Series 9` |
| 15 | Referrals Knowledge | `KnowledgeSeries10` | 1 per tab send | `Send Morning Episode` / `Send Evening Episode` |
| 16 | Monthly Meeting Knowledge | `AssesmentMail` | 1 | `Send Assessment Mail` |
| 17 | As Lived Part 1 | `CaseStudy1` | 1 | `Send Case Study` |
| 18 | As Lived Part 2 | `CaseStudy2` | 1 | `Send Case Study 2` |
| 19 | Review Session | `AssesmentCall` | 0 | No email logic |
| 20 | Assesment Completion | `AssesmentBtn` | 1 | Status action confirmation |
| 21 | Social Participation | `SocialParticipation` | 0 | No email logic |
| 22 | Referral Participation | `ReferralParticipation` | 0 | No email logic |
| 23 | Happy Face | `HappyFace` | 0 | No email logic |
| 24 | Vision Allignment | `VisionAllignment` | 0 | No email logic |
| 25 | Integrity Referral | `IntegrityReferral` | 0 | No email logic |
| 26 | CosmOrbiter Impact | `CosmOrbiterImpact` | 0 | No email logic |
| 27 | Event | `Events` | 0 | No email logic |
| 28 | Feedback | `FinalFeedback` | 0 | No email logic |

## Stage-Level Detail for Enrollment Status Tab

In `EnrollmentStage`, each row has an explicit `Send` button that sends one email for that row status:

- Enrollment Initiation
- Enrollment documents mail
- Enrollment Fees Mail Status
- Enrollment fees Option Opted for
- Enrollments Completion Status

## Notes

- Most sender implementations also send WhatsApp in the same action path, but this document counts only email sends.
- Actual email send success can still depend on recipient email presence and EmailJS/API success.
