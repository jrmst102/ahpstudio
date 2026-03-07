# AHP Studio — Technical Specifications

**Version:** 1.0  
**Date:** March 7, 2026  
**Author:** Dr. Jose Mendoza  
**Copyright 2026 by Dr. Jose Mendoza.**

---

## 1. Executive Summary

AHP Studio is a web-based decision support application that implements the Analytic Hierarchy Process (AHP), the multi-criteria decision-making methodology developed by Dr. Thomas L. Saaty. Designed for graduate-level competitive strategy students, AHP Studio enables users to define decision problems, structure criteria hierarchies, perform pairwise comparisons, compute priority vectors, evaluate consistency, and synthesize final rankings across alternatives — all within a clean, modern interface styled with the official NYU color scheme.

The application draws inspiration from Expert Choice, the commercial AHP software created by Saaty and Ernest Forman in 1983. Like Expert Choice, AHP Studio structures decisions into a hierarchy proceeding from a goal through criteria and sub-criteria down to alternatives, uses pairwise comparisons on Saaty's fundamental scale to derive ratio-level priorities, computes consistency indices, and provides sensitivity analysis with visual feedback. However, AHP Studio is scoped as a focused educational tool rather than an enterprise platform, supporting individual student work with save/load functionality and a maximum of 12 alternatives per problem.

---

## 2. Project Context

**Course:** Graduate-level Competitive Strategy  
**Purpose:** Teach students the AHP decision-making technique through hands-on problem solving  
**Users:** Graduate students and course administrator  
**Deployment:** DigitalOcean cloud infrastructure  
**Source Control:** GitHub  
**Storage:** DigitalOcean Spaces (S3-compatible object storage bucket)

---

## 3. Architecture Overview

### 3.1 System Architecture

AHP Studio follows a three-tier web application architecture:

**Presentation Tier** — A single-page application (SPA) built with React, served as static assets from DigitalOcean. The interface uses the NYU brand color palette and provides all user-facing interactions for problem definition, pairwise comparison, results visualization, and file management.

**Application Tier** — A RESTful API server built with Node.js and Express.js. This tier handles authentication, session management, AHP computations (eigenvector extraction, consistency ratio calculation, synthesis), user management, and file operations. All AHP mathematical logic resides here to ensure computational integrity.

**Data Tier** — A PostgreSQL database hosted on DigitalOcean Managed Databases for user accounts, session data, and metadata. DigitalOcean Spaces (S3-compatible bucket) stores the `.AHP` decision problem files.

### 3.2 High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                      │
│              React SPA (NYU-themed UI)                  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  DigitalOcean Droplet                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Nginx Reverse Proxy (TLS)               │  │
│  └────────────────────────┬──────────────────────────┘  │
│                           ▼                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │        Node.js / Express.js API Server            │  │
│  │  ┌─────────────┐ ┌────────────┐ ┌─────────────┐  │  │
│  │  │ Auth Module  │ │ AHP Engine │ │ File Manager│  │  │
│  │  └──────┬──────┘ └─────┬──────┘ └──────┬──────┘  │  │
│  └─────────┼──────────────┼───────────────┼──────────┘  │
└────────────┼──────────────┼───────────────┼─────────────┘
             │              │               │
             ▼              │               ▼
┌────────────────────┐      │    ┌────────────────────────┐
│ PostgreSQL (Managed│      │    │ DigitalOcean Spaces    │
│ Database)          │      │    │ (S3 Bucket)            │
│ • Users            │      │    │ • .AHP files           │
│ • Sessions         │      │    └────────────────────────┘
│ • Problem metadata │      │
└────────────────────┘      │
                            │
                   (in-memory computation,
                    no persistent storage
                    of matrices)
