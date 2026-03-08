# User Management Module — Specifications & Requirements

---

## 1. Project Overview

### 1.1 Purpose
The User Management Module is a standalone, reusable component that provides full user lifecycle management through a graphical interface. It is designed to be integrated into the Dynamic Pricing Sandbox and any future web-based projects requiring authentication and user administration.

### 1.2 Design Philosophy
The module is built as an independent package with no coupling to any specific host application. It exposes a clean API and a self-contained admin GUI, allowing any project to import it, configure a database connection, and immediately gain complete user management capabilities.

### 1.3 Key Principles
- **Reusability**: One codebase serves multiple projects. Configuration is handled through environment variables and an initialization function, not hard-coded values.
- **Separation of concerns**: The module owns its own database tables, API routes, and admin interface. Host applications interact with it through a documented public API.
- **Security first**: Passwords are never stored in plaintext. Sessions are token-based. All sensitive operations are logged.

---

## 2. Infrastructure & Hosting

### 2.1 Development Platform

| Concern | Platform | Details |
|---------|----------|---------|
| Source control | GitHub | Dedicated repository (e.g., `github.com/<org>/user-management-module`) |
| Branching strategy | GitHub Flow | `main` (stable), feature branches, pull requests with review |
| Package distribution | GitHub Packages or npm | Published as a scoped package (e.g., `@<org>/user-management`) for installation via npm |
| CI/CD | GitHub Actions | Automated linting, tests, and publishing on merge to `main` |

### 2.2 Storage & Hosting (DigitalOcean)

| Resource | DigitalOcean Service | Purpose |
|----------|---------------------|---------|
| Database | Managed PostgreSQL | Persistent storage for user accounts, audit logs, and session data |
| Application hosting | App Platform or Droplet | Hosts the API server and admin GUI (when deployed standalone) |
| Object storage | Spaces (optional) | Profile images or file attachments in future iterations |

### 2.3 Environment Configuration

The module requires the following environment variables to be set by the host application or deployment environment:

```
# Database
UMM_DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require

# Security
UMM_JWT_SECRET=<random-256-bit-key>
UMM_PASSWORD_SALT_ROUNDS=12
UMM_SESSION_EXPIRY_HOURS=24

# Defaults
UMM_ACCOUNT_EXPIRY_DAYS=120

# Optional
UMM_SMTP_HOST=<mail-server>
UMM_SMTP_PORT=587
UMM_SMTP_USER=<email>
UMM_SMTP_PASS=<password>
UMM_ADMIN_EMAIL=<admin-notification-address>
```

---

## 3. Data Model

### 3.1 Users Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key, auto-generated | Unique internal identifier |
| `username` | VARCHAR(64) | Unique, not null, indexed | Login handle; must be unique across the system |
| `first_name` | VARCHAR(100) | Not null | User's first name |
| `last_name` | VARCHAR(100) | Not null | User's last name |
| `email` | VARCHAR(255) | Unique, not null, indexed | Contact email; used for password reset flows |
| `password_hash` | VARCHAR(255) | Not null | Bcrypt-hashed password; plaintext is never stored |
| `university_org` | VARCHAR(255) | Not null | University or organization affiliation |
| `status` | ENUM | Not null, default `active` | One of: `active`, `expired`, `locked` |
| `expires_at` | TIMESTAMP | Not null | Account expiration date; set to creation date + 120 days by default |
| `created_at` | TIMESTAMP | Not null, default `now()` | Record creation timestamp |
| `updated_at` | TIMESTAMP | Not null, auto-updated | Last modification timestamp |
| `locked_at` | TIMESTAMP | Nullable | Timestamp when the account was locked; null if not locked |
| `locked_by` | UUID | Nullable, foreign key → users.id | Admin who locked the account |
| `last_login_at` | TIMESTAMP | Nullable | Timestamp of the user's most recent successful login |

### 3.2 Auth Log Table

