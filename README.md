# AHP Studio

**Version:** 1.1.7  
**Author:** Dr. Jose Mendoza  
**Copyright 2026 by Dr. Jose Mendoza.**

## Overview
AHP Studio is a web-based decision support application implementing the Analytic Hierarchy Process (AHP). It enables structured multi-criteria decision making through pairwise comparisons, priority computation, consistency analysis, and sensitivity analysis — all from a modern browser interface.

**Live:** [https://squid-app-owz3p.ondigitalocean.app](https://squid-app-owz3p.ondigitalocean.app)

## Features
- **Decision Problem Management** — Create, save, load, delete, and import/export `.AHP` files
- **Criteria & Sub-criteria** — Add up to 10 criteria, each with up to 6 sub-criteria for hierarchical structuring
- **Alternatives Management** — Add up to 12 alternatives per problem
- **Wizard-Style Comparisons** — Step-by-step pairwise comparison wizard presenting one pair at a time with back/forward navigation and progress tracking; traditional matrix view also available via toggle
- **Participant Participation** — Add up to 12 participants per problem; each receives a unique tokenized link to complete comparisons without creating an account. The problem owner can also add themselves as a participant; comparisons are locked until they do so.
- **PIN Protection** — Optionally protect participation links with a 4-digit PIN (bcrypt-hashed, 3-attempt lockout)
- **Anonymous Mode** — Enable anonymous participation where submitted responses are dissociated from participant identities
- **Consensus Measurement** — Kendall's coefficient of concordance (W) with chi-squared test and p-value for inter-rater agreement across criteria and alternative rankings
- **Delphi Iteration** — Multi-round decision cycles: close rounds, share aggregated group results, and open new rounds so participants can revise comparisons toward convergence
- **Real-Time Status** — WebSocket-powered live updates on the admin dashboard as participants save or submit comparisons; automatic fallback to polling
- **Priority Computation** — Eigenvector method with automatic consistency ratio (CR) checking
- **Global Synthesis** — Normalized and idealized global priority rankings with sub-criteria weight aggregation
- **Sensitivity Analysis** — Vary criterion weights to detect rank reversals
- **Decision Report** — Generate a printable report with problem definition, hierarchy, participants, consensus analysis (Kendall's W), criteria weights, alternative priorities, final ranking, auto-generated decision rationale, round history, and sensitivity summary
- **AI Report Narratives** — LLM-generated decision rationale, consensus summary, sensitivity commentary, and limitations sections embedded in the report; inline editing and up to 3 regenerations per session
- **Consistency Coaching** — After submitting comparisons, participants receive AI-powered coaching cards for inconsistent groups (CR > 10%), explaining the most problematic triad in plain language with a "Revise This Group" shortcut
- **Smart Validation** — "Review My Setup" button in the problem editor runs deterministic checks (cognitive load, limits) plus AI-powered structural observations (redundancy, coverage gaps, naming clarity, scale concerns) displayed in a slide-in panel
- **Local File Save** — Save `.AHP` files directly to your computer; upload them to resume later
- **User Management** — Admin panel for user CRUD, account unlock, password reset
- **Authentication** — JWT with httpOnly cookies, bcryptjs hashing, 3-attempt account lockout
- **Information Pages** — About, What is AHP?, AHP in the Age of GenAI, Help, Terms and Conditions, Privacy Policy

## Technology Stack
- **Backend:** Node.js, Express.js 4.18, JWT, bcryptjs, ws (WebSocket)
- **Frontend:** React 18, Tailwind CSS, Axios
- **Storage:** DigitalOcean Spaces (@aws-sdk/client-s3 v3) — no database required
- **Hosting:** DigitalOcean App Platform
- **Computation:** mathjs (eigenvector, consistency metrics), Kendall's W (built-in)
- **LLM Integration:** OpenAI API (gpt-4o default, gpt-4o-mini fallback) — optional, graceful degradation when unavailable

## Prerequisites
- Node.js 18+
- DigitalOcean Spaces bucket (S3-compatible)
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jrmst102/ahpstudio.git
   cd ahpstudio
   ```

2. Copy and configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your Spaces credentials and JWT secret
   ```

3. Install dependencies and seed admin user:
   ```bash
   npm install
   cd client && npm install && cd ..
   node server/prisma/seed.js
   ```

4. Start development:
   ```bash
   # Terminal 1 (Backend)
   cd server && npm run dev

   # Terminal 2 (Frontend)
   cd client && npm start
   ```

5. Log in with default admin credentials:
   - Username: `admin`
   - Password: `AHPAdmin2026!`
   - **Change this password on first login!**

## Deployment (DigitalOcean App Platform)

1. Push to GitHub — App Platform auto-deploys from `main`.
2. Set environment variables in the App Platform dashboard:
   - `JWT_SECRET`, `SPACES_ENDPOINT`, `SPACES_KEY`, `SPACES_SECRET`, `SPACES_BUCKET`, `SPACES_REGION`, `NODE_ENV`, `APP_URL`
   - LLM (optional): `OPENAI_API_KEY`, `LLM_ENABLED`, `OPENAI_MODEL`, `OPENAI_FALLBACK_MODEL`, `OPENAI_TIMEOUT_MS`, `OPENAI_MAX_RETRIES`
3. Build command: `npm run build` (client is pre-built and committed; server deps installed by `npm ci`)
4. Run command: `npm start` (runs `node server/src/app.js`)

## Data Storage
All data is stored in DigitalOcean Spaces (S3-compatible):
- **Users:** `data/users.json`
- **Problem metadata:** `users/{userId}/problems/index.json`
- **Problem data:** `users/{userId}/problems/{problemId}.AHP`
- **Token index:** `data/participation-tokens.json` (maps participation tokens to problem/participant IDs)

No database server is required.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | — | Secret for signing JWTs |
| `SPACES_ENDPOINT` | Yes | — | DigitalOcean Spaces endpoint |
| `SPACES_KEY` | Yes | — | Spaces access key |
| `SPACES_SECRET` | Yes | — | Spaces secret key |
| `SPACES_BUCKET` | Yes | — | Spaces bucket name |
| `SPACES_REGION` | Yes | — | Spaces region |
| `APP_URL` | No | `http://localhost:3000` | Frontend URL for CORS |
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3001` | Server port |
| `OPENAI_API_KEY` | No | — | OpenAI API key (enables LLM features) |
| `LLM_ENABLED` | No | `true` | Set to `false` to disable LLM features even with an API key |
| `OPENAI_MODEL` | No | `gpt-4o` | Primary OpenAI model |
| `OPENAI_FALLBACK_MODEL` | No | `gpt-4o-mini` | Fallback model on primary failure |
| `OPENAI_TIMEOUT_MS` | No | `30000` | API request timeout |
| `OPENAI_MAX_RETRIES` | No | `2` | Retries per model before fallback |

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.7 | 2026-03-10 | Version display on login screen and footer; rebuilt client to fix participation link login redirect |
| 1.1.6 | 2026-03-10 | LLM-powered intelligence layer: AI report narratives (OpenAI), consistency coaching for participants, smart validation with "Review My Setup" panel, triad-based inconsistency detection; consolidated respondents into participants; comparisons locked until owner adds themselves as a participant; reduced base font size |
| 1.1.5 | 2026-03-08 | Participant participation via shareable tokenized links, PIN protection, anonymous mode, Kendall's W consensus measurement, multi-round Delphi iteration, WebSocket real-time status, enhanced decision report with consensus analysis, max 12 participants |
| 1.1.4 | 2026-03-08 | Wizard-style comparisons, weighted geometric mean aggregation, decision report generation |
| 1.1.3 | — | Pairwise comparison matrices, sub-criteria support, sensitivity analysis |

## API Endpoints

| Group | Endpoints |
|-------|-----------|
| **Auth** | `POST /api/v1/auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password` |
| **Problems** | `GET/POST /api/v1/problems`, `GET/PUT/DELETE /problems/:id`, `POST /problems/:id/save`, `GET /problems/:id/download`, `POST /problems/upload` |
| **Participants** | `GET/POST /api/v1/problems/:id/participants`, `PUT/DELETE /problems/:id/participants/:pid`, `POST /problems/:id/participants/:pid/regenerate-pin` |
| **Config & Rounds** | `PUT /api/v1/problems/:id/config`, `POST /problems/:id/round/close`, `POST /round/reopen`, `POST /round/new`, `POST /problems/:id/finalize` |
| **Consensus** | `GET /api/v1/problems/:id/consensus`, `GET /problems/:id/rounds` |
| **Participation** | `POST /api/v1/participate/:problemId/:token/verify-pin`, `GET /participate/:problemId/:token`, `PUT /participate/:problemId/:token` |
| **Compute** | `POST /api/v1/compute/priorities`, `POST /compute/consistency`, `POST /compute/synthesize`, `POST /compute/sensitivity`, `POST /compute/aggregate` |
| **Admin** | `GET/POST /api/v1/admin/users`, `PUT/DELETE /admin/users/:id`, `POST /admin/users/:id/unlock`, `POST /admin/users/:id/reset-password` |
| **WebSocket** | `ws://host/ws/problems/:id/status` (admin JWT required) |
| **LLM** | `GET /api/v1/llm/status`, `POST /problems/:id/report/narratives`, `POST /problems/:id/report/narratives/regenerate`, `POST /problems/:id/validate-structure` |
| **Health** | `GET /api/v1/health` |

## Security
- bcryptjs (cost factor 12) password hashing
- JWT with 24h expiry and httpOnly secure cookies
- 3-attempt account lockout
- Participation tokens: UUID v4 (122-bit entropy), scoped to single problem/participant
- PIN protection: bcrypt-hashed 4-digit PINs, 3-attempt lockout with 15-minute cooldown
- Participant session: short-lived JWT (4h) in httpOnly cookie after PIN verification
- HTTPS, CORS, Helmet, rate limiting (60 req/min API, 5 req/15min PIN verification)
- Express `trust proxy` enabled for reverse proxy deployments
- LLM input sanitisation: length limits, control character stripping, prompt injection mitigation via system prompts
- LLM rate controls: 10-second validation cooldown, 3 regenerations per session (1-hour TTL)

---
Copyright 2026 by Dr. Jose Mendoza. All rights reserved.