```

### 3.3 Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| Frontend | React 18+, Tailwind CSS | Component-based SPA with utility-first styling for NYU theme |
| Charts/Visualization | Recharts or D3.js | Interactive bar charts, sensitivity graphs, and hierarchy diagrams |
| HTTP Client | Axios | Promise-based HTTP for API communication |
| Backend | Node.js 20 LTS, Express.js | Lightweight, performant API server with rich npm ecosystem |
| AHP Math | Custom module (mathjs library) | Eigenvector computation, matrix operations, consistency calculations |
| Authentication | bcrypt, JSON Web Tokens (JWT) | Secure password hashing and stateless token-based auth |
| Database | PostgreSQL 16 | Relational data for users, sessions, problem metadata |
| ORM | Prisma | Type-safe database queries and schema migrations |
| Object Storage | DigitalOcean Spaces (S3 API) | `.AHP` file storage via AWS SDK (S3-compatible) |
| Reverse Proxy | Nginx | TLS termination, static file serving, API routing |
| Hosting | DigitalOcean Droplet | Application and Nginx server |
| CI/CD | GitHub Actions | Automated testing, building, and deployment |
| Source Control | GitHub | Repository hosting, pull requests, issue tracking |

---

## 4. AHP Engine Specification

The AHP engine is the mathematical core of the application. It implements the classical AHP methodology as described by Saaty and as implemented in Expert Choice.

### 4.1 Saaty's Fundamental Scale

All pairwise comparisons use Saaty's 1–9 fundamental scale of absolute numbers:

| Intensity | Definition | Explanation |
|---|---|---|
| 1 | Equal importance | Two elements contribute equally to the objective |
| 3 | Moderate importance | Experience and judgment slightly favor one over the other |
| 5 | Strong importance | Experience and judgment strongly favor one over the other |
| 7 | Very strong importance | One element is favored very strongly over the other; dominance demonstrated in practice |
| 9 | Extreme importance | The evidence favoring one over the other is of the highest possible order of affirmation |
| 2, 4, 6, 8 | Intermediate values | Used to represent compromise between the judgments above |
| Reciprocals | If element *i* has a value *a* when compared to element *j*, then *j* has the value 1/*a* when compared to *i* | A logical requirement of the method |

### 4.2 Priority Vector Derivation

The system shall compute priority vectors using the **eigenvector method** (Saaty's original approach):

1. Construct the *n × n* positive reciprocal pairwise comparison matrix **A**, where *a_ij* represents the relative importance of element *i* over element *j*, and *a_ji = 1/a_ij*.
2. Compute the principal eigenvector **w** of matrix **A** corresponding to the largest eigenvalue **λ_max** by solving **Aw = λ_max · w**.
3. Normalize **w** so that its components sum to 1.0, yielding the priority vector.
4. The system shall use the power method (iterative matrix multiplication) for eigenvector approximation, with convergence tolerance of 1×10⁻⁶ and a maximum of 1000 iterations.

### 4.3 Consistency Checking

Following Saaty's methodology and mirroring Expert Choice behavior, the system shall compute and display consistency metrics for every comparison matrix:

**Consistency Index (CI):**  
`CI = (λ_max − n) / (n − 1)`

**Consistency Ratio (CR):**  
`CR = CI / RI`

Where **RI** is the Random Consistency Index for a matrix of order *n*. The system shall use Saaty's standard RI table:

| n | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RI | 0.00 | 0.00 | 0.58 | 0.90 | 1.12 | 1.24 | 1.32 | 1.41 | 1.45 | 1.49 | 1.51 | 1.48 |

**Consistency Thresholds:**

- CR ≤ 0.10 — Acceptable consistency; proceed with analysis.
- CR > 0.10 — Inconsistency warning displayed. The user is prompted to revise judgments but is not blocked from continuing (consistent with Expert Choice behavior where iteration is encouraged).

The CR value shall be displayed in real time as the user enters pairwise comparisons, using green for acceptable (≤ 0.10) and red for inconsistent (> 0.10).

### 4.4 Synthesis

The system shall support **distributive mode** synthesis (default):

1. Compute local priority vectors for criteria with respect to the goal.
2. Compute local priority vectors for alternatives with respect to each criterion.
3. Compute global priorities by multiplying each alternative's local priority by the weight of the corresponding criterion and summing across all criteria.
4. Display both normalized (summing to 1.0) and idealized (best alternative = 1.0) results.

### 4.5 Sensitivity Analysis

Inspired by Expert Choice's four sensitivity analysis modes, the system shall provide:

**Performance Sensitivity Graph** — A stacked/grouped bar chart showing how each alternative performs on every criterion and overall. The user can drag criterion weight bars to interactively adjust weights and observe real-time changes in alternative rankings.

**Dynamic Sensitivity Graph** — Horizontal bars representing criteria weights on the left side with corresponding alternative priority bars on the right. The user drags criteria bars to modify weights; alternative rankings update in real time.

**Gradient Sensitivity Graph** — A line chart showing how alternative priorities change as one selected criterion's weight varies from 0% to 100% (with other criteria rebalanced proportionally). A vertical reference line marks the current weight.

**Head-to-Head Sensitivity** — A comparison view showing two selected alternatives side by side, displaying which criteria favor each alternative and by how much.

### 4.6 Problem Constraints

| Parameter | Limit |
|---|---|
| Maximum alternatives per problem | 12 |
| Maximum criteria (first level) | 10 |
| Maximum sub-criteria per criterion | 7 |
| Maximum hierarchy depth | 3 levels (Goal → Criteria → Sub-criteria) |
| Pairwise comparison scale | 1/9 to 9 (Saaty's scale) |
| Active problems per user | 1 (users may save/load to work on different problems) |

---

## 5. Decision Problem File Format (.AHP)

### 5.1 Format Specification

Decision problems are persisted as `.AHP` files using JSON encoding. The file extension `.AHP` is mandatory for all saved decision problem files.

### 5.2 File Schema

```json
{
  "ahpStudio": {
    "version": "1.0",
    "fileFormat": "AHP",
    "createdAt": "2026-03-07T14:30:00Z",
    "modifiedAt": "2026-03-07T15:45:00Z",
    "author": "student_username"
  },
  "problem": {
    "title": "Best Market Entry Strategy",
    "description": "Evaluating market entry strategies for Southeast Asia expansion",
    "goal": "Select the optimal market entry strategy"
  },
  "criteria": [
    {
      "id": "c1",
      "name": "Cost",
      "description": "Total investment required",
      "subCriteria": [
        {
          "id": "c1-s1",
          "name": "Initial Investment",
          "description": ""
        },
        {
          "id": "c1-s2",
          "name": "Operating Costs",
          "description": ""
        }
      ]
    },
    {
      "id": "c2",
      "name": "Risk",
      "description": "Overall risk exposure",
      "subCriteria": []
    }
  ],
  "alternatives": [
    {
      "id": "a1",
      "name": "Joint Venture",
      "description": ""
    },
    {
      "id": "a2",
      "name": "Wholly Owned Subsidiary",
      "description": ""
    }
  ],
  "comparisons": {
    "criteria": {
      "pairwise": [
        { "row": "c1", "col": "c2", "value": 3 }
      ]
    },
    "subCriteria": {
      "c1": {
        "pairwise": [
          { "row": "c1-s1", "col": "c1-s2", "value": 5 }
        ]
      }
    },
    "alternatives": {
      "c1-s1": {
        "pairwise": [
          { "row": "a1", "col": "a2", "value": 0.333 }
        ]
      }
    }
  },
  "results": {
    "criteriaWeights": { "c1": 0.75, "c2": 0.25 },
    "alternativeScores": { "a1": 0.58, "a2": 0.42 },
    "consistencyRatios": {
      "criteria": 0.00,
      "c1-subCriteria": 0.00,
      "c1-s1-alternatives": 0.02
    }
  }
}
```

### 5.3 File Operations

| Operation | Description |
|---|---|
| Save | Serializes the current decision problem state to a `.AHP` JSON file and uploads to DigitalOcean Spaces under the user's namespace (`/users/{user_id}/problems/`) |
| Load | Retrieves a `.AHP` file from Spaces, deserializes it, and restores the full problem state in the application |
| Download | Exports the `.AHP` file to the user's local machine |
| Upload | Imports a local `.AHP` file into the application (validated against the schema before loading) |
| Delete | Removes the `.AHP` file from Spaces and deletes associated metadata from the database |

---

## 6. Authentication and Security

### 6.1 User Authentication

The system uses username/password authentication with JWT-based session management.

**Login Flow:**

1. User submits username and password via the login form.
2. Server retrieves the user record from PostgreSQL.
3. Server compares the submitted password against the stored bcrypt hash (cost factor 12).
4. On success, the server issues a signed JWT (HS256 algorithm) with a 24-hour expiration, containing the user ID, username, and role.
5. The JWT is stored in an httpOnly, secure, SameSite cookie.
6. Subsequent API requests include the cookie automatically; the server validates the JWT on each request.

**Password Requirements:**

- Minimum 8 characters
- At least one uppercase letter, one lowercase letter, one digit, and one special character

### 6.2 Account Lockout Policy

To prevent brute-force attacks, the system enforces the following lockout policy:

- The server tracks consecutive failed login attempts per username in the database.
- After **3 consecutive failed attempts**, the account is locked.
- A locked account displays the message: *"Your account has been locked due to multiple failed login attempts. Please contact your administrator."*
- Only an administrator can unlock a locked account via the Admin User Management page.
- Successful login resets the failed attempt counter to zero.

**Database fields for lockout:**

| Column | Type | Description |
|---|---|---|
| `failed_attempts` | INTEGER | Counter of consecutive failed logins (default 0) |
| `is_locked` | BOOLEAN | Whether the account is currently locked (default false) |
| `locked_at` | TIMESTAMP | When the lockout was triggered |

### 6.3 Role-Based Access Control

| Role | Permissions |
|---|---|
| **admin** | Full access: user management (create, edit, delete, unlock accounts), view all users, reset passwords, and all student capabilities |
| **student** | Create, edit, save, load, delete own decision problems; change own password; download/upload `.AHP` files |

### 6.4 Security Measures

- All traffic over HTTPS (TLS 1.2+) via Nginx with Let's Encrypt certificates.
- Passwords hashed with bcrypt (cost factor 12); plaintext passwords never stored or logged.
- JWT tokens signed with a server-side secret; expiration set to 24 hours.
- CORS policy restricted to the application's domain.
- Rate limiting on login endpoint (10 requests per minute per IP) to complement the account lockout.
- Input validation and sanitization on all API endpoints.
- Parameterized database queries (via Prisma ORM) to prevent SQL injection.
- HTTP security headers configured via Nginx (X-Content-Type-Options, X-Frame-Options, Content-Security-Policy, Strict-Transport-Security).

---

## 7. User Interface Specification

### 7.1 NYU Color Scheme

The interface shall use the official NYU brand colors as its primary palette:

| Color Name | Hex Code | Usage |
|---|---|---|
| NYU Violet (Primary) | `#57068C` | Primary buttons, active states, sidebar background, header, links |
| Ultra Violet | `#330662` | Dark accents, hover states, header gradient endpoint |
| Medium Violet | `#702B9D` | Secondary buttons, active tab highlights |
| Light Violet 1 | `#AB82C5` | Subtle accents, disabled states, borders |
| Light Violet 2 | `#EEE6F3` | Page backgrounds, card backgrounds, table striping |
| Black | `#000000` | Primary text |
| Dark Gray | `#404040` | Secondary text, labels |
| Medium Gray | `#6D6D6D` | Placeholder text, helper text, borders |
| White | `#FFFFFF` | Card backgrounds, input fields, contrast text on violet backgrounds |
| Success Green | `#2E7D32` | CR ≤ 0.10 indicators, success messages |
| Warning Red | `#C62828` | CR > 0.10 indicators, error messages, destructive actions |

