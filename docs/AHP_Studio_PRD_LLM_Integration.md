# AHP Studio — Product Requirements Document

## Feature: LLM-Powered Intelligence Layer

**Document Version:** 1.0  
**Date:** March 9, 2026  
**Author:** Dr. Jose Mendoza  
**Target Release:** v1.2.0  
**Status:** Draft

---

## 1. Executive Summary

This document specifies the integration of a Large Language Model (LLM) intelligence layer into AHP Studio. The integration introduces three capabilities that enhance the decision-making experience across different stages of the AHP workflow:

1. **Intelligent Report Narratives** — LLM-generated prose sections within the Decision Report that synthesize computed results into readable, insightful narratives covering decision rationale, consensus interpretation, sensitivity commentary, and limitations.

2. **Consistency Coaching** — Context-aware, plain-language explanations presented to participants when their pairwise comparisons exhibit unacceptable inconsistency (CR > 0.10), identifying the specific source of the inconsistency and guiding them toward resolution without biasing their judgments.

3. **Smart Defaults and Validation** — An AI-powered review of the admin's problem structure (criteria, sub-criteria, alternatives) that flags potential issues such as cognitive overload, redundant criteria, structural imbalance, and missing coverage — surfaced as actionable suggestions before the admin opens the round for participation.

All LLM calls are executed server-side using the Google Gemini API. Every LLM-powered feature is designed for graceful degradation: if the LLM is unavailable or returns an error, the application falls back to its existing behavior with no loss of core functionality.

---

## 2. Goals and Non-Goals

### 2.1 Goals

- Transform the Decision Report's auto-generated rationale from templated text into rich, context-aware narrative prose that references specific computed results.
- Provide participants with actionable, non-judgmental guidance when their comparisons are inconsistent, reducing the number of abandoned or low-quality submissions.
- Help admins catch structural problems in their AHP hierarchy before participants begin comparisons, improving data quality and participant experience.
- Keep all LLM interactions server-side to protect API credentials and maintain architectural consistency.
- Ensure all three features degrade gracefully — no LLM feature should block or break existing workflows.
- Enforce cost controls through regeneration limits and efficient prompt design.

### 2.2 Non-Goals

