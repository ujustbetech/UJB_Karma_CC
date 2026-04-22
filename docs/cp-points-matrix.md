# CP Points Matrix

Last updated: 2026-04-21

This document maps where Contribution Points (CP) are awarded in the project, including:

- who receives the points
- what triggers the award
- how many points are awarded
- whether the logic is actively wired or only defined in code

## Important Finding

- I did **not** find any automatic CP award flow that currently grants points directly to:
  - CosmOrbiter
  - Orbiter Mentor
  - Cosmo Mentor
- All automatic CP flows found in the code write to a single `CPBoard/{ujbCode}` member record.
- In most active workflows, that recipient resolves to the orbiter / mentor-orbiter / linked member found from the workflow data.
- There is also a **manual admin CP assignment** path that can assign points to any selected member.

## Automatic CP Awards

| Trigger | Recipient Role | Actual Recipient Resolution | Points | Activity No | Activity Name | Category | Status | Source |
|---|---|---|---:|---|---|---|---|---|
| Admin creates referral with `Self` type | Orbiter | Selected orbiter in referral add flow | 100 | `DIP_SELF` | Referral Identification by Self (DIP Status) | `R` | Active | `app/admin/referral/add/page.js` |
| Admin creates referral with `Others` type | Orbiter | Selected orbiter in referral add flow | 75 | `DIP_THIRD` | Referral passed for Third Party (DIP Status) | `R` | Active | `app/admin/referral/add/page.js` |
| Admin creates first referral and `ReferralPassed === "No"` | Orbiter | Selected orbiter in referral add flow | 125 | `DIP_FIRST` | First Referral Bonus | `R` | Active | `app/admin/referral/add/page.js` |
| User submits prospect assessment form | Linked member / mentor-orbiter | Looked up by `mentorPhone` in prospect submit API | 100 | `002` | Prospect Assessment (Tool) | `R` | Active | `app/api/prospects/[id]/route.js` |
| Admin sets `Authentic Choice` to `Choose to enroll` | Linked member / mentor-orbiter | Looked up by `orbiterContact` in admin prospects API | 100 | `011` | Initiating Enrollment (Tool) | `R` | Active | `app/api/admin/prospects/route.js` |
| Admin sends Terms Knowledge Transfer morning episode | Linked member / mentor-orbiter | Looked up by prospect-linked contact in the component flow | 75 | `016` | Completion of OTC Journey till Day 5 | `R` | Active | `components/admin/prospect/KnowledgeSharing4.js` |
| Admin sends Referrals Knowledge episode | Linked member / mentor-orbiter | Looked up by prospect-linked contact in the component flow | 75 | `017` | Completion of OTC Journey till Day 10 | `R` | Active | `components/admin/prospect/KnowledgeSeries10.js` |

## CP Helpers Defined But Not Clearly Triggered

These helpers exist in the code, but in the current checked flow they do not appear to be actively called from the latest save/send path.

| Intended Trigger | Recipient Role | Points | Activity No | Activity Name | Category | Status | Source |
|---|---|---:|---|---|---|---|---|
| Meeting scheduled | Orbiter / MentOrbiter | 25 | `003` | Prospect Invitation to Doorstep | `R` | Defined, not clearly wired | `components/admin/prospect/FollowUps.js` |
| Meeting done (online) | Orbiter / MentOrbiter | 25 | `004` | Ensuring Attendance for Doorstep (Online) | `R` | Defined, not clearly wired | `components/admin/prospect/FollowUps.js` |
| Meeting done (offline) | Orbiter / MentOrbiter | 25 | `005` | Ensuring Attendance for Doorstep (Offline) | `R` | Defined, not clearly wired | `components/admin/prospect/FollowUps.js` |
| Assessment mail sent | Orbiter / MentOrbiter | 75 | `018` | Completion of OTC Journey till Day 15 | `R` | Defined, not clearly wired | `components/admin/prospect/AssesmentMail.js` |

## Manual CP Assignment

This is the one path that can assign CP to any selected member, regardless of whether they are an orbiter, cosmorbiter, or another valid member in `usersdetail`.

| Trigger | Recipient Role | Recipient Resolution | Points | Source |
|---|---|---|---:|---|
| Admin uses `Add CP Activity` page | Any selected member | Search member by name -> assign selected CP activity | From selected activity definition | `app/admin/contribution-points/add/page.js`, `services/contributionPointService.js` |

## Role Coverage Summary

| Role | Automatic CP Found? | Notes |
|---|---|---|
| Orbiter | Yes | Strongest coverage; referral module definitely awards here |
| MentOrbiter / linked member from orbiter contact | Yes | Prospect journey awards often resolve here |
| CosmOrbiter | No automatic award found | Can still receive CP manually via admin CP assignment |
| Orbiter Mentor | No automatic award found | No separate automatic award logic found |
| Cosmo Mentor | No automatic award found | No separate automatic award logic found |

## Source Notes

### Referral CP Sources

- `app/admin/referral/add/page.js`
  - `addCpForSelfReferral()`
  - `addCpForThirdPartyReferral()`
  - `addCpForFirstReferral()`

### Prospect Journey CP Sources

- `app/api/prospects/[id]/route.js`
  - `addCpForProspectAssessment()`
- `app/api/admin/prospects/route.js`
  - `addCpForEnrollmentByAdmin()`
- `components/admin/prospect/KnowledgeSharing4.js`
  - `addCpForKnowledgeSeriesMorning()`
- `components/admin/prospect/KnowledgeSeries10.js`
  - `addCpForKnowledgeSeries10()`

### Defined But Unclear / Partially Wired

- `components/admin/prospect/FollowUps.js`
  - `addCpForMeetingScheduled()`
  - `addCpForMeetingDone()`
- `components/admin/prospect/AssesmentMail.js`
  - `addCpForAssessment()`

## Recommendation

If the business rule is that CP should also go to:

- CosmOrbiter
- Orbiter Mentor
- Cosmo Mentor

then the current codebase needs explicit additional award logic, because that distribution is **not** happening automatically in the present implementation.