**Typography:** The application shall use Montserrat (Google Fonts) as the primary typeface — a geometric sans-serif that complements NYU's visual identity and is freely available as a web font. Fallback: Verdana, sans-serif (NYU's recommended fallback).

### 7.2 Page Structure and Navigation

The application consists of the following pages/views:

**Public Pages (unauthenticated):**

1. **Login Page** — Username and password fields, login button, application branding, and copyright notice.

**Student Pages (authenticated, role: student):**

2. **Dashboard** — Landing page after login. Shows the current active decision problem (if any) with a summary card, or a prompt to create a new problem. Provides buttons for New Problem, Load Problem, and a file upload area. Lists saved `.AHP` files with options to load or delete.

3. **Problem Editor** — The core workspace, organized as a step-by-step workflow with a sidebar or tab navigation. Contains the following sub-views:

   - **3a. Problem Definition** — Input fields for problem title, description, and goal statement.
   
   - **3b. Criteria Manager** — Add, edit, and remove criteria and sub-criteria. Displays the hierarchy as an interactive tree diagram (collapsible nodes). Maximum 10 first-level criteria; maximum 7 sub-criteria per criterion. Drag-and-drop reordering support.
   
   - **3c. Alternatives Manager** — Add, edit, and remove alternatives. List view with descriptions. Counter showing current count vs. maximum (e.g., "4 / 12 alternatives"). Enforces the 12-alternative maximum.
   
   - **3d. Pairwise Comparisons** — Presents comparison matrices for: criteria vs. criteria (with respect to the goal), sub-criteria vs. sub-criteria (with respect to their parent criterion), and alternatives vs. alternatives (with respect to each lowest-level criterion). Each comparison is presented as a slider interface (1/9 to 9) with verbal labels from Saaty's scale, mirroring Expert Choice's comparison input approach. The comparison matrix is displayed alongside the slider with real-time updates. The consistency ratio (CR) is shown below each matrix with color-coded feedback.
   
   - **3e. Results** — Displays the synthesized global priorities as a horizontal or vertical bar chart. Shows a ranked table of alternatives with normalized and idealized scores. Provides a "by criterion" breakdown view.
   
   - **3f. Sensitivity Analysis** — The four sensitivity analysis views described in Section 4.5 (Performance, Dynamic, Gradient, Head-to-Head), selectable via tabs. Interactive controls for adjusting weights with real-time recalculation.

