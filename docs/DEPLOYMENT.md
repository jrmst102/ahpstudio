# AHP Studio - Deployment Guide

## Prerequisites for DigitalOcean Deployment

### 1. DigitalOcean Droplet Setup
- Create a Droplet (Ubuntu 22.04 or 24.04)
- Recommended: 2 vCPU, 4 GB RAM, 80 GB SSD
- Set up a Floating IP for stability

### 2. DigitalOcean Spaces
You have already configured:
- Spaces URL: `https://ahpstudio.atl1.digitaloceanspaces.com`
- Access Key Name: `ahpstudiokey`
- Secret Private Key: (Keep this secure)

All user data and problem files are stored in Spaces — no database server is needed.

### 3. Domain Configuration
- Point your domain to the Droplet's IP
- Configure DNS records in DigitalOcean

## Deployment Steps

### Step 1: Initial Server Setup
```bash
ssh root@your-droplet-ip
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx
npm install -g pm2
apt install -y certbot python3-certbot-nginx
```

### Step 2: Clone and Configure Application
```bash
mkdir -p /var/www/ahpstudio
cd /var/www/ahpstudio
git clone https://github.com/jrmst102/ahpstudio.git .
cp .env.example .env
nano .env
```

Configure `.env` with production values (JWT_SECRET, Spaces credentials, APP_URL).

### Step 3: Install, Seed, and Build
```bash
cd server && npm install && npm run seed && cd ..
cd client && npm install && npm run build && cd ..
```

### Step 4: Configure Nginx
```bash
cp /var/www/ahpstudio/nginx/ahpstudio.conf /etc/nginx/sites-available/ahpstudio
nano /etc/nginx/sites-available/ahpstudio
ln -s /etc/nginx/sites-available/ahpstudio /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### Step 5: SSL with Let's Encrypt
```bash
certbot --nginx -d yourdomain.com
```

### Step 6: Start Backend with PM2
```bash
cd /var/www/ahpstudio/server
pm2 start src/app.js --name ahpstudio
pm2 save
pm2 startup
```

### Step 7: Verify
- Frontend: https://yourdomain.com
- API Health: https://yourdomain.com/api/v1/health
- Login: admin / AHPAdmin2026! (change immediately)
- Demo login: demo_admin / DemoUser2026!

## Post-Deployment
- PM2 monitoring, DigitalOcean alerts
- Update process: git pull, npm install (server + client), rebuild client, pm2 restart

## Security Checklist
- Change default admin password
- Enable SSL
- Configure firewall (ufw)
- Use a strong JWT_SECRET
- Keep Spaces keys secure
- Enable PM2 auto-restart

## GitHub Actions CI/CD
- Add secrets: DO_SSH_KEY, DO_HOST, DO_USER
- Push to main triggers test/build/deploy

---
Copyright 2026 by Dr. Jose Mendoza.