Every login attempt and logout action is recorded. This table is append-only; records are never updated or deleted.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | Primary key | Auto-incrementing log entry ID |
| `user_id` | UUID | Foreign key → users.id, indexed | The user associated with the event |
| `event_type` | ENUM | Not null | One of: `login_success`, `login_failure`, `logout`, `password_reset`, `account_locked`, `account_unlocked` |
| `ip_address` | INET | Nullable | Client IP address at the time of the event |
| `user_agent` | TEXT | Nullable | Browser or client user-agent string |
| `metadata` | JSONB | Nullable | Additional context (e.g., failure reason, admin who performed action) |
| `created_at` | TIMESTAMP | Not null, default `now()` | Event timestamp |

### 3.3 Sessions Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | Session identifier |
| `user_id` | UUID | Foreign key → users.id, indexed | Owner of the session |
| `token_hash` | VARCHAR(255) | Unique, not null | SHA-256 hash of the JWT; the raw token is never stored |
| `expires_at` | TIMESTAMP | Not null | Session expiration (default: 24 hours from creation) |
| `created_at` | TIMESTAMP | Not null, default `now()` | Session creation timestamp |
| `revoked_at` | TIMESTAMP | Nullable | Set when the session is explicitly terminated |

### 3.4 Entity-Relationship Summary

```
┌──────────────┐       ┌──────────────────┐
│    users      │──1:N──│    auth_log       │
│              │       │                  │
│  id (PK)     │       │  user_id (FK)    │
│  username     │       │  event_type      │
│  first_name   │       │  ip_address      │
│  last_name    │       │  created_at      │
│  email        │       └──────────────────┘
│  password_hash│
│  university_org│      ┌──────────────────┐
│  status       │──1:N──│    sessions       │
│  expires_at   │       │                  │
│  created_at   │       │  user_id (FK)    │
│  updated_at   │       │  token_hash      │
└──────────────┘       │  expires_at      │
                        └──────────────────┘
```

---

## 4. Functional Requirements

### 4.1 User CRUD Operations

#### 4.1.1 Add User
- **Actor**: Administrator
- **Inputs**: username, first name, last name, email, password, university/organization
- **Behavior**:
  - Validate that `username` and `email` are unique across the system.
  - Validate password meets complexity requirements (see §5.2).
  - Hash the password using bcrypt with the configured salt rounds.
  - Set `status` to `active`.
  - Set `expires_at` to current timestamp + 120 days (configurable via `UMM_ACCOUNT_EXPIRY_DAYS`).
  - Insert the record and return the created user (excluding `password_hash`).
- **Error cases**: Duplicate username → 409 Conflict. Duplicate email → 409 Conflict. Weak password → 422 Unprocessable Entity.

#### 4.1.2 Edit User
- **Actor**: Administrator
- **Inputs**: Any combination of first name, last name, email, university/organization, expires_at
- **Behavior**:
  - Partial updates are supported; only provided fields are modified.
  - If `email` is changed, uniqueness is re-validated.
  - `username` is immutable after creation.
  - `updated_at` is set automatically.
- **Error cases**: Email conflict → 409. User not found → 404.

#### 4.1.3 Remove User
- **Actor**: Administrator
- **Behavior**:
  - Soft delete is the default: the user's status is set to `locked` and all active sessions are revoked.
  - Hard delete (permanent removal of the database record) is available as a separate, confirmation-gated action.
  - Auth log entries are retained even after hard delete (the `user_id` foreign key is set to `ON DELETE SET NULL`).
- **Error cases**: User not found → 404.

#### 4.1.4 Password Reset
- **Actor**: Administrator (forced reset) or User (self-service)
- **Admin-initiated flow**:
  - Generates a temporary password or a time-limited reset token.
  - Sets a flag requiring the user to change their password on next login.
  - Logs a `password_reset` event in the auth log.
- **Self-service flow** (if SMTP is configured):
  - User requests a reset via email.
  - A single-use, time-limited (1 hour) reset link is sent to the registered email.
  - On submission, the new password is validated and hashed.
  - All existing sessions for the user are revoked.