4. **Account Settings** — Change password form.

**Admin Pages (authenticated, role: admin):**

5. **User Management** — Accessible only to administrators. Provides a data table of all user accounts with columns for username, full name, email, role, account status (active/locked), last login timestamp, and created date. Supports the following operations:

   - **Create User** — Form with fields for username, full name, email, temporary password, and role assignment (student or admin).
   - **Edit User** — Modify full name, email, and role.
   - **Reset Password** — Generate or set a new temporary password for a user.
   - **Unlock Account** — Clear the lockout state and reset the failed attempts counter.
   - **Delete User** — Remove user account and all associated `.AHP` files from Spaces (with confirmation dialog).
   - **Search and Filter** — Search by username or name; filter by role or account status.

### 7.3 Wireframe Descriptions

**Login Page:**  
Centered card on a light violet (`#EEE6F3`) background. The card contains the AHP Studio logo/title at the top in NYU Violet, username and password input fields, a "Sign In" button in NYU Violet, and the copyright line at the bottom: *"Copyright 2026 by Dr. Jose Mendoza."*

**Dashboard:**  
Top navigation bar in NYU Violet with the application title "AHP Studio" on the left, user greeting and logout button on the right. Main content area with a welcome message, a large "New Problem" action card, a "Load Problem" card, and a list of saved files below.