- The LLM will **not** make decisions or recommend specific alternatives. It interprets and explains computed results only.
- The LLM will **not** perform AHP computations. All mathematical operations (eigenvectors, CR, Kendall's W, sensitivity analysis) remain in the existing computation engine.
- The LLM will **not** suggest what judgment values a participant should enter. Consistency coaching explains the logical structure of inconsistency without prescribing corrections.
- Real-time streaming of LLM responses to the client is out of scope for v1.2.0. All LLM calls are request-response.
- Fine-tuning or training a custom model is out of scope.
- The LLM will **not** interact with external data sources, APIs, or the internet. It operates exclusively on the problem data provided in each prompt.

---

## 3. Architecture Overview

### 3.1 LLM Provider

- **Provider:** Google Gemini API
- **Model:** `gemini-2.0-flash` (primary), with fallback to `gemini-2.0-flash-lite` if the primary model is unavailable or returns a 5xx error.
- **Protocol:** HTTPS REST calls from the AHP Studio Node.js backend to the Gemini API endpoint.
- **Authentication:** API key stored as an environment variable (`GEMINI_API_KEY`), never exposed to the client.

### 3.2 Server-Side Integration

All LLM interactions are handled by a new **LLM Service** module on the backend (`server/src/services/llmService.js`). This module:

- Constructs prompts from problem data.
- Sends requests to the Gemini API.
- Parses and validates responses.
- Returns structured output to the calling route handler.
- Handles errors, timeouts, and retries.

No LLM logic exists on the client. The React frontend interacts with new API endpoints that internally delegate to the LLM Service.

### 3.3 Request Flow

```
Client (React) → API Endpoint (Express) → LLM Service → Gemini API
                                        ← Parsed Response ←
                 ← JSON Response ←
```

### 3.4 Environment Configuration

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key | (required) |
| `GEMINI_MODEL` | Primary model identifier | `gemini-2.0-flash` |
| `GEMINI_FALLBACK_MODEL` | Fallback model identifier | `gemini-2.0-flash-lite` |
| `GEMINI_TIMEOUT_MS` | Request timeout in milliseconds | `30000` |
| `GEMINI_MAX_RETRIES` | Maximum retry attempts on transient failure | `2` |
| `LLM_ENABLED` | Global feature toggle for all LLM features | `true` |

---

## 4. Feature 1: Intelligent Report Narratives

### 4.1 Overview

When the admin generates a Decision Report, the system assembles a structured context payload from the problem's computed results and sends it to the LLM. The LLM produces four narrative sections that are inserted into the PDF report, replacing the current templated rationale text.

### 4.2 Functional Requirements

**FR-LLM-01:** When the admin clicks "Generate Report," the system assembles a context payload containing:

- Problem title, goal statement, and description.
- Criteria hierarchy (names and structure, including sub-criteria).
- Alternatives list with final global priority rankings (normalized and idealized).
- Aggregated criteria weights (priority vector).
- Individual and aggregated consistency ratios.
- Kendall's W values per comparison group with interpretive labels.
- Sensitivity analysis results: rank reversal thresholds per criterion.
- If multi-round: round-over-round priority vector shifts, Kendall's W trend, and which round is being reported.
- Participant count, completion count, and weight distribution.

**FR-LLM-02:** The LLM generates four distinct narrative sections:

| Section | Description | Approximate Length |
|---|---|---|
| **Decision Rationale** | Explains why the top-ranked alternative is preferred, grounding the explanation in the criteria it scored highest on and the relative weights of those criteria. Mentions the margin over the second-ranked alternative. | 150–250 words |
| **Consensus Summary** | Interprets Kendall's W values across comparison groups. Identifies areas of strong agreement and areas of divergence. In multi-round problems, describes whether consensus improved across rounds. | 100–200 words |
| **Sensitivity Commentary** | Describes which criteria have stable rankings (large margin before rank reversal) and which are fragile. Calls out the specific reversal thresholds that an admin should be aware of. | 100–200 words |
| **Limitations and Caveats** | Flags any consistency ratios above 0.10 (individual or aggregated), low participation rates (participants who did not complete), low consensus areas, or heavily skewed weight distributions that could affect result reliability. If no significant limitations exist, this section states that the results are robust. | 75–150 words |

**FR-LLM-03:** The LLM must reference only the data provided in the context payload. The system prompt explicitly instructs the model not to fabricate, estimate, or infer any numerical values beyond what is provided.

**FR-LLM-04:** After receiving the LLM response, the backend performs a lightweight validation pass:

- Verifies that all four sections are present in the response.
- Checks that any numerical values mentioned in the narrative (e.g., percentages, CR values, Kendall's W) match the values in the context payload within a tolerance of ±0.01.
- If validation fails for a section, that section falls back to the existing templated text with a note: *"AI-generated narrative unavailable for this section."*

**FR-LLM-05:** The admin can preview the LLM-generated narrative sections before the final PDF is produced. The preview appears in a modal or expandable panel on the Report Options dialog.

**FR-LLM-06:** The admin can regenerate the narrative up to **3 times** per report generation session. Each regeneration replaces all four sections with a fresh LLM response. A counter displays remaining regenerations (e.g., "2 regenerations remaining"). After 3 regenerations, the "Regenerate" button is disabled.

**FR-LLM-07:** The admin can manually edit the LLM-generated narrative text in the preview before generating the PDF. Edits are applied to the current version only and are not persisted if the admin regenerates.

**FR-LLM-08:** If the LLM call fails (timeout, API error, or rate limit), the report generation proceeds using the existing templated rationale text. A non-blocking warning is shown: *"AI-generated narrative is temporarily unavailable. The report will use a standard summary."*

**FR-LLM-09:** The regeneration counter resets each time the admin opens a new report generation session (i.e., clicks "Generate Report" again after closing the dialog).

### 4.3 Prompt Design

The prompt is structured as follows:

**System prompt:** Establishes the LLM's role, output format, and constraints.

```
You are an expert decision analysis consultant writing sections of a formal
decision report based on an Analytic Hierarchy Process (AHP) evaluation.

Rules:
- Reference ONLY the data provided below. Do not fabricate, estimate, or infer
  any numbers beyond what is given.
- Write in a professional, objective, third-person tone suitable for a formal
  report distributed to organizational stakeholders.
- Do not recommend or endorse any alternative. Your role is to explain the
  results, not to advocate.
- When referencing numerical values, use the exact figures provided.
- Each section must be self-contained and readable independently.

Respond in JSON format with exactly four keys:
{
  "decisionRationale": "...",
  "consensusSummary": "...",
  "sensitivityCommentary": "...",
  "limitationsAndCaveats": "..."
}
```

**User prompt:** Contains the assembled context payload as structured data.

```
Generate the four narrative sections for the following AHP decision report.

PROBLEM CONTEXT:
{problemContext}

RESULTS DATA:
{resultsData}

SENSITIVITY DATA:
{sensitivityData}

PARTICIPANT DATA:
{participantData}

ROUND HISTORY (if applicable):
{roundHistory}
```

### 4.4 Context Payload Assembly

The context payload is assembled by the backend from the problem's `.AHP` file and computed results. Raw pairwise comparison matrices are **not** included — only computed outputs (priority vectors, CRs, Kendall's W, sensitivity thresholds). This keeps the prompt token-efficient.

Estimated token usage per call:

| Component | Estimated Tokens |
|---|---|
| System prompt | ~250 |
| Context payload | ~800–1,500 (varies with problem complexity) |
| Response | ~600–900 |
| **Total** | **~1,650–2,650** |

### 4.5 Report PDF Integration

The four narrative sections are inserted into the existing Decision Report PDF structure:

| Existing Report Section | LLM Narrative Placement |
|---|---|
| Section 10: Decision Rationale | Replaced by `decisionRationale` |
| Section 5: Consensus Analysis | `consensusSummary` appended after the Kendall's W data tables |
| Section 9: Sensitivity Analysis | `sensitivityCommentary` appended after the sensitivity data |
| New section (after Sensitivity) | `limitationsAndCaveats` inserted as a new "Limitations" section |

---

## 5. Feature 2: Consistency Coaching

### 5.1 Overview

When a participant's pairwise comparisons produce a consistency ratio (CR) exceeding 0.10, the system identifies the most inconsistent triad in the matrix computationally, then sends the triad and its context to the LLM for a plain-language explanation. The explanation is displayed alongside the existing CR warning on the post-submission confirmation screen.

### 5.2 Functional Requirements

**FR-LLM-10:** After a participant submits their comparisons, the system computes the consistency ratio for each comparison group (criteria, sub-criteria sets, alternative sets under each criterion). For each group where CR > 0.10, the system identifies the most inconsistent triad.

**FR-LLM-11:** The most inconsistent triad is identified computationally (not by the LLM) using the following method:

- For an n × n comparison matrix A, enumerate all triads (i, j, k).
- For each triad, compute the circular inconsistency: `deviation = |log(a_ij) + log(a_jk) - log(a_ik)|`.
- Select the triad with the maximum deviation.

This computation runs on the server within the existing compute module.

**FR-LLM-12:** For each inconsistent group, the system constructs a coaching prompt containing:

- The names of the three elements in the most inconsistent triad.
- The participant's judgment values for the three pairwise comparisons in the triad.
- The CR value for the full matrix.
- The comparison group context (e.g., "These are sub-criteria under the Cost criterion" or "These are main criteria for the decision").

**FR-LLM-13:** The LLM generates a short, plain-language explanation (3–5 sentences) that:

- Names the three elements forming the circular preference.
- States the participant's judgments for those three pairs in natural language (e.g., "You rated Cost as strongly preferred over Security (7)").
- Explains why these three judgments are logically inconsistent (the circular preference problem).
- Suggests which comparison(s) to revisit without prescribing what the answer should be.

**FR-LLM-14:** The LLM must **never** suggest which direction the participant should change their judgment. It explains the structure of the inconsistency only. The system prompt explicitly enforces this constraint.

**FR-LLM-15:** The coaching message is displayed on the post-submission confirmation screen (FR-21 in the v1.1.5 PRD), below the CR value for the relevant comparison group. It appears in a distinct visual container (e.g., a light-yellow coaching card with a lightbulb icon) to differentiate it from system warnings.

**FR-LLM-16:** Each coaching card includes a "Revise This Group" button that navigates the participant back to the first comparison in that group within the wizard.

**FR-LLM-17:** If the participant revises and resubmits, the system recomputes CRs and regenerates coaching messages only for groups that still exceed CR > 0.10. Previously generated coaching messages are not cached.

**FR-LLM-18:** If the LLM call fails, the existing CR warning is displayed without the coaching explanation. A subtle note appears: *"Detailed guidance is temporarily unavailable."* The participant can still revise using the standard CR information.

**FR-LLM-19:** Coaching messages are generated in a single batched LLM call per submission. If a participant has multiple inconsistent groups, all triads are included in a single prompt, and the LLM returns an array of coaching messages — one per group. This reduces latency and API call volume.

**FR-LLM-20:** The maximum number of inconsistent groups coached per submission is **6**. If a participant has more than 6 inconsistent groups, the system coaches the 6 with the highest CR values and displays standard warnings for the remainder.

### 5.3 Prompt Design

**System prompt:**

```
You are a friendly, neutral decision-analysis coach helping a participant
improve the consistency of their pairwise comparisons in an Analytic Hierarchy
Process (AHP) evaluation.

Rules:
- Explain the inconsistency in plain, non-technical language.
- NEVER suggest which direction the participant should change their judgment.
  Only explain the structure of the inconsistency (the circular preference).
- Use the participant's own judgment values to illustrate the inconsistency.
- Be encouraging and non-judgmental. Frame the inconsistency as a common
  occurrence that is easy to resolve.
- Keep each explanation to 3–5 sentences.
- Address the participant directly using "you" and "your."

Respond in JSON format as an array of objects, one per inconsistent group:
[
  {
    "groupId": "...",
    "coachingMessage": "..."
  }
]
```

**User prompt:**

```
A participant has submitted pairwise comparisons with consistency issues in the
following groups. For each group, explain the inconsistency based on the most
problematic triad identified.

INCONSISTENT GROUPS:
{inconsistentGroups}
```

Where `{inconsistentGroups}` is a JSON array:

```json
[
  {
    "groupId": "criteria",
    "groupContext": "Main criteria for the decision: Select Best Cloud Provider",
    "cr": 0.15,
    "triad": {
      "elements": ["Cost", "Security", "Scalability"],
      "judgments": {
        "Cost vs Security": { "value": 7, "preferred": "Cost" },
        "Security vs Scalability": { "value": 5, "preferred": "Security" },
        "Cost vs Scalability": { "value": 2, "preferred": "Scalability" }
      }
    }
  }
]
```

### 5.4 Token Estimation

| Component | Estimated Tokens |
|---|---|
| System prompt | ~200 |
| Context (1–6 inconsistent groups) | ~150–600 |
| Response (1–6 coaching messages) | ~150–600 |
| **Total** | **~500–1,400** |

### 5.5 Timing and UX Flow

```
Participant clicks "Submit"
  → Server computes CRs for all groups
  → Server identifies inconsistent groups (CR > 0.10)
  → Server computes most inconsistent triad per group
  → Server sends batched coaching request to Gemini API
  → Server returns submission result + coaching messages to client
  → Client renders confirmation screen with CR values + coaching cards
```

The LLM call adds latency to the submission response. The target total response time (including computation and LLM call) is under **5 seconds**. If the LLM call exceeds the timeout (`GEMINI_TIMEOUT_MS`), the response is returned without coaching messages.

---

## 6. Feature 3: Smart Defaults and Validation

### 6.1 Overview

Before opening a round for participation, the admin can request an AI-powered review of their problem structure. The system sends the criteria hierarchy, alternatives, and problem context to the LLM, which returns a list of categorized observations and suggestions. These are displayed in the UI as a dismissible checklist.

### 6.2 Functional Requirements

**FR-LLM-21:** A "Review My Setup" button is available in the problem editor, visible when the problem has at least one criterion and one alternative defined. The button is located in the problem toolbar or at the top of the Criteria panel.

**FR-LLM-22:** When clicked, the system sends the following to the LLM:

- Problem title and goal description.
- Full criteria tree (names, hierarchy, and count of sub-criteria per criterion).
- List of alternatives.
- Total comparison count estimate (computed by the server based on the hierarchy — not by the LLM).
- Number of participants (if any have been added).

**FR-LLM-23:** The LLM evaluates the problem structure and returns observations in the following categories:

| Category | Icon | Description |
|---|---|---|
| **Cognitive Load** | ⚠️ Warning | The total number of comparisons is high, or a single comparison group is excessively large. Includes the server-computed comparison count and an estimated completion time. |
| **Redundancy** | 💡 Suggestion | Two or more criteria appear to overlap in meaning or scope (e.g., "Cost" and "Price," or "Reliability" and "Uptime"). |
| **Coverage Gap** | 💡 Suggestion | Based on the problem's goal and domain, a commonly relevant criterion appears to be absent (e.g., a vendor selection problem with no criterion related to support or service quality). |
| **Structural Imbalance** | 💡 Suggestion | The hierarchy is unevenly structured — e.g., one criterion has 6 sub-criteria while others have none, or only one alternative is defined. |
| **Naming Clarity** | ℹ️ Info | A criterion or alternative name is ambiguous or too generic (e.g., "Quality" without further specification), which may confuse participants during comparisons. |
| **Scale Concern** | ℹ️ Info | The number of alternatives or criteria approaches the AHP practical limit, which may affect discrimination quality. |

**FR-LLM-24:** The LLM response is structured as a JSON array of observations:

```json
[
  {
    "category": "cognitive_load",
    "severity": "warning",
    "title": "High comparison count",
    "message": "With 8 criteria and no sub-criteria, each participant will need to complete 28 pairwise comparisons at the criteria level alone, plus additional comparisons for alternatives under each criterion. The total estimated comparison count is 148, which typically takes 30–40 minutes. Consider grouping related criteria into 3–4 clusters with sub-criteria to reduce the number of comparisons per group.",
    "affectedElements": ["criteria"]
  }
]
```

**FR-LLM-25:** The server supplements the LLM's observations with deterministic checks that do not require an LLM:

- **Comparison count calculation** — exact number of pairwise comparisons required, computed from the hierarchy structure. Formula: for n items, comparisons = n(n-1)/2, summed across all comparison groups.
- **Estimated completion time** — based on a heuristic of approximately 12 seconds per comparison (industry average for AHP studies), yielding: `estimatedMinutes = totalComparisons × 12 / 60`.
- **Hard limit violations** — criteria count exceeding 10, sub-criteria per criterion exceeding 6, or alternatives exceeding 12 (current system limits).

These deterministic checks are always included in the response, regardless of LLM availability.

**FR-LLM-26:** The validation results are displayed in a slide-out panel or modal titled "Setup Review." Each observation is rendered as a card with:

- Category icon and severity color (red for warning, amber for suggestion, blue for info).
- Title (bold).
- Message body.
- A "Dismiss" button to remove the card from view.

**FR-LLM-27:** The admin can re-run the review at any time by clicking "Review My Setup" again. Each click consumes one LLM call. There is no hard limit on re-runs for validation, but a cooldown of **10 seconds** between consecutive calls prevents accidental rapid-fire requests.

**FR-LLM-28:** If the LLM call fails, only the deterministic checks (FR-LLM-25) are shown. A note appears at the top of the panel: *"AI-powered suggestions are temporarily unavailable. Showing structural checks only."*

**FR-LLM-29:** The validation panel includes a summary line at the top: e.g., *"2 warnings, 3 suggestions, 1 info — Review these before opening the round."* If no issues are found, the summary reads: *"No issues detected. Your problem structure looks good."*

**FR-LLM-30:** The validation results are not persisted. They are generated on-demand and discarded when the panel is closed.

### 6.3 Prompt Design

**System prompt:**

```
You are an expert in the Analytic Hierarchy Process (AHP) methodology, reviewing
the structure of a decision problem before it is sent to participants for
pairwise comparisons.

Rules:
- Evaluate the hierarchy for cognitive load, redundancy, coverage gaps,
  structural imbalance, naming clarity, and scale concerns.
- Be specific: reference actual criterion and alternative names from the problem.
- Frame everything as suggestions, never mandates. The admin is the domain
  expert; you are providing structural and usability guidance.
- Do not suggest adding criteria that are clearly irrelevant to the stated goal.
- If the structure looks sound, say so. Do not fabricate issues.
- The comparison count and estimated time are provided by the system — do not
  recalculate them. You may reference them in your observations.

Respond in JSON format as an array of observation objects:
[
  {
    "category": "redundancy | coverage_gap | structural_imbalance | naming_clarity | scale_concern",
    "severity": "warning | suggestion | info",
    "title": "Short descriptive title",
    "message": "Detailed observation with specific references to the problem elements.",
    "affectedElements": ["element1", "element2"]
  }
]

Return an empty array [] if no issues are found.
Do NOT include cognitive_load observations — those are handled by the system.
```

**User prompt:**

```
Review the following AHP problem structure for potential issues.

PROBLEM:
Title: {title}
Goal: {goal}
Description: {description}

CRITERIA HIERARCHY:
{criteriaTree}

ALTERNATIVES:
{alternativesList}

COMPUTED METRICS (provided by system — do not recalculate):
- Total comparison groups: {groupCount}
- Total pairwise comparisons: {totalComparisons}
- Estimated completion time: {estimatedMinutes} minutes
- Participants: {participantCount}
```

### 6.4 Token Estimation

| Component | Estimated Tokens |
|---|---|
| System prompt | ~250 |
| Context payload | ~300–600 |
| Response | ~200–800 (depends on issue count) |
| **Total** | **~750–1,650** |

---

## 7. API Changes

### 7.1 New Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/problems/:id/report/narratives` | Admin (JWT) | Generate LLM-powered narrative sections for the Decision Report. Returns JSON with four narrative strings. |
| `POST` | `/api/v1/problems/:id/report/narratives/regenerate` | Admin (JWT) | Regenerate narratives. Returns 429 if the 3-regeneration limit has been reached for the current session. |
| `POST` | `/api/v1/compute/consistency-coaching` | None (participation session) | Accepts comparison matrices and CRs for inconsistent groups; returns coaching messages. Called internally during submission processing. |
| `POST` | `/api/v1/problems/:id/validate-structure` | Admin (JWT) | Run AI-powered validation on the problem hierarchy. Returns deterministic checks plus LLM observations. |
| `GET` | `/api/v1/llm/status` | Admin (JWT) | Returns the current LLM configuration status: enabled/disabled, model, and whether the Gemini API is reachable (health check). |

### 7.2 Modified Endpoints

| Endpoint | Change |
|---|---|
| `PUT /api/v1/participate/:problemId/:token` | Response payload extended to include a `coaching` field containing an array of coaching messages (may be empty if no inconsistencies or if LLM is unavailable). |
| `POST /api/v1/problems/:id/report` | Accepts an optional `narratives` object in the request body containing the four narrative sections (admin-approved, possibly edited). If absent, falls back to templated text. |

### 7.3 Response Schemas

**Report Narratives Response (`POST /problems/:id/report/narratives`):**

```json
{
  "narratives": {
    "decisionRationale": "The evaluation identified...",
    "consensusSummary": "Across the five criteria groups...",
    "sensitivityCommentary": "The current ranking is robust...",
    "limitationsAndCaveats": "Two participants exceeded..."
  },
  "regenerationsRemaining": 2,
  "generatedAt": "2026-03-09T10:30:00Z"
}
```

**Consistency Coaching Response (within submission response):**

```json
{
  "submissionStatus": "completed",
  "consistencyRatios": { ... },
  "coaching": [
    {
      "groupId": "criteria",
      "groupLabel": "Main Criteria",
      "cr": 0.15,
      "coachingMessage": "Looking at your comparisons for Cost, Security, and Scalability..."
    }
  ]
}
```

**Validation Response (`POST /problems/:id/validate-structure`):**

```json
{
  "deterministic": [
    {
      "category": "cognitive_load",
      "severity": "warning",
      "title": "High comparison count",
      "message": "Each participant will need to complete 148 pairwise comparisons (estimated 30 minutes).",
      "affectedElements": ["criteria"]
    }
  ],
  "aiObservations": [
    {
      "category": "redundancy",
      "severity": "suggestion",
      "title": "Potentially overlapping criteria",
      "message": "\"Cost\" and \"Price\" may be measuring the same dimension...",
      "affectedElements": ["Cost", "Price"]
    }
  ],
  "summary": {
    "warnings": 1,
    "suggestions": 1,
    "info": 0
  },
  "llmAvailable": true
}
```

---

## 8. Data Model Changes

### 8.1 Problem Schema Extension

No permanent schema changes are required. LLM outputs (narratives, coaching messages, validation results) are transient — generated on-demand and not stored in the `.AHP` file.

**Exception:** When the admin approves narrative sections for the report, the approved text is stored within the round's report metadata:

```json
{
  "rounds": [
    {
      "roundNumber": 1,
      "report": {
        "generatedAt": "2026-03-09T11:00:00Z",
        "narratives": {
          "decisionRationale": "...",
          "consensusSummary": "...",
          "sensitivityCommentary": "...",
          "limitationsAndCaveats": "..."
        },
        "narrativeSource": "llm",
        "options": {
          "includeIndividualResults": true,
          "includeSensitivity": true,
          "includeRoundHistory": true
        }
      }
    }
  ]
}
```

The `narrativeSource` field indicates whether the narrative was LLM-generated (`"llm"`) or templated (`"template"`), for auditability.

### 8.2 Regeneration Tracking

Regeneration counts are tracked in server-side session state (in-memory, keyed by `userId + problemId + roundNumber`). They are not persisted to storage. The counter resets when the session expires or when the admin reopens the report dialog.

---

## 9. Security Considerations

### 9.1 API Key Protection

- The Gemini API key is stored exclusively in the server-side environment variable `GEMINI_API_KEY`.
- The key is never included in client-side responses, logs, or error messages.
- The `/api/v1/llm/status` endpoint reports whether the LLM is configured but never exposes the key.

### 9.2 Prompt Injection Prevention

- All user-supplied text (problem titles, criteria names, alternative names, descriptions) is sanitized before inclusion in prompts. Sanitization includes escaping special characters and truncating excessively long inputs.
- The system prompt explicitly instructs the model to respond only in the specified JSON format and to ignore any instructions embedded in the problem data.
- LLM responses are parsed as JSON with strict schema validation. Unexpected fields are discarded.
- Maximum input lengths:
  - Problem title: 200 characters
  - Problem description: 1,000 characters
  - Criterion/alternative names: 100 characters each
  - These limits are enforced at the API level before prompt assembly.

### 9.3 Data Exposure

- Only the minimum necessary data is sent to the Gemini API. Raw comparison matrices are not included in report narrative prompts — only computed results.
- Participant names are not sent to the LLM in consistency coaching prompts. The coaching prompt includes only element names (criteria, alternatives), judgment values, and structural context.
- Participant emails are never included in any LLM prompt.

### 9.4 Rate Limiting

- LLM-related endpoints inherit the existing API rate limit (60 req/min per user).
- Report narrative regeneration is capped at 3 per session (FR-LLM-06).
- Structure validation has a 10-second cooldown between consecutive calls (FR-LLM-27).
- Consistency coaching is triggered only on submission events, which are naturally rate-limited by the comparison workflow.

---

## 10. Error Handling and Graceful Degradation

### 10.1 Failure Modes

| Failure | Feature Affected | Fallback Behavior |
|---|---|---|
| Gemini API unreachable | All | Features revert to non-LLM behavior. Templated report text, standard CR warnings, deterministic-only validation. |
| Gemini API returns 429 (rate limit) | All | Retry after `Retry-After` header delay (up to `GEMINI_MAX_RETRIES`). If retries exhausted, fall back as above. |
| Gemini API returns 5xx | All | Retry with fallback model (`GEMINI_FALLBACK_MODEL`). If fallback also fails, fall back to non-LLM behavior. |
| Gemini API returns 400 (bad request) | Affected call | Log the error. Do not retry (indicates a prompt issue). Fall back to non-LLM behavior. |
| Response timeout | All | After `GEMINI_TIMEOUT_MS`, abort the call. Fall back to non-LLM behavior. |
| Response fails JSON parsing | Affected call | Log the raw response for debugging. Fall back to non-LLM behavior. |
| Response passes parsing but fails schema validation | Affected call | Use valid sections; fall back for invalid sections. |
| `LLM_ENABLED` is `false` | All | All LLM features are disabled globally. UI hides LLM-related buttons. Deterministic validation remains available. |
| `GEMINI_API_KEY` is not set | All | Same as `LLM_ENABLED = false`. Logged as a startup warning. |

### 10.2 User-Facing Error Messages

All error messages are concise and non-technical:

- **Report narratives:** *"AI-generated narrative is temporarily unavailable. The report will use a standard summary."*
- **Consistency coaching:** *"Detailed guidance is temporarily unavailable."* (Shown below the standard CR warning.)
- **Structure validation:** *"AI-powered suggestions are temporarily unavailable. Showing structural checks only."*

Error messages never expose API details, model names, or error codes to the user.

---

## 11. UI/UX Specifications

### 11.1 Report Generation — Narrative Preview

**Location:** Report Options dialog (existing), expanded with a new "AI Narrative" tab or section.

**Flow:**

1. Admin clicks "Generate Report" on the Results screen.
2. The Report Options dialog opens. Existing checkboxes remain (Include individual results, Include sensitivity, Include round history).
3. A new section titled "AI-Generated Narrative" appears below the checkboxes, with a loading spinner while the LLM call is in progress.
4. Once generated, the four narrative sections are displayed in an editable text area, each with its section title as a label.
5. A "Regenerate Narrative" button with a counter badge (e.g., "Regenerate (2 left)") appears at the bottom of the section.
6. A "Generate PDF" button at the bottom of the dialog finalizes the report with the current narrative text (edited or not).
7. If LLM is unavailable, the section displays a muted message: *"AI narrative unavailable — the report will include a standard summary."* No editable text area is shown.

### 11.2 Consistency Coaching — Participant View

**Location:** Post-submission confirmation screen (existing FR-21), below each comparison group's CR display.

**Visual treatment:**

- Each coaching message appears inside a card with:
  - A light-yellow background (`#FFF8E1`) with a left border accent (`#FFB300`).
  - A lightbulb icon (💡) in the top-left corner.
  - The coaching message text in a slightly smaller font than the main content.
  - A "Revise This Group" button (styled as a text link or secondary button) that navigates to the relevant comparison group in the wizard.

**Behavior:**

- Cards appear only for groups with CR > 0.10.
- If coaching is unavailable (LLM error), the card is omitted and only the standard CR warning is shown.
- Cards are not shown for groups where CR ≤ 0.10.

### 11.3 Smart Validation — Admin View

**Location:** Problem editor toolbar, as a "Review My Setup" button with a magnifying-glass or checklist icon.

**Button state:**

- Disabled (grayed out) if the problem has no criteria or no alternatives.
- Shows a brief tooltip on hover: *"Get AI-powered feedback on your problem structure."*
- While a validation request is in progress, the button shows a loading spinner and is disabled.

**Results panel:**

- Slides in from the right side of the screen (or opens as a modal on smaller viewports).
- Title: "Setup Review."
- Summary line at the top (e.g., "1 warning, 2 suggestions").
- Observation cards sorted by severity: warnings first, then suggestions, then info.
- Each card has a "Dismiss" button (×) in the top-right corner.
- A "Close" button at the bottom of the panel.
- If all cards are dismissed, the panel shows: *"All observations reviewed."*

---

## 12. Testing Requirements

### 12.1 Unit Tests

- **LLM Service:** Mock the Gemini API. Verify correct prompt assembly for all three features. Verify JSON parsing and schema validation of responses. Verify fallback behavior on API errors, timeouts, and malformed responses.
- **Triad detection:** Verify that the most inconsistent triad is correctly identified for known test matrices (compare against hand-computed results).
- **Comparison count calculator:** Verify exact comparison counts for various hierarchy shapes (flat, deep, mixed).
- **Estimated time calculator:** Verify the 12-seconds-per-comparison heuristic produces correct estimates.
- **Regeneration counter:** Verify counter increments correctly, caps at 3, and resets on new sessions.
- **Input sanitization:** Verify that special characters, extremely long strings, and potential injection payloads in problem data are sanitized before prompt assembly.
- **Validation merging:** Verify that deterministic checks and LLM observations are correctly combined and sorted in the response.

### 12.2 Integration Tests

- **Full report narrative flow:** Admin creates problem → participants submit → round closed → admin clicks Generate Report → narratives are generated → admin edits → PDF is produced with edited narratives.
- **Regeneration limit:** Admin regenerates 3 times → 4th attempt returns 429 → counter resets on new session.
- **Consistency coaching end-to-end:** Participant submits inconsistent comparisons → server computes triads → LLM returns coaching → participant sees coaching cards → participant revises → resubmission with improved CR no longer shows coaching.
- **Validation end-to-end:** Admin builds a problem with redundant criteria → clicks "Review My Setup" → receives both deterministic and AI observations → dismisses cards → re-runs after fixing issues → no warnings returned.
- **Graceful degradation (all features):** Simulate Gemini API being unreachable → verify all three features fall back correctly without errors.
- **Fallback model:** Simulate primary model returning 5xx → verify retry with fallback model → verify success with fallback model.
- **LLM disabled:** Set `LLM_ENABLED=false` → verify LLM buttons are hidden, deterministic validation still works, reports use templated text.

### 12.3 Edge Cases

- Problem with no alternatives (validation should still run on criteria).
- Problem with a single criterion (no criteria-level comparisons; validation should note this).
- Participant with all CRs ≤ 0.10 (no coaching messages generated; standard confirmation shown).
- Participant with all groups inconsistent (6 coaching messages in a single batch).
- Participant with more than 6 inconsistent groups (7th+ groups fall back to standard warnings).
- Extremely long problem description (verify truncation before prompt assembly).
- Criteria names containing special characters, unicode, or very long strings.
- LLM returns valid JSON but with missing fields (partial response handling).
- LLM returns narrative containing a numerical value that doesn't match the input data (validation catches it and falls back for that section).
- Concurrent report narrative generation by two admin sessions for the same problem (each session should have independent regeneration counters).
- Rapid consecutive clicks on "Review My Setup" (10-second cooldown enforced).
- Problem with Delphi rounds — report narrative should reference round history.
- Anonymous mode — verify participant names are not included in any LLM prompt.

---

## 13. Cost Estimation

### 13.1 Per-Feature Token Usage

| Feature | Tokens per Call (est.) | Calls per Decision Cycle (est.) |
|---|---|---|
| Report Narratives | 1,650–2,650 | 1–3 (regenerations) |
| Consistency Coaching | 500–1,400 | 1 per inconsistent submission (est. 30–50% of submissions) |
| Structure Validation | 750–1,650 | 1–3 per problem setup phase |

### 13.2 Cost Model

Costs depend on Gemini API pricing, which varies by model and may change. The architecture minimizes token usage by:

- Sending only computed results (not raw matrices) for report narratives.
- Batching all inconsistent groups into a single coaching call.
- Using deterministic checks for validation items that don't require an LLM.
- Capping regenerations at 3 per report session.

Administrators should monitor usage via the Google Cloud Console and set billing alerts as appropriate.

---

## 14. Future Considerations

These items are explicitly **out of scope** for v1.2.0 but noted for potential future releases:

- **Streaming responses:** Stream LLM-generated narrative sections progressively to the UI for a more responsive feel.
- **AI-assisted problem structuring:** Allow the admin to describe their decision in natural language and have the LLM suggest a complete criteria/alternatives hierarchy as a starting point.
- **Natural language querying of results:** Allow the admin to ask questions about the computed results in plain English and receive conversational answers.
- **Custom system prompts:** Allow administrators to customize the LLM's tone, language, or focus areas for report narratives.
- **Multi-language support:** Generate narratives and coaching messages in the participant's preferred language.
- **Consensus-driven Delphi facilitation:** LLM-generated round summary messages that the admin can share with participants between Delphi rounds.
- **Model selection:** Allow the admin to choose between available Gemini models based on cost/quality preferences.

---

## 15. Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-03-09 | Initial draft — Intelligent Report Narratives, Consistency Coaching, Smart Defaults and Validation |

---

## 16. Summary

This specification introduces an LLM intelligence layer to AHP Studio that enhances three critical stages of the decision-making workflow: problem setup (Smart Validation), participant comparison (Consistency Coaching), and results communication (Intelligent Report Narratives). The integration uses Google Gemini as the LLM provider with all calls executed server-side, strict prompt engineering to prevent hallucination and bias, comprehensive graceful degradation, and cost controls through regeneration limits and efficient prompt design.

The LLM never makes decisions, never performs calculations, and never biases participant judgments. It serves as an interpretive and advisory layer that makes the rigorous AHP methodology more accessible, more transparent, and more actionable for both administrators and decision-makers.

---

*Copyright 2026 by Dr. Jose Mendoza. All rights reserved.*
