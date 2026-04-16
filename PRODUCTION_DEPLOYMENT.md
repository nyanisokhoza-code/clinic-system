# Clinic System - Production Deployment Guide

## Overview

This guide provides step-by-step instructions to deploy the clinic system as a permanent production website. The system uses Node.js, Express, React, and MySQL/TiDB for the database.

---

## Option 1: Deploy to Vercel (Recommended for Quick Setup)

### Prerequisites
- Vercel account (free at https://vercel.com)
- GitHub account with the clinic-system repository
- MySQL/TiDB database (can use Vercel's partner services)

### Step 1: Prepare Repository
```bash
cd /home/ubuntu/clinic-system-update
git init
git add .
git commit -m "Initial clinic system commit"
git remote add origin https://github.com/YOUR_USERNAME/clinic-system.git
git push -u origin main
```

### Step 2: Create Environment Variables
Create a `.env.production` file:
```env
# Database
DATABASE_URL=mysql://user:password@host:port/clinic_system
MYSQL_HOST=your-mysql-host
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=clinic_system

# OAuth (Optional)
OAUTH_SERVER_URL=https://your-oauth-server.com
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret

# AWS S3 (for file uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=clinic-system-uploads

# App
NODE_ENV=production
PORT=3000
```

### Step 3: Deploy to Vercel
1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Choose your clinic-system repository
4. Add environment variables from `.env.production`
5. Click "Deploy"

### Step 4: Configure Custom Domain
1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain (e.g., `clinic.yourdomain.com`)
3. Update DNS records as instructed by Vercel

---

## Option 2: Deploy to AWS (EC2 + RDS)

### Prerequisites
- AWS account
- EC2 instance (t3.medium or larger recommended)
- RDS MySQL instance
- Domain name

### Step 1: Set Up EC2 Instance
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

### Step 2: Clone and Setup Application
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/clinic-system.git
cd clinic-system

# Install dependencies
pnpm install

# Create .env file
cat > .env.production << EOF
DATABASE_URL=mysql://user:password@your-rds-endpoint:3306/clinic_system
NODE_ENV=production
PORT=3000
EOF

# Build application
pnpm build

# Run database migrations
pnpm db:push
```

### Step 3: Configure PM2
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'clinic-system',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 4: Configure Nginx
```bash
# Create Nginx configuration
sudo cat > /etc/nginx/sites-available/clinic-system << EOF
server {
    listen 80;
    server_name clinic.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/clinic-system /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 5: Set Up SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d clinic.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo systemctl enable certbot.timer
```

### Step 6: Set Up RDS MySQL Database
1. Create RDS MySQL instance in AWS console
2. Configure security group to allow EC2 instance
3. Create database and user:
```bash
mysql -h your-rds-endpoint -u admin -p
CREATE DATABASE clinic_system;
CREATE USER 'clinic_user'@'%' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON clinic_system.* TO 'clinic_user'@'%';
FLUSH PRIVILEGES;
```

---

## Option 3: Deploy to DigitalOcean (App Platform)

### Prerequisites
- DigitalOcean account
- GitHub repository
- DigitalOcean database cluster

### Step 1: Create Database Cluster
1. Go to DigitalOcean console
2. Click "Create" → "Databases"
3. Select MySQL
4. Choose plan and region
5. Note the connection string

### Step 2: Deploy Application
1. Go to "Create" → "Apps"
2. Select your GitHub repository
3. Configure build and run commands:
   - **Build Command**: `pnpm install && pnpm build`
   - **Run Command**: `pnpm start`
4. Add environment variables (from `.env.production`)
5. Connect to database cluster
6. Click "Create App"

### Step 3: Configure Custom Domain
1. In App settings, go to "Domains"
2. Add your custom domain
3. Update DNS records at your domain registrar

---

## Option 4: Deploy to Docker (Any Cloud Provider)

### Step 1: Create Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Expose port
EXPOSE 3000

# Start application
CMD ["pnpm", "start"]
```

### Step 2: Create Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://user:password@db:3306/clinic_system
    depends_on:
      - db
    restart: always

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=clinic_system
      - MYSQL_USER=clinic_user
      - MYSQL_PASSWORD=clinic_password
    volumes:
      - db_data:/var/lib/mysql
    restart: always

volumes:
  db_data:
```

### Step 3: Deploy
```bash
# Build and run locally
docker-compose up -d

# For cloud deployment (e.g., AWS ECS, Google Cloud Run)
# Follow your cloud provider's Docker deployment guide
```

---

## Post-Deployment Configuration

### 1. Set Up Database Backups
```bash
# Create backup script
cat > /home/ubuntu/backup-clinic-db.sh << EOF
#!/bin/bash
BACKUP_DIR="/backups/clinic-system"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mysqldump -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > $BACKUP_DIR/backup_$TIMESTAMP.sql
# Keep only last 30 days of backups
find $BACKUP_DIR -type f -mtime +30 -delete
EOF

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-clinic-db.sh
```

### 2. Set Up Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Set up log rotation
sudo cat > /etc/logrotate.d/clinic-system << EOF
/var/log/clinic-system/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
EOF
```

### 3. Configure Email Notifications
Update `.env.production`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@clinic.yourdomain.com
```

### 4. Set Up Health Checks
```bash
# Add health check endpoint to server
# GET /health should return { status: 'ok' }

# Configure monitoring service to check every 5 minutes
curl -f http://localhost:3000/health || systemctl restart clinic-system
```

---

## Maintenance

### Regular Updates
```bash
# Check for dependency updates
pnpm outdated

# Update dependencies
pnpm update

# Rebuild and redeploy
pnpm build
pm2 restart clinic-system
```

### Database Maintenance
```bash
# Optimize tables
mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE
OPTIMIZE TABLE patients, queue_entries, consultations, prescriptions;

# Check for errors
CHECK TABLE patients, queue_entries, consultations, prescriptions;
```

### Performance Monitoring
```bash
# Monitor PM2 processes
pm2 monit

# Check Nginx status
sudo systemctl status nginx

# View application logs
pm2 logs clinic-system
```

---

## Security Best Practices

1. **SSL/TLS**: Always use HTTPS (Let's Encrypt for free certificates)
2. **Database**: Use strong passwords, enable encryption at rest
3. **Environment Variables**: Never commit `.env` files to git
4. **Firewall**: Restrict access to database and admin ports
5. **Updates**: Keep Node.js, dependencies, and OS updated
6. **Backups**: Automated daily backups with offsite storage
7. **Monitoring**: Set up alerts for errors and performance issues
8. **Rate Limiting**: Implement rate limiting on API endpoints
9. **CORS**: Configure CORS properly for your domain
10. **Audit Logging**: Enable audit logs for sensitive operations

---

## Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs clinic-system

# Check port availability
sudo lsof -i :3000

# Check environment variables
env | grep DATABASE_URL
```

### Database connection errors
```bash
# Test connection
mysql -h your-host -u your-user -p your-database

# Check credentials in .env
cat .env.production | grep DATABASE_URL
```

### High memory usage
```bash
# Check memory
free -h

# Restart application
pm2 restart clinic-system

# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=2048" pm2 start app.js
```

### Slow performance
```bash
# Check database query performance
EXPLAIN SELECT * FROM patients WHERE saIdNumber = '...';

# Add indexes if needed
CREATE INDEX idx_patient_saidnumber ON patients(saIdNumber);
```

---

## Support & Resources

- **Documentation**: See README.md and UPDATES_SUMMARY.md
- **Issues**: Check GitHub issues or contact support
- **Monitoring**: Set up Sentry for error tracking
- **Analytics**: Integrate Google Analytics or Mixpanel
- **CDN**: Use Cloudflare for faster content delivery

---

## Rollback Procedure

If deployment fails:
```bash
# Revert to previous version
git revert HEAD
git push origin main

# Redeploy
# (Your deployment platform will automatically redeploy)

# Or manually restart previous version
pm2 restart clinic-system
```

---

## Cost Estimation (Monthly)

| Component | Provider | Cost |
|-----------|----------|------|
| **Hosting** | AWS EC2 t3.medium | $30 |
| **Database** | AWS RDS MySQL | $50 |
| **Storage** | AWS S3 | $5 |
| **CDN** | Cloudflare | Free/Pro |
| **SSL** | Let's Encrypt | Free |
| **Domain** | Namecheap/GoDaddy | $10 |
| **Monitoring** | Sentry/DataDog | $20 |
| **Total** | | ~$115/month |

---

## Next Steps

1. Choose your deployment option
2. Follow the setup instructions
3. Configure environment variables
4. Run database migrations
5. Test all workflows
6. Set up monitoring and backups
7. Go live!

For questions or issues, refer to the troubleshooting section or contact your DevOps team.
