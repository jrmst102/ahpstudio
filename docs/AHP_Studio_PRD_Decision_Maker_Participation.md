# AHP Studio — Product Requirements Document

## Feature: Decision-Maker Participation via Shareable Links

**Document Version:** 2.0  
**Date:** March 8, 2026  
**Author:** Dr. Jose Mendoza  
**Target Release:** v1.1.5  
**Status:** Draft

---

## 1. Executive Summary

This document specifies a new participation model for AHP Studio. Project admins will onboard decision-makers directly within a problem, then share unique, tokenized links that allow each decision-maker to complete pairwise comparisons without creating an account. The feature replaces the current respondent workflow with a frictionless, link-based approach — lowering the barrier to participation while preserving the rigor of the AHP method.

The release also introduces real-time status tracking for the admin dashboard, optional anonymous participation, group consensus measurement via Kendall's W, multi-round Delphi-style iteration to drive convergence, and optional PIN protection for participation links.

At the conclusion of a decision round, the admin generates a comprehensive Decision Report exported as a PDF, which they distribute to stakeholders through their own email system.

---

## 2. Goals and Non-Goals

### 2.1 Goals

- Enable project admins to onboard decision-makers with minimal friction (name and optional email only).
- Provide each decision-maker with a unique, stable URL that grants direct access to the comparison wizard — no account or login required.
- Optionally protect participation links with a 4-digit PIN for environments requiring additional access control.
- Allow decision-makers to complete, save, and later revise their pairwise comparisons via the same link.
- Assign equal default weights to all decision-makers, with admin ability to adjust weights at any time.
- Support optional anonymous participation mode where the admin cannot see which decision-maker submitted which response.
- Aggregate individual comparison matrices using the weighted geometric mean method.
- Compute and display inter-rater agreement metrics (Kendall's W) to assess group consistency across decision-makers.
- Support multi-round Delphi-style iteration, allowing the admin to share aggregated results between rounds to drive convergence.
- Provide real-time status updates on the admin dashboard as participants complete comparisons, using WebSocket connections.
- Generate a printable PDF Decision Report that the admin can save and distribute externally.
- Give admins visibility into participation status (who has completed, who hasn't, who is in progress).

### 2.2 Non-Goals

- The application will **not** send emails or notifications. The admin shares links and PDFs through their own channels.
- The application will **not** require decision-makers to create accounts or authenticate with passwords.
- Real-time collaborative editing (multiple people working simultaneously on the same matrix) is out of scope.
- In-app chat or discussion among decision-makers is out of scope.

---

## 3. User Roles

| Role | Description |
|---|---|
| **Project Admin** | The authenticated user who created the AHP problem. Has full control: defines criteria, alternatives, onboards decision-makers, adjusts weights, configures anonymity and PIN settings, manages decision rounds, triggers computation, generates reports. |
| **Decision-Maker** | A participant invited by the admin. Accesses the system exclusively through a unique link (optionally PIN-protected). Can complete and revise pairwise comparisons for the problem they were invited to. Cannot see other decision-makers' inputs. |

---

## 4. Functional Requirements

### 4.1 Decision-Maker Onboarding

**FR-01:** The admin can add decision-makers to a problem from the problem's settings or a dedicated "Decision-Makers" panel.

**FR-02:** For each decision-maker, the admin provides:

- **Name** (required) — Display name used in reports and the admin dashboard. In anonymous mode (see FR-30), the admin sees names for management purposes but cannot associate them with submitted responses.
- **Email** (optional) — Stored for the admin's reference only; the system does not send emails.

**FR-03:** Upon adding a decision-maker, the system generates a unique participation token (UUID v4) and constructs a participation URL:

```
https://{APP_URL}/participate/{problemId}/{participantToken}
```

**FR-04:** The admin can view, copy, and re-copy the participation link at any time from the Decision-Makers panel.

**FR-05:** All newly added decision-makers receive a default weight of `1.0`. The admin can adjust individual weights at any time from the Decision-Makers panel.

**FR-06:** The admin can remove a decision-maker. This invalidates their token and deletes their comparison data after a confirmation prompt.

**FR-07:** The maximum number of decision-makers per problem is **12** (increased from the current 6-respondent limit to accommodate link-based ease of onboarding).

### 4.2 PIN Protection

**FR-08:** The admin can enable PIN protection at the problem level. When enabled, each decision-maker is assigned a unique 4-digit PIN at creation time.

**FR-09:** The admin can view and regenerate a participant's PIN from the Decision-Makers panel. PINs are displayed alongside the participation link so the admin can share both together.

**FR-10:** When PIN protection is enabled, the participation link presents a PIN entry screen before granting access to the wizard. Three consecutive incorrect attempts lock the link for 15 minutes.

**FR-11:** When PIN protection is disabled (the default), participation links grant immediate access without any PIN prompt.

### 4.3 Participation Link Behavior

**FR-12:** When a decision-maker opens their participation link (and passes PIN verification if enabled), they land on a **welcome screen** that displays:

- The problem title and description.
- Their name (as entered by the admin).
- A brief instruction on what they will be doing (pairwise comparisons).
- The current round number (if multi-round iteration is active).
- A "Begin" button to enter the comparison wizard.

**FR-13:** No login or account creation is required. The token in the URL (plus optional PIN) is the sole identifier.

**FR-14:** If the decision-maker has previously submitted comparisons, opening the link shows their existing responses pre-filled in the wizard, with an option to revise and resubmit.

**FR-15:** If the admin has **closed** the decision round (see FR-25), the link displays a friendly message: *"This decision round has been closed. Thank you for your participation."* No edits are possible.

**FR-16:** If the token is invalid or the problem has been deleted, the link displays: *"This link is no longer valid. Please contact the person who shared it with you."*

### 4.4 Comparison Wizard (Decision-Maker View)

**FR-17:** The decision-maker is presented with the existing wizard-style comparison interface: one pair at a time, with back/forward navigation, progress tracking, and the AHP 1–9 scale.

**FR-18:** The wizard covers all required comparisons:

- Criteria vs. criteria (main level).
- Sub-criteria vs. sub-criteria (within each criterion that has sub-criteria).
- Alternatives vs. alternatives (under each lowest-level criterion).

**FR-19:** The decision-maker can save progress at any point ("Save & Continue Later"). Their partial data is persisted, and they can resume from where they left off by reopening the same link.

**FR-20:** Upon completing all comparisons, the decision-maker clicks "Submit." The system stores their full set of comparison matrices and marks them as complete.

**FR-21:** After submission, the decision-maker sees a confirmation screen with:

- A summary of their completed comparisons.
- Their individual consistency ratios (CR) for each matrix.
- A warning if any CR exceeds 0.10, with an option to go back and revise.
- A message that the project admin will share results once the decision is finalized.

**FR-22:** Decision-makers **cannot** see other participants' names, inputs, or results. Each participant operates in isolation to prevent anchoring bias.

**FR-23:** In Delphi rounds 2 and beyond (see Section 4.8), the wizard displays the group's aggregated priorities from the previous round alongside the decision-maker's own prior responses, enabling informed revision.

### 4.5 Admin Dashboard — Participation Monitoring

**FR-24:** The Decision-Makers panel shows a status table:

| Column | Description |
|---|---|
| Name | Decision-maker's name (or anonymized label if anonymous mode is on — see FR-30) |
| Weight | Current weight (editable inline) |
| Status | `Not Started` · `In Progress` · `Completed` |
| Consistency | Overall CR (shown after completion) |
| Last Activity | Timestamp of last save or submission |
| Actions | Copy Link · Copy PIN (if enabled) · Edit · Remove |

**FR-25:** The admin can **close** a decision round. This:

- Prevents any further submissions or edits via participation links.
- Locks the comparison data for aggregation and report generation.
- Is reversible — the admin can reopen the round if needed.

**FR-26:** The admin can **reopen** a closed round, which reactivates all participation links.

### 4.6 Real-Time Status Updates

**FR-27:** The admin dashboard maintains a WebSocket connection to the server. When a decision-maker saves progress or submits comparisons, the admin's status table updates automatically without requiring a page refresh.

**FR-28:** Real-time events include:

- Participant status change (`Not Started` → `In Progress` → `Completed`).
- Last activity timestamp update.
- Consistency ratio availability (upon completion).
- A brief toast notification when a participant completes all comparisons (e.g., *"Alice Chen has submitted their comparisons."*).

**FR-29:** If the WebSocket connection drops, the dashboard falls back to periodic polling (every 30 seconds) and displays a subtle indicator that live updates are temporarily unavailable.

### 4.7 Anonymous Participation

**FR-30:** The admin can enable **anonymous mode** at the problem level before the first participant begins comparisons. Once any participant has started, this setting is locked and cannot be changed for the current round.

**FR-31:** When anonymous mode is enabled:

- The admin can still see the list of decision-makers' names for management purposes (sharing links, tracking who has and hasn't completed).
- Submitted comparison data and computed results are **dissociated** from participant identities. The admin sees results labeled as "Participant A," "Participant B," etc., with no way to map these labels back to names.
- The PDF report's appendix uses the same anonymized labels.

**FR-32:** When anonymous mode is disabled (the default), the admin sees full attribution of all results to named participants.

### 4.8 Multi-Round Delphi-Style Iteration

**FR-33:** The admin can configure a problem for **multi-round iteration**. Each round is a complete cycle of comparisons by all (or some) decision-makers, followed by aggregation and result review.

**FR-34:** After closing a round and reviewing aggregated results, the admin can initiate a **new round**. This:

- Increments the round counter (Round 1 → Round 2 → ...).
- Preserves each participant's previous-round comparisons as read-only history.
- Reopens participation links for the new round, allowing participants to revise their comparisons.
- Stores the previous round's aggregated priorities so they can be displayed to participants in the wizard (see FR-23).

**FR-35:** There is no hard limit on the number of rounds, but the system displays convergence indicators to help the admin decide when to stop:

- Round-over-round change in the aggregated priority vector (percentage shift).
- Kendall's W trend across rounds (see Section 4.9).
- Visual comparison of rankings across rounds (did rank order stabilize?).

**FR-36:** The admin can finalize the problem at any round, locking all data and enabling report generation. Finalization marks the problem as decided; no further rounds can be initiated.

**FR-37:** The Decision Report (see Section 4.10) includes a round-by-round summary when multiple rounds have been conducted.

### 4.9 Consensus Measurement

**FR-38:** After aggregation, the system computes **Kendall's coefficient of concordance (W)** across all completed decision-makers' priority vectors.

**FR-39:** Kendall's W is displayed on the Results screen with an interpretive label:

| W Range | Label |
|---|---|
| 0.00 – 0.20 | Very Low Agreement |
| 0.21 – 0.40 | Low Agreement |
| 0.41 – 0.60 | Moderate Agreement |
| 0.61 – 0.80 | High Agreement |
| 0.81 – 1.00 | Very High Agreement |

**FR-40:** Kendall's W is computed separately for:

- Main criteria rankings.
- Sub-criteria rankings (per criterion group).
- Alternative rankings (per criterion).
- Global alternative rankings.

**FR-41:** The associated chi-squared statistic and p-value are computed and displayed alongside W for statistical significance testing.

**FR-42:** In multi-round problems, Kendall's W is tracked across rounds and displayed as a trend line on the Results screen, enabling the admin to observe whether consensus is improving.

### 4.10 Decision Report (PDF)

**FR-43:** The admin can generate a Decision Report from the problem's results screen. The report is exported as a **PDF** file that downloads to the admin's computer.

**FR-44:** The Decision Report includes the following sections:

1. **Cover Page** — Problem title, date, admin name, round number (if multi-round), and report generation timestamp.
2. **Problem Definition** — Goal statement, description, and decision context.
3. **Decision Hierarchy** — Visual or textual representation of criteria, sub-criteria, and alternatives.
4. **Decision-Makers** — Table of participants with their names (or anonymized labels), weights, and individual consistency ratios.
5. **Consensus Analysis** — Kendall's W for each comparison group, with interpretive labels and statistical significance.
6. **Criteria Weights** — Aggregated pairwise comparison matrix and resulting priority vector for main criteria and each set of sub-criteria.
7. **Alternative Priorities** — Aggregated comparison matrices and local priorities under each criterion.
8. **Global Synthesis** — Final ranking of alternatives (normalized and idealized), with bar chart visualization.
9. **Sensitivity Analysis** — Summary of rank reversals detected when varying criterion weights.
10. **Decision Rationale** — Auto-generated narrative summarizing why the top-ranked alternative is preferred, referencing the criteria it scored highest on.
11. **Round History** (multi-round only) — Round-by-round priority vectors, Kendall's W trend, and convergence metrics.
12. **Appendix: Individual Results** — Per-decision-maker priority vectors and consistency ratios (optional — admin can toggle inclusion; uses anonymized labels if anonymous mode is on).

**FR-45:** The admin saves the PDF locally and distributes it to decision-makers and stakeholders via their own email system. The application does not handle email delivery.

---

## 5. Data Model Changes

### 5.1 Problem Schema Extension

The existing `.AHP` problem JSON is extended with a `participants` array, round management fields, and configuration flags:

```json
{
  "id": "problem-uuid",
  "title": "Select Best Vendor",
  "description": "...",
  "criteria": [ ... ],
  "alternatives": [ ... ],
  "config": {
    "anonymousMode": false,
    "pinProtection": false,
    "delphiEnabled": false
  },
  "currentRound": 1,
  "roundStatus": "open",
  "rounds": [
    {
      "roundNumber": 1,
      "status": "open",
      "openedAt": "2026-03-08T09:00:00Z",
      "closedAt": null,
      "aggregatedMatrices": { ... },
      "aggregatedPriorities": { ... },
      "kendallW": {
        "criteria": { "W": 0.72, "chiSquared": 14.4, "pValue": 0.006 },
        "subCriteria": { ... },
        "alternatives": { ... },
        "global": { "W": 0.68, "chiSquared": 13.6, "pValue": 0.009 }
      },
      "results": { ... }
    }
  ],
  "participants": [
    {
      "id": "participant-uuid",
      "name": "Alice Chen",
      "email": "alice@example.com",
      "token": "uuid-v4-token",
      "pin": "4821",
      "weight": 1.0,
      "anonymousLabel": "Participant A",
      "roundData": {
        "1": {
          "status": "completed",
          "comparisons": {
            "criteria": [[1, 3, 5], [0.33, 1, 2], [0.2, 0.5, 1]],
            "subCriteria": { ... },
            "alternatives": { ... }
          },
          "consistencyRatios": {
            "criteria": 0.03,
            "subCriteria": { ... },
            "alternatives": { ... }
          },
          "lastActivity": "2026-03-08T14:30:00Z",
          "completedAt": "2026-03-08T15:00:00Z"
        }
      }
    }
  ]
}
```

### 5.2 Storage Path

No changes to the storage pattern. Participant data lives within the problem file:

```
users/{userId}/problems/{problemId}.AHP
```

### 5.3 Token Index (Optional Optimization)

For fast token-to-problem resolution without loading every problem file, maintain an index:

```
data/participation-tokens.json
```

```json
{
  "token-abc-123": {
    "userId": "user-001",
    "problemId": "problem-042",
    "participantId": "participant-007"
  }
}
```

This enables O(1) lookup when a decision-maker opens their link, rather than searching across all problems.

---

## 6. API Changes

### 6.1 New Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/problems/:id/participants` | Admin (JWT) | List all decision-makers for a problem |
| `POST` | `/api/v1/problems/:id/participants` | Admin (JWT) | Add a decision-maker; returns generated link and PIN (if enabled) |
| `PUT` | `/api/v1/problems/:id/participants/:pid` | Admin (JWT) | Update name, email, or weight |
| `DELETE` | `/api/v1/problems/:id/participants/:pid` | Admin (JWT) | Remove a decision-maker and their data |
| `POST` | `/api/v1/problems/:id/participants/:pid/regenerate-pin` | Admin (JWT) | Generate a new 4-digit PIN for a participant |
| `PUT` | `/api/v1/problems/:id/config` | Admin (JWT) | Update problem configuration (anonymousMode, pinProtection, delphiEnabled) |
| `POST` | `/api/v1/problems/:id/round/close` | Admin (JWT) | Close the current decision round |
| `POST` | `/api/v1/problems/:id/round/reopen` | Admin (JWT) | Reopen a closed round |
| `POST` | `/api/v1/problems/:id/round/new` | Admin (JWT) | Initiate a new Delphi round (requires current round to be closed) |
| `POST` | `/api/v1/problems/:id/finalize` | Admin (JWT) | Finalize the problem; no further rounds allowed |
| `POST` | `/api/v1/participate/:problemId/:token/verify-pin` | None | Verify a 4-digit PIN; returns a short-lived session token on success |
| `GET` | `/api/v1/participate/:problemId/:token` | None (or PIN session) | Fetch problem structure and participant's existing comparisons |
| `PUT` | `/api/v1/participate/:problemId/:token` | None (or PIN session) | Save or submit comparisons |
| `GET` | `/api/v1/problems/:id/consensus` | Admin (JWT) | Compute and return Kendall's W and related statistics |
| `GET` | `/api/v1/problems/:id/rounds` | Admin (JWT) | List all rounds with summary metrics (W trend, convergence) |
| `POST` | `/api/v1/problems/:id/report` | Admin (JWT) | Generate and download PDF Decision Report |

### 6.2 Modified Endpoints

| Endpoint | Change |
|---|---|
| `POST /api/v1/compute/aggregate` | Accept `participantIds` filter and `roundNumber` parameter to aggregate a subset of decision-makers for a specific round |
| `POST /api/v1/compute/priorities` | Accept aggregated matrices produced from participant data |

### 6.3 WebSocket Events

The server exposes a WebSocket endpoint at `/ws/problems/:id/status` (requires admin JWT for the handshake).

| Event | Direction | Payload |
|---|---|---|
| `participant:statusChange` | Server → Client | `{ participantId, anonymousLabel?, oldStatus, newStatus, timestamp }` |
| `participant:activityUpdate` | Server → Client | `{ participantId, anonymousLabel?, lastActivity }` |
| `participant:completed` | Server → Client | `{ participantId, anonymousLabel?, name?, consistencyRatios }` — `name` is omitted if anonymous mode is on |
| `round:closed` | Server → Client | `{ roundNumber, closedAt }` |
| `round:opened` | Server → Client | `{ roundNumber, openedAt }` |

---

## 7. Security Considerations

### 7.1 Token Design

- Tokens are UUID v4 (122 bits of entropy) — computationally infeasible to guess.
- Tokens are scoped to a single problem and a single participant.
- Tokens do not expire automatically but can be invalidated by removing the participant or closing the round.

### 7.2 PIN Protection

- PINs are 4-digit numeric codes (0000–9999), generated randomly per participant.
- PINs are stored hashed (bcrypt, cost factor 10) in the problem file. The plaintext PIN is shown to the admin once at creation and on demand via the dashboard.
- Three consecutive incorrect PIN attempts lock the participation link for 15 minutes (keyed by token + IP).
- Successful PIN verification issues a short-lived session token (JWT, 4-hour expiry) stored in an httpOnly cookie, so the decision-maker does not need to re-enter the PIN during a single working session.

### 7.3 Access Control

- Participation endpoints (`/participate/...`) are **unauthenticated** — the token (plus optional PIN) is the credential.
- A valid token grants access **only** to the problem structure (criteria, alternatives) and that participant's own comparison data.
- Participants cannot access other participants' data, the admin's data, or any other problem.
- Admin endpoints remain protected by JWT authentication.
- WebSocket connections require a valid admin JWT during the handshake.

### 7.4 Anonymous Mode Security

- When anonymous mode is enabled, the server enforces identity dissociation at the API level. The admin-facing endpoints for results and reports return anonymized labels only — the mapping between labels and participant IDs is not stored or computable.
- Anonymous labels are assigned in random order (not by creation order) to prevent the admin from inferring identity through sequence.

### 7.5 Rate Limiting

- Participation endpoints should be rate-limited (e.g., 60 requests/minute per IP) to prevent brute-force token enumeration.
- PIN verification endpoints are rate-limited more aggressively (5 attempts per 15 minutes per token).
- Invalid token attempts should return a generic 404 (not 401/403) to avoid confirming whether a problem exists.

### 7.6 Data Privacy

- Participant email addresses are stored for admin reference only and are never exposed through participation endpoints.
- The PDF report's appendix (individual results) is opt-in — the admin decides whether to include per-participant detail.
- In anonymous mode, even the appendix uses anonymized labels.

---

## 8. UI/UX Specifications

### 8.1 Admin: Decision-Makers Panel

Located within the problem editor, as a tab or collapsible section alongside Criteria, Alternatives, and Results.

**Problem Configuration (top of panel):**

- **Anonymous Mode** toggle — enabled/disabled; locked once any participant begins.
- **PIN Protection** toggle — enabled/disabled; can be changed at any time (existing PINs remain valid; new PINs are generated for new participants).
- **Delphi Iteration** toggle — enabled/disabled; when enabled, round controls appear.

**Add Decision-Maker Flow:**

1. Admin clicks "Add Decision-Maker."
2. A form appears with fields: Name (required), Email (optional).
3. On save, the system generates the token (and PIN if enabled) and displays the participation link with "Copy Link" and "Copy PIN" buttons.
4. The new decision-maker appears in the status table with status "Not Started" and weight "1.0."

**Weight Adjustment:**

- Weights are editable inline in the status table (numeric input).
- A "Reset to Equal" button sets all weights back to 1.0.

**Real-Time Status Table:**

- Status, consistency, and last activity columns update in real time via WebSocket.
- A green pulse animation briefly highlights a row when its status changes.
- A toast notification appears at the top of the panel when a participant completes all comparisons.

**Round Controls (Delphi mode):**

- Displays the current round number and status (Open / Closed / Finalized).
- "Close Round" button — closes the current round, triggering aggregation.
- "New Round" button — available only after a round is closed; initiates the next round.
- "Finalize" button — permanently locks the problem; no further rounds.

### 8.2 Decision-Maker: Participation Experience

**PIN Entry Screen (if enabled):**

- Minimal screen with the problem title, participant's name, and a 4-digit PIN input field.
- "Verify" button. On failure: *"Incorrect PIN. [N] attempts remaining."*
- On lockout: *"Too many attempts. Please try again in 15 minutes."*

**Welcome Screen:**

- Clean, focused layout — no navigation chrome, no login prompts.
- Shows: Problem title, participant's name, brief AHP explanation, "Begin" button.
- If Delphi round 2+: "Round [N] — You can revise your comparisons. The group's previous results are shown for reference."
- If returning with existing data: "Welcome back, [Name]. You can review and update your comparisons."

**Wizard Interface:**

- Identical to the existing wizard, scoped to this participant.
- Progress bar showing completion percentage across all comparison groups.
- "Save & Continue Later" button always visible.
- In Delphi rounds 2+: each comparison screen shows the group's aggregated priority for the relevant pair from the previous round as a non-editable reference (e.g., a small badge: *"Group average: 3.2 toward Criterion A"*).
- On final submission: confirmation screen with CR summary and thank-you message.

### 8.3 Results Screen Enhancements

**Consensus Panel:**

- Displays Kendall's W for each comparison group with color-coded interpretive labels (red for low, yellow for moderate, green for high).
- Chi-squared statistic and p-value shown in a collapsible detail row.
- In multi-round mode: a trend chart showing Kendall's W across rounds.

**Round History (Delphi mode):**

- A tabbed or accordion view showing results per round.
- Round-over-round change indicators (arrows, percentage shift) on the global priority vector.

### 8.4 Report Generation

- "Generate Report" button on the Results screen (enabled only when at least one participant has completed comparisons and the round is closed).
- Options dialog before generation:
  - Include individual participant results in appendix? (checkbox, default: yes)
  - Include sensitivity analysis? (checkbox, default: yes)
  - Include round history? (checkbox, default: yes if multi-round; hidden if single-round)
- PDF downloads directly to the admin's browser.

---

## 9. Migration and Backward Compatibility

### 9.1 Existing Problems

- Existing `.AHP` files that use the old `respondents` structure will continue to work.
- A migration utility will convert legacy `respondents` arrays to the new `participants` format on first load.
- The `roundStatus` field defaults to `"open"` for migrated problems.
- New fields (`config`, `rounds`, `currentRound`) are initialized with default values on migration.

### 9.2 Version Bump

This feature constitutes a patch version increment: **v1.1.5**.

---

## 10. Testing Requirements

### 10.1 Unit Tests

- Token generation uniqueness and format.
- PIN generation, hashing, and verification.
- PIN lockout after 3 failed attempts and 15-minute cooldown.
- Weighted geometric mean aggregation with varying weights.
- CR computation for individual and aggregated matrices.
- Kendall's W computation for known test vectors (verify against published examples).
- Chi-squared and p-value derivation from W.
- Round open/close/new/finalize state transitions.
- Anonymous label assignment randomness (labels not correlated with creation order).

### 10.2 Integration Tests

- Full flow: admin creates problem → adds participants → participants submit via token → admin aggregates → report generates.
- Full Delphi flow: Round 1 comparisons → close → new round → Round 2 with group reference → close → finalize → report.
- PIN-protected flow: participant cannot access wizard without correct PIN; locked after 3 failures; access resumes after 15 minutes.
- Anonymous mode: admin sees anonymized results; report appendix uses anonymized labels; labels are not in creation order.
- Token invalidation after participant removal.
- Round closure prevents further submissions.
- Partial completion handling (some participants complete, some don't).
- WebSocket events fire correctly on participant status changes.
- WebSocket fallback to polling when connection drops.

### 10.3 Edge Cases

- Decision-maker opens link after problem is deleted.
- Decision-maker submits after round is closed (should be rejected gracefully).
- Admin removes a participant mid-comparison.
- All participants have CR > 0.10.
- Single decision-maker (aggregation degenerates to their individual matrices; Kendall's W is undefined with n=1 — handle gracefully).
- Maximum 12 decision-makers all submitting concurrently.
- Admin enables anonymous mode, then tries to disable it after a participant has started (should be blocked).
- Delphi round 2 initiated with zero completed participants in round 1 (should warn the admin).
- PIN verification with leading zeros (e.g., "0042").
- WebSocket reconnection after server restart.
- Kendall's W with tied ranks.

---

## 11. Future Considerations

These items are explicitly **out of scope** for v1.1.5 but noted for potential future releases:

- **Email Notifications:** Optional integration to send participation links and report PDFs via email directly from the app.
- **Partial Anonymous Mode:** Allow the admin to see aggregate-level attribution (e.g., consistency per participant) while keeping comparison-level data anonymous.
- **Export Round Data:** Allow export of raw per-round data in CSV format for external analysis.
- **Configurable PIN Length:** Support 4–8 digit PINs for higher-security environments.
- **Consensus-Driven Auto-Close:** Automatically close a round when Kendall's W exceeds a configurable threshold.

---

## 12. Summary

This feature transforms AHP Studio's multi-participant workflow from an account-dependent respondent system into a frictionless, link-based participation model. Project admins retain full control over the decision process — onboarding participants, monitoring progress in real time, adjusting weights, configuring anonymity and PIN protection, running iterative Delphi rounds, measuring group consensus, and generating comprehensive reports — while decision-makers contribute through a clean, focused interface that requires nothing more than clicking a link.

---

*Copyright 2026 by Dr. Jose Mendoza. All rights reserved.*