#### 4.1.5 Lock User
- **Actor**: Administrator
- **Behavior**:
  - Sets `status` to `locked`.
  - Records `locked_at` timestamp and `locked_by` admin ID.
  - Revokes all active sessions for the user.
  - Logs an `account_locked` event.
- **Effect**: Locked users cannot log in. Existing sessions return 401 on next request.

#### 4.1.6 Unlock User
- **Actor**: Administrator
- **Behavior**:
  - Sets `status` to `active`.
  - Clears `locked_at` and `locked_by`.
  - If the account is expired (`expires_at` < now), the admin is prompted to also extend the expiration date.
  - Logs an `account_unlocked` event.

### 4.2 Account Expiration

- A scheduled job (cron or application-level timer) runs daily and transitions any account where `expires_at` < current timestamp from `active` to `expired`.
- Expired accounts cannot log in.
- Administrators can extend the expiration date via the Edit User function, which returns the account to `active` status if the new date is in the future.
- A dashboard widget shows accounts expiring within the next 14 days as an early warning.

### 4.3 Authentication

#### 4.3.1 Login
- **Inputs**: username, password
- **Behavior**:
  - Look up the user by `username`.
  - Compare the provided password against `password_hash` using bcrypt.
  - If the account status is `locked` or `expired`, reject with a descriptive error.
  - On success: create a session, issue a JWT, log a `login_success` event with IP and user agent.
  - On failure: log a `login_failure` event. After 5 consecutive failures within 15 minutes, automatically lock the account.
- **Response**: JWT token (in an HTTP-only cookie or Authorization header, depending on integration mode).

#### 4.3.2 Logout
- **Behavior**:
  - Revoke the current session (set `revoked_at`).
  - Log a `logout` event.
  - Clear the client-side token.

### 4.4 Login/Logout Audit Log

- All events described in §3.2 are recorded automatically.
- The admin GUI provides a searchable, filterable log viewer with the following capabilities:
  - Filter by user, event type, date range, and IP address.
  - Sort by timestamp (ascending/descending).
  - Export as CSV.
- Log entries are immutable. There is no edit or delete functionality for audit records.

---

## 5. Security Requirements

### 5.1 Password Storage
- All passwords are hashed using bcrypt with a minimum cost factor of 12.
- Plaintext passwords are never written to logs, database fields, API responses, or error messages.

### 5.2 Password Complexity Policy
- Minimum 10 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (`!@#$%^&*()-_+=`)
- Cannot match the username or email address

### 5.3 Token Security
- JWTs are signed with HS256 using the `UMM_JWT_SECRET`.
- Token payload includes: `user_id`, `session_id`, `issued_at`, `expires_at`.
- Token payload never includes the password or password hash.
- Session tokens are stored in the database as SHA-256 hashes, not in plaintext.

### 5.4 Rate Limiting
- Login endpoint: Maximum 10 requests per minute per IP address.
- Password reset endpoint: Maximum 3 requests per hour per email address.

### 5.5 Automatic Account Locking
- 5 consecutive failed login attempts within a 15-minute window automatically sets the account status to `locked`.
- An `account_locked` event is logged with metadata indicating the trigger was automatic.
- Only an administrator can unlock a locked account.

### 5.6 Transport Security
- All API communication must occur over HTTPS in production.
- Database connections must use SSL (`sslmode=require`).

---

## 6. Admin GUI Requirements

### 6.1 Overview

The admin GUI is a browser-based interface that allows administrators to perform all user management operations without direct database or API access. It is served as part of the module and accessible at a configurable route prefix (default: `/admin/users`).

### 6.2 Screens

#### 6.2.1 User List (Dashboard)
- **Layout**: Data table with sortable columns
- **Columns**: Username, Full Name, Email, Organization, Status (badge), Expires At, Last Login
- **Features**:
  - Search bar: filters across username, name, and email
  - Status filter: dropdown to filter by `active`, `expired`, `locked`, or all
  - Bulk actions: Lock selected, Unlock selected
  - Pagination: 25 users per page, with page navigation
  - Expiration warning: rows for accounts expiring within 14 days are highlighted
  - "Add User" button in the top-right corner

