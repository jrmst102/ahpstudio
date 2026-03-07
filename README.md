# AHP Studio

**Version:** 2.0  
**Author:** Dr. Jose Mendoza  
**Copyright 2026 by Dr. Jose Mendoza.**

## Overview
AHP Studio is a web-based decision support application implementing the Analytic Hierarchy Process (AHP).

## Features
- Decision Problem Management (create, save, load, delete)
- Criteria Hierarchy (up to 10 criteria, 7 sub-criteria each)
- Alternatives (up to 12 per problem)
- Pairwise Comparisons (Saaty's 1-9 scale)
- Priority Computation (eigenvector method with consistency checking)
- Sensitivity Analysis (4 modes)
- User Management (admin panel)
- JWT Authentication with account lockout

## Technology Stack
- **Backend:** Node.js 20 LTS, Express.js, JWT, DigitalOcean Spaces (all data storage)
- **Frontend:** React 18+, Tailwind CSS, Recharts/D3.js, Axios

## Prerequisites
- Node.js 20+
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
   cd server && npm install && npm run seed && cd ..
   cd client && npm install && cd ..
   ```

4. Start development servers:
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

## Data Storage
All data is stored in DigitalOcean Spaces (S3-compatible):
- **Users:** `data/users.json`
- **Problem metadata:** `users/{userId}/problems/index.json`
- **Problem data:** `users/{userId}/problems/{problemId}.AHP`

No database server is required.

## API Endpoints
- **Auth:** login, logout, me, change-password
- **Problems:** CRUD + save/download/upload .AHP files
- **Compute:** priorities, consistency, synthesize, sensitivity
- **Admin:** user CRUD, unlock, reset-password

## Security
- bcrypt (cost 12), JWT 24h expiry, 3-attempt lockout, HTTPS, CORS, rate limiting

---
Copyright 2026 by Dr. Jose Mendoza. All rights reserved.
