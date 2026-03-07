# AHP Studio - Deployment Guide

## Prerequisites for DigitalOcean Deployment

### 1. DigitalOcean Droplet Setup
- Create a Droplet (Ubuntu 22.04 or 24.04)
- Recommended: 2 vCPU, 4 GB RAM, 80 GB SSD
- Set up a Floating IP for stability

### 2. DigitalOcean Managed Database
- Create PostgreSQL 16 database
- Note the connection string

### 3. DigitalOcean Spaces
You have already configured:
- Spaces URL: `https://ahpstudio.atl1.digitaloceanspaces.com`
- Access Key Name: `ahpstudiokey`
- Secret Private Key: (Keep this secure)

### 4. Domain Configuration
- Point your domain to the Droplet's IP
- Configure DNS records in DigitalOcean

## Deployment Steps

### Step 1: Initial Server Setup

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Nginx
apt install -y nginx

# Install PM2 globally
npm install -g pm2

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx
```

### Step 2: Clone and Configure Application

```bash
# Create application directory
mkdir -p /var/www/ahpstudio
cd /var/www/ahpstudio

# Clone repository
git clone https://github.com/jrmst102/ahpstudio.git .

# Create .env file
cp .env.example .env
nano .env
```

Configure your `.env` with production values:

```env
NODE_ENV=production
PORT=3001

# Your DigitalOcean PostgreSQL connection string
DATABASE_URL=postgresql://user:password@db-host:25060/ahpstudio?sslmode=require

# Generate secure JWT secret: openssl rand -base64 64
JWT_SECRET=your-generated-secure-secret-here
JWT_EXPIRATION=24h

# DigitalOcean Spaces
SPACES_ENDPOINT=https://ahpstudio.atl1.digitaloceanspaces.com
SPACES_BUCKET=ahpstudio
SPACES_KEY=ahpstudiokey
SPACES_SECRET=your-secret-private-key-here
SPACES_REGION=atl1

# Your domain
APP_URL=https://yourdomain.com
```

### Step 3: Install and Build

```bash
# Run setup script
./setup.sh

# Or manually:
npm install
cd server && npm install
cd ../client && npm install

# Generate Prisma client
cd server
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# Build frontend
cd ../client
npm run build
```

### Step 4: Configure Nginx

```bash
# Copy Nginx configuration
cp /var/www/ahpstudio/nginx/ahpstudio.conf /etc/nginx/sites-available/ahpstudio

# Edit with your domain
nano /etc/nginx/sites-available/ahpstudio
# Replace 'ahpstudio.yourdomain.com' with your actual domain

# Enable site
ln -s /etc/nginx/sites-available/ahpstudio /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Step 5: Set Up SSL with Let's Encrypt

```bash
# Get SSL certificate
certbot --nginx -d yourdomain.com

# Certbot will automatically configure Nginx for HTTPS
# Certificate will auto-renew
```

### Step 6: Start Backend with PM2

```bash
cd /var/www/ahpstudio/server

# Start application
pm2 start src/app.js --name ahpstudio

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup

# Monitor logs
pm2 logs ahpstudio
```

### Step 7: Verify Deployment

Visit your domain:
- Frontend: https://yourdomain.com
- API Health: https://yourdomain.com/api/v1/health

Login with default admin credentials:
- Username: `admin`
- Password: `AHPAdmin2026!`
- **IMPORTANT:** Change password immediately!

## Post-Deployment

### Monitor Application

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs ahpstudio

# Monitor resources
pm2 monit
```

### Set Up Monitoring

Configure DigitalOcean Monitoring alerts:
- CPU > 80%
- Memory > 85%
- Disk > 90%

### Database Backups

DigitalOcean Managed Databases include:
- Automated daily backups
- 7-day retention
- Point-in-time recovery

### Application Updates

```bash
cd /var/www/ahpstudio

# Pull latest code
git pull origin main

# Update dependencies
npm install
cd server && npm install
cd ../client && npm install

# Run migrations if needed
cd server
npx prisma migrate deploy

# Rebuild frontend
cd ../client
npm run build

# Restart backend
pm2 restart ahpstudio
```

## Troubleshooting

### Check Backend Logs
```bash
pm2 logs ahpstudio --lines 100
```

### Check Nginx Logs
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Check Nginx Status
```bash
systemctl status nginx
nginx -t
```

### Check Database Connection
```bash
cd /var/www/ahpstudio/server
npx prisma studio
```

### Restart Services
```bash
# Restart Nginx
systemctl restart nginx

# Restart Backend
pm2 restart ahpstudio

# Restart All
pm2 restart all
```

## Security Checklist

- [ ] Changed default admin password
- [ ] SSL certificate installed and working
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] Database connection uses SSL
- [ ] JWT_SECRET is secure and unique
- [ ] Spaces Secret Key is kept secure
- [ ] Regular backups configured
- [ ] Monitoring alerts set up
- [ ] PM2 auto-restart on server reboot configured

## GitHub Actions CI/CD

The repository includes a GitHub Actions workflow. To enable:

1. Add repository secrets in GitHub:
   - `DO_SSH_KEY`: Your private SSH key
   - `DO_HOST`: Your droplet IP or domain
   - `DO_USER`: SSH user (usually root)

2. Push to main branch triggers:
   - Automated testing
   - Build
   - Deployment to DigitalOcean

## Support

For deployment issues, check:
- [DigitalOcean Documentation](https://docs.digitalocean.com)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)
- [Nginx Documentation](https://nginx.org/en/docs)

---

**Copyright 2026 by Dr. Jose Mendoza.**