#### 6.2.2 Add User Form
- **Fields**: Username, First Name, Last Name, Email, Password, Confirm Password, University/Organization
- **Validation**: Real-time inline validation for uniqueness (username, email) and password complexity
- **Submission**: Creates the user and returns to the User List with a success notification
- **Expiration**: Displayed as a read-only field showing the calculated date (today + 120 days)

#### 6.2.3 Edit User Form
- **Fields**: First Name, Last Name, Email, University/Organization, Expiration Date (date picker)
- **Username**: Displayed but not editable
- **Status**: Displayed as a badge; changed via dedicated Lock/Unlock buttons, not a dropdown
- **Save**: Partial update; only modified fields are submitted

#### 6.2.4 User Detail View
- **Sections**:
  - Profile information (all stored fields except password)
  - Account status with timestamps (created, updated, last login, locked at/by)
  - Action buttons: Edit, Reset Password, Lock/Unlock, Delete
- **Embedded audit log**: A filtered view of the auth log showing only events for this user, displayed as a timeline

#### 6.2.5 Audit Log Viewer
- **Layout**: Full-width table with the following columns: Timestamp, User, Event Type, IP Address, Details
- **Filters**: Date range picker, user search, event type multi-select
- **Export**: "Download CSV" button that exports the current filtered view
- **Pagination**: 50 entries per page

#### 6.2.6 Password Reset Dialog
- **Admin-initiated**: Modal dialog with option to generate a temporary password or send a reset link (if SMTP is configured)
- **Displays**: The temporary password once (with a copy button); it is not retrievable after the dialog is closed
- **Confirmation**: Checkbox acknowledging that all existing sessions will be revoked

### 6.3 Design Specifications

| Property | Value |
|----------|-------|
| Style | Light, clean, minimal (consistent with host application) |
| Component library | shadcn/ui or equivalent accessible component set |
| Layout | Responsive; minimum supported width 768px |
| Typography | System font stack or host application font |
| Status badges | Green (`active`), Amber (`expired`), Red (`locked`) |
| Notifications | Toast messages for success/error, positioned top-right |
| Confirmation dialogs | Required for destructive actions (delete, lock, password reset) |

---

## 7. API Specification

### 7.1 Route Prefix

All routes are mounted under a configurable prefix. Default: `/api/umm`

### 7.2 Endpoints

#### Authentication

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/auth/login` | Authenticate and receive a session token | No |
| POST | `/auth/logout` | Revoke the current session | Yes |
| POST | `/auth/reset-password/request` | Request a password reset email | No |
| POST | `/auth/reset-password/confirm` | Submit a new password with a reset token | No |

#### User Management (Admin)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/users` | List all users (paginated, filterable) | Yes (admin) |
| GET | `/users/:id` | Get a single user's details | Yes (admin) |
| POST | `/users` | Create a new user | Yes (admin) |
| PATCH | `/users/:id` | Update user fields | Yes (admin) |
| DELETE | `/users/:id` | Soft-delete (lock) a user | Yes (admin) |
| DELETE | `/users/:id/permanent` | Hard-delete a user record | Yes (admin) |
| POST | `/users/:id/lock` | Lock a user account | Yes (admin) |
| POST | `/users/:id/unlock` | Unlock a user account | Yes (admin) |
| POST | `/users/:id/reset-password` | Admin-initiated password reset | Yes (admin) |

#### Audit Log

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/logs` | List auth log entries (paginated, filterable) | Yes (admin) |
| GET | `/logs/export` | Download filtered log entries as CSV | Yes (admin) |

### 7.3 Standard Response Format

```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 142
  }
}
```

### 7.4 Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_USERNAME",
    "message": "A user with this username already exists.",
    "field": "username"
  }
}
```

