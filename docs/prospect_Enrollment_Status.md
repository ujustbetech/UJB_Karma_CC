# Prospect Enrollment Status Updates (Training Notes)

## Where this is used

The admin screen `**Enrollment Status -> Enrollment Status Updates**` shows a table of enrollment journey stages for a specific prospect. Each row represents a stage, and admin can:

- Tick `Check` (stage is being tracked/used)
- Select a `Date`
- Choose a `Status` from the dropdown for that stage
- Click `Send` to notify the prospect (email + WhatsApp template)
- Click `Save` to persist the stage timeline

Persistence target:

- Updates `Prospects/{id}.enrollmentStages` with the selected rows.

## Stage-by-stage logic (Status + Action)

### 1) Enrollment Initiation

**Row label:** `Enrollment Initiation`  
**Dropdown statuses:**

- `Not Started`
- `In Progress`
- `Completed`

**Send action**

- Clicking `Send` for this row does not use a dedicated template in the email-switch logic for label `"Enrollment Initiation"`.
- It falls back to a generic message: `Update regarding: Enrollment Initiation on {date}. Status: {status}`.

**Save action (important trigger)**

- When `Save` is clicked and this stage status is `Completed`, the system awards CP:
  - Adds CP activity: `011` (Initiating Enrollment (Tool))
  - Points: `100`
  - Category: `R`
  - Recipient: the MentOrbiter found via `prospect.orbiterContact` in `userDetail`.

### 2) Enrollment documents mail

**Row label:** `Enrollment documents mail`  
**Dropdown statuses:**

- `Sent`
- `Pending`
- `Need Revision`

**Send action**

- `Sent`: Sends a document request email and asks the prospect to reply with approval + required documents (KYC docs list).
- `Pending`: Sends a reminder that documents are still not completed; asks to connect with MentOrbiter/support.
- `Need Revision`: Sends a message that documents need revision and asks to connect with MentOrbiter/support.

**Save action**

- No CP awarding is directly tied to this stage’s statuses.

### 3) Enrollment Fees Mail Status

**Row label:** `Enrollment Fees Mail Status`  
**Dropdown statuses:**

- `Sent`
- `Follow-up Required`

**Send action**

- `Sent`: Sends the fee details (one-time enrollment fee) and asks the prospect to confirm a payment option by replying.
- `Follow-up Required`: Sends a follow-up reminder if the prospect hasn’t confirmed yet.

**Save action**

- No CP awarding is directly tied to this stage’s statuses.

### 4) Enrollment fees Option Opted for

**Row label:** `Enrollment fees Option Opted for`  
**Dropdown statuses:**

- `Upfront`
- `Adjustment`
- `No Response Adjustment`
- `Upfront Enrollment fees Confirmation`  (intended as “payment confirmed”)

**Send action**

- `Upfront`: Sends instructions to complete payment and submit payment screenshot within 2 working days.
- `Adjustment`: Confirms adjustment from referral reciprocation and states the orbiter journey begins.
- `No Response Adjustment`: Treats missing payment screenshot as no response; applies default adjustment.
- `Upfront Enrollment fees Confirmation`: Intended to confirm payment received, but note:
  - The template switch in code checks for a case named `Confirmation recieved` (spelling differs).
  - If the dropdown value is exactly `Upfront Enrollment fees Confirmation`, it may not match that template and could fall back to the generic default message.

**Save action (important trigger)**

- When `Save` is clicked, if this stage status `includes("Upfront")`, CP is awarded:
  - Adds CP activity: `013` (One-time Enrollment Fees (Upfront))
  - Points: `150`
  - Category: `W`
  - Recipient: MentOrbiter found via `prospect.orbiterContact`.

### 5) Enrollments Completion Status

**Row label:** `Enrollments Completion Status`  
**Dropdown statuses:**

- `Completed`
- `Pending`
- `Withdrawn`

**Send action**

- `Completed`: Sends the main “Welcome to the Universe” style email with journey path overview.
- `Pending`: No dedicated template; falls back to generic `Update regarding... Status: Pending`.
- `Withdrawn`: Sends withdrawal confirmation message.

**Save action (important trigger)**

- When `Save` is clicked and this stage status is `Completed`, CP is awarded:
  - Adds CP activity: `015` (Enrollment Completion)
  - Points: `50`
  - Category: `R`
  - Recipient: MentOrbiter found via `prospect.orbiterContact`.

## Recommended admin workflow (practical)

1. Set `Enrollment Initiation` to `Completed` when initiation is confirmed, then `Save` (to award CP 011).
2. For KYC/documents: set `Enrollment documents mail` to `Sent` and click `Send`, then later update to `Pending` or `Need Revision` and `Send` again if required.
3. For fees: set `Enrollment Fees Mail Status` to `Sent` and `Send` (then follow-up if needed).
4. After prospect responds: set `Enrollment fees Option Opted for` to `Upfront` or `Adjustment` (and use `No Response Adjustment` if applicable), then click `Send`.
5. When everything is closed: set `Enrollments Completion Status` to `Completed`, `Send` the completion email, then `Save` (to award CP 015).

