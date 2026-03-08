# AHP Studio

**Version:** 1.1.3  
**Author:** Dr. Jose Mendoza  
**Copyright 2026 by Dr. Jose Mendoza.**

## Overview
AHP Studio is a web-based decision support application implementing the Analytic Hierarchy Process (AHP). It enables structured multi-criteria decision making through pairwise comparisons, priority computation, consistency analysis, and sensitivity analysis — all from a modern browser interface.

**Live:** [https://squid-app-owz3p.ondigitalocean.app](https://squid-app-owz3p.ondigitalocean.app)

## Features
- **Decision Problem Management** — Create, save, load, delete, and import/export `.AHP` files
- **Criteria & Sub-criteria** — Add up to 10 criteria, each with up to 6 sub-criteria for hierarchical structuring
- **Alternatives Management** — Add up to 12 alternatives per problem
- **Pairwise Comparisons** — Interactive slider-based comparison matrices using Saaty's 1–9 scale with directional indicators (row ◀ / ▶ column)
- **Priority Computation** — Eigenvector method with automatic consistency ratio (CR) checking
- **Global Synthesis** — Normalized and idealized global priority rankings with sub-criteria weight aggregation
- **Sensitivity Analysis** — Vary criterion weights to detect rank reversals
- **Local File Save** — Save `.AHP` files directly to your computer; upload them to resume later
- **User Management** — Admin panel for user CRUD, account unlock, password reset
- **Authentication** — JWT with httpOnly cookies, bcryptjs hashing, 3-attempt account lockout
- **Information Pages** — About, What is AHP?, AHP in the Age of GenAI, Help, Terms and Conditions, Privacy Policy

## Technology Stack
- **Backend:** Node.js, Express.js 4.18, JWT, bcryptjs
- **Frontend:** React 18, Tailwind CSS, Axios
- **Storage:** DigitalOcean Spaces (@aws-sdk/client-s3 v3) — no database required
- **Hosting:** DigitalOcean App Platform
- **Computation:** mathjs (eigenvector, consistency metrics)

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
3. Build command: `npm run build` (client is pre-built and committed; server deps installed by `npm ci`)
4. Run command: `npm start` (runs `node server/src/app.js`)

## Data Storage
All data is stored in DigitalOcean Spaces (S3-compatible):
- **Users:** `data/users.json`
- **Problem metadata:** `users/{userId}/problems/index.json`
- **Problem data:** `users/{userId}/problems/{problemId}.AHP`

No database server is required.

## API Endpoints

| Group | Endpoints |
|-------|-----------|
| **Auth** | `POST /api/v1/auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password` |
| **Problems** | `GET/POST /api/v1/problems`, `GET/PUT/DELETE /problems/:id`, `POST /problems/:id/save`, `GET /problems/:id/download`, `POST /problems/upload` |
| **Compute** | `POST /api/v1/compute/priorities`, `POST /compute/consistency`, `POST /compute/synthesize`, `POST /compute/sensitivity` |
| **Admin** | `GET/POST /api/v1/admin/users`, `PUT/DELETE /admin/users/:id`, `POST /admin/users/:id/unlock`, `POST /admin/users/:id/reset-password` |
| **Health** | `GET /api/v1/health` |

## Security
- bcryptjs (cost factor 12) password hashing
- JWT with 24h expiry and httpOnly secure cookies
- 3-attempt account lockout
- HTTPS, CORS, Helmet, rate limiting
- Express `trust proxy` enabled for reverse proxy deployments

---
Copyright 2026 by Dr. Jose Mendoza. All rights reserved.