---

## 8. Reusability & Integration

### 8.1 Installation

```bash
npm install @<org>/user-management-module
```

### 8.2 Integration with a Host Application

The module exports an initialization function and an Express/Fastify router:

```javascript
import { initUserManagement, userManagementRouter } from '@<org>/user-management-module';

// Initialize with database connection and options
await initUserManagement({
  databaseUrl: process.env.UMM_DATABASE_URL,
  jwtSecret: process.env.UMM_JWT_SECRET,
  accountExpiryDays: 120,
  routePrefix: '/api/umm',
  adminGuiPrefix: '/admin/users',
});

// Mount the API routes
app.use('/api/umm', userManagementRouter);
```

### 8.3 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `databaseUrl` | string | Required | PostgreSQL connection string |
| `jwtSecret` | string | Required | Secret for signing JWTs |
| `saltRounds` | number | 12 | Bcrypt cost factor |
| `accountExpiryDays` | number | 120 | Days until new accounts expire |
| `sessionExpiryHours` | number | 24 | JWT/session lifetime |
| `routePrefix` | string | `/api/umm` | Base path for API endpoints |
| `adminGuiPrefix` | string | `/admin/users` | Base path for the admin interface |
| `maxLoginAttempts` | number | 5 | Failed attempts before auto-lock |
| `lockoutWindowMinutes` | number | 15 | Window for counting failed attempts |
| `smtp` | object | null | SMTP config for email-based resets |
| `onUserCreated` | function | null | Webhook/callback on user creation |
| `onUserLocked` | function | null | Webhook/callback on account lock |
| `onLoginSuccess` | function | null | Webhook/callback on successful login |

### 8.4 Database Migration

The module includes a migration runner that creates its tables on first initialization:

```javascript
import { runMigrations } from '@<org>/user-management-module';

await runMigrations({ databaseUrl: process.env.UMM_DATABASE_URL });
```

Migrations are idempotent and versioned. They will not interfere with tables owned by the host application.

### 8.5 Standalone Deployment

For projects that need user management as a separate microservice:

```bash
# Clone the repository
git clone git@github.com:<org>/user-management-module.git

# Configure environment
cp .env.example .env
# Edit .env with DigitalOcean database credentials

# Run
npm install
npm run start
```

This starts both the API server and the admin GUI on a single port (default: 3001).

---

## 9. GitHub Repository Structure

```
user-management-module/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint, test, build on PR
│       └── publish.yml             # Publish package on release
├── src/
│   ├── index.ts                    # Public exports (init, router, migrations)
│   ├── config.ts                   # Configuration loader and validation
│   ├── db/
│   │   ├── connection.ts           # Database connection pool
│   │   ├── migrations/             # Versioned SQL migration files
│   │   └── queries/                # Parameterized query functions
│   ├── models/
│   │   ├── user.ts                 # User entity and validation
│   │   ├── session.ts              # Session entity
│   │   └── auth-log.ts             # Audit log entity
│   ├── routes/
│   │   ├── auth.ts                 # Login, logout, password reset
│   │   ├── users.ts                # CRUD + lock/unlock
│   │   └── logs.ts                 # Audit log retrieval and export
│   ├── middleware/
│   │   ├── authenticate.ts         # JWT verification
│   │   ├── authorize.ts            # Role-based access control
│   │   └── rate-limit.ts           # Request rate limiting
│   ├── services/
│   │   ├── password.ts             # Hashing, complexity validation
│   │   ├── token.ts                # JWT creation and verification
│   │   ├── expiration.ts           # Account expiration scheduler
│   │   └── email.ts                # SMTP integration for resets
│   └── gui/
│       ├── index.html              # Admin SPA entry point
│       ├── components/             # React components for admin GUI
│       └── assets/                 # Static assets (CSS, icons)
├── tests/
│   ├── unit/                       # Unit tests for services and models
│   ├── integration/                # API endpoint tests
│   └── fixtures/                   # Test data and database seeds
├── .env.example                    # Environment variable template
├── package.json
├── tsconfig.json
├── README.md                       # Setup guide, API docs, integration examples
└── LICENSE
```