**Problem Editor:**  
Left sidebar navigation with icons and labels for each step (Definition, Criteria, Alternatives, Comparisons, Results, Sensitivity). The active step is highlighted in Medium Violet. The main content area changes based on the selected step. A toolbar at the top of the content area provides Save and Download buttons. A breadcrumb trail shows the current position in the hierarchy during comparisons.

**Pairwise Comparison View:**  
The comparison question is displayed as a sentence: *"With respect to [parent element], which is more important: [Element A] or [Element B], and by how much?"* A horizontal slider ranges from 9 (strongly favor A) through 1 (equal) to 9 (strongly favor B), with Saaty's verbal labels above. The full comparison matrix is shown below the slider in a compact table format, updating in real time. The consistency ratio is displayed prominently at the bottom of the matrix.

**Admin User Management:**  
Same top navigation as the Dashboard. The main content area contains a search/filter bar at the top, a data table of users in the center, and a floating action button or top-right button for "Add User." Row actions (edit, reset password, unlock, delete) are accessible via an actions menu on each row.

### 7.4 Responsive Design

The application shall be responsive and functional on screens from 1024px width and above (laptop/desktop). Tablet and mobile layouts are not required for this version but the design should use flexible layouts that do not break on smaller screens.

### 7.5 Footer

Every page shall display the following copyright notice in the footer area:

