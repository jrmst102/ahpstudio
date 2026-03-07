# AHP Studio

**Version:** 1.0  
**Author:** Dr. Jose Mendoza  
**Copyright 2026 by Dr. Jose Mendoza.**

## Overview

AHP Studio is a web-based decision support application that implements the Analytic Hierarchy Process (AHP), developed by Dr. Thomas L. Saaty. Designed for graduate-level competitive strategy students, AHP Studio enables users to define decision problems, structure criteria hierarchies, perform pairwise comparisons, compute priority vectors, evaluate consistency, and synthesize final rankings across alternatives.

## Features

- **Decision Problem Management**: Create, save, load, and delete decision problems
- **Criteria Hierarchy**: Define up to 10 criteria with up to 7 sub-criteria each
- **Alternatives**: Evaluate up to 12 alternatives per problem
- **Pairwise Comparisons**: Use Saaty's 1-9 fundamental scale
- **Priority Computation**: Eigenvector method with consistency checking
- **Sensitivity Analysis**: Four analysis modes (Performance, Dynamic, Gradient, Head-to-Head)
- **User Management**: Admin panel for managing student accounts
- **Secure Authentication**: JWT-based authentication with account lockout protection

## Technology Stack

### Backend
- Node.js 20 LTS
- Express.js
- PostgreSQL 16
- Prisma ORM
- JWT Authentication
- DigitalOcean Spaces (S3-compatible)

### Frontend
- React 18+
- Tailwind CSS
- Recharts/D3.js for visualizations
- Axios for API communication

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 16
- DigitalOcean account with Spaces configured
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/jrmst102/ahpstudio.git
cd ahpstudio
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Server
NODE_ENV=development
PORT=3001

# Database (replace with your PostgreSQL connection string)
DATABASE_URL=postgresql://user:password@localhost:5432/ahpstudio?schema=public

# JWT (generate a secure random string)
JWT_SECRET=your-secure-secret-key-here
JWT_EXPIRATION=24h

# DigitalOcean Spaces
SPACES_ENDPOINT=https://ahpstudio.atl1.digitaloceanspaces.com
SPACES_BUCKET=ahpstudio
SPACES_KEY=ahpstudiokey
SPACES_SECRET=your-secret-private-key-here
SPACES_REGION=atl1

# App
APP_URL=http://localhost:3000
```

### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 4. Database Setup

```bash
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with admin user
npx prisma db seed
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `AHPAdmin2026!`
- **IMPORTANT:** Change this password on first login!

### 5. Run the Application

#### Development Mode

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Production Deployment

### 1. Build the Frontend

```bash
cd client
npm run build
```

### 2. Configure Nginx

Copy the Nginx configuration:

```bash
sudo cp nginx/ahpstudio.conf /etc/nginx/sites-available/ahpstudio
sudo ln -s /etc/nginx/sites-available/ahpstudio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Set Up SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 4. Start the Backend with PM2

```bash
cd server
npm install -g pm2
pm2 start src/app.js --name ahpstudio
pm2 save
pm2 startup
```

## Project Structure

```
ahpstudio/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── context/       # React context providers
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # Node.js backend
│   ├── prisma/           # Database schema and seeds
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utility functions
│   └── package.json
├── nginx/                # Nginx configuration
├── .github/workflows/    # CI/CD pipelines
└── docs/                 # Documentation
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/change-password` - Change password

### Problems
- `POST /api/v1/problems` - Create problem
- `GET /api/v1/problems` - List problems
- `GET /api/v1/problems/:id` - Get problem
- `PUT /api/v1/problems/:id` - Update problem
- `DELETE /api/v1/problems/:id` - Delete problem
- `POST /api/v1/problems/:id/save` - Save to .AHP file
- `GET /api/v1/problems/:id/download` - Download .AHP file
- `POST /api/v1/problems/upload` - Upload .AHP file

### AHP Computation
- `POST /api/v1/compute/priorities` - Compute priorities
- `POST /api/v1/compute/consistency` - Compute consistency
- `POST /api/v1/compute/synthesize` - Synthesize global priorities
- `POST /api/v1/compute/sensitivity` - Sensitivity analysis

### Admin (Admin only)
- `GET /api/v1/admin/users` - List users
- `POST /api/v1/admin/users` - Create user
- `PUT /api/v1/admin/users/:id` - Update user
- `DELETE /api/v1/admin/users/:id` - Delete user
- `POST /api/v1/admin/users/:id/unlock` - Unlock account
- `POST /api/v1/admin/users/:id/reset-password` - Reset password

## Testing

### Run Server Tests

```bash
cd server
npm test
```

### Run Client Tests

```bash
cd client
npm test
```

## Security Considerations

- All passwords are hashed with bcrypt (cost factor 12)
- JWT tokens expire after 24 hours
- Account lockout after 3 failed login attempts
- HTTPS enforced in production
- CORS restricted to application domain
- Rate limiting on authentication endpoints
- SQL injection prevention via Prisma ORM

## Troubleshooting

### Database Connection Issues

Ensure PostgreSQL is running and the `DATABASE_URL` is correct:

```bash
psql -U postgres -c "SELECT version();"
```

### DigitalOcean Spaces Connection

Verify your Spaces credentials:
- Endpoint URL format: `https://[bucket-name].[region].digitaloceanspaces.com`
- Access Key and Secret Key are correctly set

### Port Conflicts

If ports 3000 or 3001 are in use, change them in `.env` and `client/package.json`.

## License

Copyright 2026 by Dr. Jose Mendoza. All rights reserved.

## Support

For issues or questions, please contact Dr. Jose Mendoza.
AHP Studio - Decision Support Tool.