---

## 10. Development & Deployment Workflow

### 10.1 Local Development

1. Clone the repository from GitHub.
2. Copy `.env.example` to `.env` and populate with a local or DigitalOcean development database URL.
3. Run `npm install` to install dependencies.
4. Run `npm run migrate` to set up the database schema.
5. Run `npm run dev` to start the development server with hot reload.
6. Access the admin GUI at `http://localhost:3001/admin/users`.

### 10.2 CI/CD Pipeline (GitHub Actions)

| Trigger | Workflow | Actions |
|---------|----------|---------|
| Pull request opened/updated | `ci.yml` | Lint → Unit tests → Integration tests → Build |
| Merge to `main` | `ci.yml` | Same as above |
| GitHub Release created | `publish.yml` | Build → Publish to GitHub Packages / npm |

### 10.3 Production Deployment (DigitalOcean)

| Step | Action |
|------|--------|
| 1 | Provision a Managed PostgreSQL cluster on DigitalOcean |
| 2 | Create an App Platform app pointing to the GitHub repository's `main` branch |
| 3 | Set all `UMM_*` environment variables in the App Platform configuration |
| 4 | Enable auto-deploy on push to `main` |
| 5 | Run initial migration via the app's console or a deploy hook |

---

## 11. Testing Requirements

### 11.1 Unit Tests
- Password hashing and verification
- Password complexity validation (positive and negative cases)
- JWT creation, verification, and expiration
- Demand calculation and sentiment formula (if shared utilities)
- Account expiration logic

### 11.2 Integration Tests
- Full CRUD lifecycle: create → read → update → soft delete → hard delete
- Login with valid credentials → session created → logout → session revoked
- Login with wrong password → failure logged → 5 failures → auto-lock
- Password reset flow (admin-initiated and self-service)
- Lock → attempt login (rejected) → unlock → login (accepted)
- Account expiration: create user with 0-day expiry → verify login rejected → extend → verify login accepted
- Audit log entries are created for every tested action

### 11.3 Coverage Target
- Minimum 80% line coverage across the codebase
- 100% coverage on authentication and password services

---

## 12. Future Enhancements (Out of Scope)

- **Role-based access control (RBAC)**: Multiple admin roles with granular permissions
- **Two-factor authentication (2FA)**: TOTP-based second factor for login
- **OAuth / SSO integration**: Login via Google, GitHub, or SAML providers
- **User self-registration**: Public signup form with email verification
- **Profile avatars**: Image upload stored in DigitalOcean Spaces
- **API key management**: Allow users to generate API keys for programmatic access
- **Internationalization (i18n)**: Multi-language support for the admin GUI
- **Webhooks**: HTTP callbacks for user lifecycle events (creation, lock, expiration)
- **Audit log retention policy**: Configurable auto-archival of logs older than N days

---

## 13. Glossary

| Term | Definition |
|------|-----------|
| **UMM** | User Management Module; the reusable package described in this document |
| **Soft delete** | Setting a user's status to `locked` and revoking sessions without removing the database record |
| **Hard delete** | Permanent removal of the user record from the database |
| **Bcrypt** | An adaptive password hashing function designed to be computationally expensive to resist brute-force attacks |
| **JWT** | JSON Web Token; a compact, signed token used for stateless session authentication |
| **Salt rounds** | The cost factor for bcrypt; higher values increase hashing time and security |
| **Auth log** | An append-only table recording all authentication-related events for audit purposes |
| **Account expiration** | The automatic transition of an account from `active` to `expired` after a configured number of days |
| **Rate limiting** | Restricting the number of requests a client can make within a time window to prevent abuse |
| **Idempotent migration** | A database migration that can be run multiple times without causing errors or duplicate changes |

---

*Document version: 1.0*
*Last updated: March 2026*