> **Copyright 2026 by Dr. Jose Mendoza.**

---

## 8. API Specification

### 8.1 Base URL

`https://ahpstudio.{domain}/api/v1`

### 8.2 Authentication Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Authenticate user, return JWT cookie |
| POST | `/auth/logout` | Clear JWT cookie |
| GET | `/auth/me` | Return current authenticated user info |

### 8.3 Problem Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/problems` | Create a new decision problem |
| GET | `/problems` | List all problems for the authenticated user |
| GET | `/problems/:id` | Retrieve a specific problem by ID |
| PUT | `/problems/:id` | Update an existing problem |
| DELETE | `/problems/:id` | Delete a problem and its `.AHP` file |
| POST | `/problems/:id/save` | Serialize current state and upload `.AHP` to Spaces |
| GET | `/problems/:id/download` | Download the `.AHP` file |
| POST | `/problems/upload` | Upload and import a `.AHP` file |

### 8.4 AHP Computation Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/compute/priorities` | Compute priority vector from a pairwise comparison matrix |
| POST | `/compute/consistency` | Compute CI, CR for a given comparison matrix |
| POST | `/compute/synthesize` | Compute global alternative rankings for the full problem |
| POST | `/compute/sensitivity` | Compute sensitivity analysis data for a given criterion |

### 8.5 Admin Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/users` | List all users (admin only) |
| POST | `/admin/users` | Create a new user (admin only) |
| PUT | `/admin/users/:id` | Update a user (admin only) |
| DELETE | `/admin/users/:id` | Delete a user and associated data (admin only) |
| POST | `/admin/users/:id/unlock` | Unlock a locked account (admin only) |
| POST | `/admin/users/:id/reset-password` | Reset a user's password (admin only) |

---

## 9. Database Schema

### 9.1 Entity-Relationship Summary

```
┌──────────────┐       1:N       ┌──────────────────┐
│    users      │───────────────▶│    problems       │
│              │                 │                  │
│ id (PK)      │                 │ id (PK)          │
│ username     │                 │ user_id (FK)     │
│ email        │                 │ title            │
│ password_hash│                 │ description      │
│ full_name    │                 │ file_key         │
│ role         │                 │ created_at       │
│ failed_attempts│               │ updated_at       │
│ is_locked    │                 └──────────────────┘
│ locked_at    │
│ created_at   │
│ updated_at   │
│ last_login_at│
└──────────────┘
```

### 9.2 Users Table

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'student'
                    CHECK (role IN ('admin', 'student')),
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    is_locked       BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at       TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at   TIMESTAMP WITH TIME ZONE
);
```

### 9.3 Problems Table

```sql
CREATE TABLE problems (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    file_key        VARCHAR(500) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 10. Infrastructure and Deployment

### 10.1 DigitalOcean Resources

| Resource | Specification | Purpose |
|---|---|---|
| Droplet | 2 vCPU, 4 GB RAM, 80 GB SSD (Regular) | Application server (Node.js + Nginx) |
| Managed Database | PostgreSQL 16, 1 vCPU, 1 GB RAM | User accounts, problem metadata |
| Spaces | Single bucket, `ahpstudio-files` | `.AHP` file storage |
| Domain + DNS | DigitalOcean DNS management | Custom domain configuration |
| Floating IP | Static IP | Persistent public address |

### 10.2 Spaces Bucket Structure

```
ahpstudio-files/
├── users/
│   ├── {user_id}/
│   │   ├── problems/
│   │   │   ├── {problem_id}.AHP
│   │   │   └── {problem_id}.AHP
│   │   └── ...
│   └── ...
```

### 10.3 Deployment Pipeline (GitHub Actions)

```yaml
# Triggered on push to main branch
name: Deploy AHP Studio

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to DigitalOcean Droplet
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DO_HOST }}
          username: ${{ secrets.DO_USER }}
          key: ${{ secrets.DO_SSH_KEY }}
          script: |
            cd /var/www/ahpstudio
            git pull origin main
            npm ci --production
            npm run build
            pm2 restart ahpstudio
```

### 10.4 Environment Variables

```
# Server
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@db-host:25060/ahpstudio?sslmode=require

# JWT
JWT_SECRET=<random-256-bit-key>
JWT_EXPIRATION=24h

# DigitalOcean Spaces
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
SPACES_BUCKET=ahpstudio-files
SPACES_KEY=<access-key>
SPACES_SECRET=<secret-key>
SPACES_REGION=nyc3

# App
APP_URL=https://ahpstudio.yourdomain.com
```

---

## 11. GitHub Repository Structure

```
ahpstudio/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── client/                     # React frontend
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── LoginForm.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   └── ProblemCard.jsx
│   │   │   ├── editor/
│   │   │   │   ├── ProblemDefinition.jsx
│   │   │   │   ├── CriteriaManager.jsx
│   │   │   │   ├── AlternativesManager.jsx
│   │   │   │   ├── PairwiseComparison.jsx
│   │   │   │   ├── ComparisonSlider.jsx
│   │   │   │   ├── ComparisonMatrix.jsx
│   │   │   │   ├── Results.jsx
│   │   │   │   └── SensitivityAnalysis.jsx
│   │   │   ├── admin/
│   │   │   │   ├── UserManagement.jsx
│   │   │   │   ├── UserForm.jsx
│   │   │   │   └── UserTable.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   └── common/
│   │   │       ├── Button.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── Alert.jsx
│   │   │       └── FileUpload.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useProblem.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ProblemContext.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── problemService.js
│   │   │   └── computeService.js
│   │   ├── utils/
│   │   │   └── constants.js
│   │   ├── styles/
│   │   │   └── nyu-theme.css
│   │   ├── App.jsx
│   │   └── index.js
│   ├── tailwind.config.js
│   └── package.json
├── server/                     # Node.js backend
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── problemController.js
│   │   │   ├── computeController.js
│   │   │   └── adminController.js
│   │   ├── middleware/
│   │   │   ├── authenticate.js
│   │   │   ├── authorize.js
│   │   │   ├── rateLimiter.js
│   │   │   └── validate.js
│   │   ├── models/
│   │   │   └── (Prisma schema)
│   │   ├── services/
│   │   │   ├── ahpEngine.js
│   │   │   ├── storageService.js
│   │   │   └── userService.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── problemRoutes.js
│   │   │   ├── computeRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── utils/
│   │   │   ├── matrix.js
│   │   │   └── validators.js
│   │   └── app.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── tests/
│   │   ├── ahpEngine.test.js
│   │   ├── auth.test.js
│   │   └── api.test.js
│   └── package.json
├── nginx/
│   └── ahpstudio.conf
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

---

## 12. Testing Strategy

### 12.1 AHP Engine Unit Tests

The AHP engine is the most critical component and requires rigorous testing against known results:

- **Eigenvector accuracy:** Test against published AHP examples with known priority vectors (tolerance ≤ 0.001).
- **Consistency ratio:** Verify CR calculations for perfectly consistent matrices (CR = 0), mildly inconsistent matrices (CR < 0.10), and clearly inconsistent matrices (CR > 0.10).
- **Reciprocal enforcement:** Confirm that setting *a_ij* automatically sets *a_ji = 1/a_ij*.
- **Edge cases:** Single-criterion problems, two-alternative problems, matrices at the maximum dimension (12×12), and identity matrices.
- **Synthesis:** End-to-end synthesis tests verifying that global priorities sum to 1.0 and match hand-calculated results.

### 12.2 API Integration Tests

- Authentication flow: login, lockout after 3 failures, unlock, JWT expiration.
- CRUD operations on problems and users.
- Authorization: verify that students cannot access admin endpoints and users cannot access other users' problems.
- File upload/download with schema validation.

### 12.3 Frontend Tests

- Component rendering tests (React Testing Library).
- Slider interaction and matrix update verification.
- Form validation (problem definition, user creation).
- Navigation and route protection tests.

---

## 13. Initial Data and Seed Configuration

The database shall be seeded with:

| Username | Full Name | Role | Password |
|---|---|---|---|
| `admin` | System Administrator | admin | `AHPAdmin2026!` (must be changed on first login) |

The admin account is used to create all student accounts before the course begins. There is no self-registration; all accounts are provisioned by the administrator.

---

## 14. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| **Availability** | 99.5% uptime during the academic semester |
| **Response Time** | Page loads < 2 seconds; AHP computations < 500ms for matrices up to 12×12 |
| **Concurrent Users** | Support up to 50 simultaneous users |
| **Browser Support** | Chrome 100+, Firefox 100+, Safari 16+, Edge 100+ |
| **Accessibility** | WCAG 2.1 Level AA compliance for core workflows |
| **Backup** | Automated daily database backups via DigitalOcean Managed Database; weekly Spaces bucket versioning |
| **Logging** | Structured JSON logging for API requests, authentication events, and errors |
| **Monitoring** | DigitalOcean Monitoring alerts for CPU > 80%, memory > 85%, disk > 90% |

---

## 15. Future Enhancements (Out of Scope for v1.0)

The following features are noted for potential future versions but are explicitly excluded from this release:

- **Group decision-making** — Multiple users collaborating on the same problem with consensus mechanisms (as in Expert Choice Comparion).
- **ANP (Analytic Network Process)** — Support for network models with dependencies and feedback loops.
- **Resource allocation optimization** — Budget allocation based on AHP-derived priorities subject to constraints.
- **Export to PDF/PowerPoint** — Generating presentation-ready reports of the analysis.
- **Real-time collaboration** — WebSocket-based simultaneous editing.
- **Mobile-optimized interface** — Dedicated tablet and phone layouts.
- **LTI integration** — Direct integration with university Learning Management Systems (Canvas, Blackboard).

---

## 16. Glossary

| Term | Definition |
|---|---|
| **AHP** | Analytic Hierarchy Process — a structured technique for organizing and analyzing complex decisions, developed by Thomas L. Saaty |
| **Pairwise Comparison** | The process of comparing two elements at a time to determine their relative importance on Saaty's 1–9 scale |
| **Priority Vector** | The normalized eigenvector derived from a pairwise comparison matrix, representing the relative weights of compared elements |
| **Consistency Index (CI)** | A measure of how logically consistent a set of pairwise comparisons is, calculated as (λ_max − n) / (n − 1) |
| **Consistency Ratio (CR)** | The ratio of CI to the Random Consistency Index (RI); values ≤ 0.10 indicate acceptable consistency |
| **Random Consistency Index (RI)** | The average CI value obtained from large samples of randomly generated reciprocal matrices of the same order |
| **Synthesis** | The process of combining local priorities across all levels of the hierarchy to obtain global priority rankings of alternatives |
| **Sensitivity Analysis** | The examination of how changes in criteria weights affect the final ranking of alternatives |
| **Eigenvector** | The principal right eigenvector of the comparison matrix, used to derive priorities in AHP |
| **λ_max** | The largest eigenvalue of the comparison matrix; for a perfectly consistent matrix, λ_max equals the matrix dimension *n* |

---

*Copyright 2026 by Dr. Jose Mendoza.*
