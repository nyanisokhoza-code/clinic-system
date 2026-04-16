# Clinic System - Deployment & Setup Guide

**Document Version**: 1.0  
**Last Updated**: April 16, 2026  
**Status**: READY FOR DEPLOYMENT

---

## Deployment Overview

This guide provides step-by-step instructions for deploying the Clinic System to production environments.

---

## 1. Pre-Deployment Checklist

### 1.1 Code Quality
- ✅ All tests passing (`pnpm test`)
- ✅ TypeScript compilation clean (`pnpm check`)
- ✅ No console errors or warnings
- ✅ Code reviewed and approved
- ✅ All TODOs addressed

### 1.2 Security
- ✅ HTTPS enabled
- ✅ Environment variables configured
- ✅ Database encryption enabled
- ✅ API keys rotated
- ✅ Security headers configured

### 1.3 Documentation
- ✅ POPIA compliance documented
- ✅ Testing guide completed
- ✅ API documentation updated
- ✅ User guides prepared
- ✅ Deployment procedures documented

### 1.4 Performance
- ✅ Database indexes optimized
- ✅ API response times acceptable
- ✅ Frontend load time optimized
- ✅ Caching configured
- ✅ CDN configured for static assets

---

## 2. Environment Setup

### 2.1 Production Environment Variables

```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/clinic_system

# Authentication
JWT_SECRET=<generate-strong-secret>
VITE_APP_ID=<oauth-app-id>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im

# Owner Information
OWNER_OPEN_ID=<owner-id>
OWNER_NAME=<owner-name>

# API Keys
BUILT_IN_FORGE_API_KEY=<api-key>
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<frontend-api-key>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=<website-id>

# Application
VITE_APP_TITLE="Clinic System"
VITE_APP_LOGO=<logo-url>
NODE_ENV=production
```

### 2.2 Database Setup

```bash
# Create database
CREATE DATABASE clinic_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user
CREATE USER 'clinic_user'@'localhost' IDENTIFIED BY '<strong-password>';

# Grant privileges
GRANT ALL PRIVILEGES ON clinic_system.* TO 'clinic_user'@'localhost';
FLUSH PRIVILEGES;

# Run migrations
pnpm db:push
```

### 2.3 SSL/TLS Certificate

```bash
# Generate self-signed certificate (development)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# Or use Let's Encrypt (production)
certbot certonly --standalone -d clinic-system.example.com
```

---

## 3. Build & Deployment

### 3.1 Build Production Bundle

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Type check
pnpm check

# Build for production
pnpm build

# Output: dist/ directory with compiled code
```

### 3.2 Deploy to Manus Platform

The Clinic System is built to deploy on Manus. Use the Publish button in the Management UI:

1. **Create Checkpoint**: Save current state
2. **Click Publish**: In Management UI header
3. **Configure Domain**: Assign custom domain (optional)
4. **Deploy**: System automatically deployed

### 3.3 Deploy to External Hosting (Alternative)

#### Docker Deployment

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build
RUN pnpm build

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]
```

```bash
# Build Docker image
docker build -t clinic-system:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/clinic_system" \
  -e JWT_SECRET="<secret>" \
  clinic-system:latest
```

#### Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link project
railway link

# Deploy
railway up
```

#### Render Deployment

1. Connect GitHub repository
2. Create new Web Service
3. Configure environment variables
4. Deploy

---

## 4. Post-Deployment Verification

### 4.1 Health Checks

```bash
# Check API health
curl https://clinic-system.example.com/api/health

# Check database connection
curl https://clinic-system.example.com/api/db-health

# Check authentication
curl https://clinic-system.example.com/api/auth/me
```

### 4.2 Smoke Testing

1. Navigate to home page
2. Login with test credentials
3. Register test patient
4. Check in to queue
5. View queue status
6. Access analytics dashboard
7. Verify all features working

### 4.3 Performance Verification

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://clinic-system.example.com/

# Monitor server logs
tail -f logs/server.log

# Check database performance
SHOW PROCESSLIST;
SHOW SLOW LOG;
```

### 4.4 Security Verification

```bash
# Check HTTPS
curl -I https://clinic-system.example.com/

# Check security headers
curl -I https://clinic-system.example.com/ | grep -i "security\|cache\|content"

# Check SSL certificate
openssl s_client -connect clinic-system.example.com:443
```

---

## 5. Monitoring & Maintenance

### 5.1 Logging

**Application Logs**: `logs/app.log`
**Error Logs**: `logs/error.log`
**Access Logs**: `logs/access.log`

```bash
# View logs in real-time
tail -f logs/app.log

# Search logs
grep "error" logs/app.log

# Archive old logs
gzip logs/app.log.1
```

### 5.2 Database Maintenance

```bash
# Backup database
mysqldump -u clinic_user -p clinic_system > backup.sql

# Optimize tables
OPTIMIZE TABLE patients, queues, consultations, prescriptions;

# Check table status
CHECK TABLE patients, queues, consultations, prescriptions;

# Repair tables (if needed)
REPAIR TABLE patients, queues, consultations, prescriptions;
```

### 5.3 Performance Monitoring

```bash
# Monitor CPU and memory
top

# Monitor disk usage
df -h

# Monitor network
netstat -i

# Monitor database connections
SHOW STATUS WHERE variable_name LIKE 'Threads%';
```

### 5.4 Automated Backups

```bash
# Daily backup script (backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u clinic_user -p clinic_system > backups/clinic_system_$DATE.sql
gzip backups/clinic_system_$DATE.sql

# Add to crontab
0 2 * * * /path/to/backup.sh
```

---

## 6. Scaling & Performance Optimization

### 6.1 Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_patient_sa_id ON patients(saId);
CREATE INDEX idx_queue_clinic_id ON queues(clinicId);
CREATE INDEX idx_queue_check_in_time ON queues(checkInTime);
CREATE INDEX idx_prescription_status ON prescriptions(status);
CREATE INDEX idx_consultation_patient_id ON consultations(patientId);

-- Enable query cache
SET GLOBAL query_cache_size = 268435456;
SET GLOBAL query_cache_type = 1;
```

### 6.2 Application Scaling

```bash
# Use process manager (PM2)
npm install -g pm2

# Start application with PM2
pm2 start dist/index.js -i max --name clinic-system

# Monitor processes
pm2 monit

# Setup auto-restart
pm2 startup
pm2 save
```

### 6.3 Load Balancing

```nginx
# Nginx configuration
upstream clinic_system {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    server_name clinic-system.example.com;

    location / {
        proxy_pass http://clinic_system;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 6.4 Caching Strategy

```bash
# Redis caching
npm install redis

# Cache configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600
```

---

## 7. Disaster Recovery

### 7.1 Backup Strategy

- **Daily Backups**: Full database backup
- **Hourly Backups**: Incremental backups
- **Retention**: 30 days
- **Storage**: Offsite backup storage

### 7.2 Recovery Procedures

```bash
# Restore from backup
mysql -u clinic_user -p clinic_system < backup.sql

# Verify restoration
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM queues;
SELECT COUNT(*) FROM consultations;
```

### 7.3 Failover Plan

1. **Detection**: Automated health checks
2. **Notification**: Alert team immediately
3. **Failover**: Switch to backup server
4. **Verification**: Confirm system operational
5. **Investigation**: Determine root cause
6. **Recovery**: Restore primary server

---

## 8. Security Hardening

### 8.1 Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny incoming
sudo ufw allow outgoing
```

### 8.2 SSL/TLS Configuration

```bash
# Generate strong SSL certificate
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365

# Configure strong ciphers
SSLCipherSuite ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256
SSLProtocol TLSv1.2 TLSv1.3
```

### 8.3 Security Headers

```nginx
# Add security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

---

## 9. Compliance & Audit

### 9.1 POPIA Compliance

- ✅ Data encryption enabled
- ✅ Access controls enforced
- ✅ Audit logging active
- ✅ Backup procedures documented
- ✅ Incident response plan ready

### 9.2 Regular Audits

- **Monthly**: Security audit
- **Quarterly**: Performance audit
- **Annual**: External compliance audit

---

## 10. Rollback Procedures

### 10.1 Quick Rollback

```bash
# Revert to previous version
git revert <commit-hash>
pnpm build
# Redeploy
```

### 10.2 Database Rollback

```bash
# Restore from backup
mysql -u clinic_user -p clinic_system < backup_previous.sql

# Verify data integrity
SELECT COUNT(*) FROM patients;
```

---

## 11. Support & Escalation

### 11.1 Support Contacts

- **Technical Support**: support@clinic-system.local
- **Security Issues**: security@clinic-system.local
- **Data Protection**: dpo@clinic-system.local
- **Emergency Hotline**: +27-XX-XXX-XXXX

### 11.2 Incident Response

1. **Report**: Contact support immediately
2. **Assess**: Determine severity and impact
3. **Respond**: Implement immediate mitigation
4. **Investigate**: Determine root cause
5. **Communicate**: Update stakeholders
6. **Resolve**: Implement permanent fix
7. **Review**: Post-incident analysis

---

## 12. Useful Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm test             # Run tests
pnpm check            # TypeScript check

# Database
pnpm db:push          # Run migrations
mysql -u user -p db   # Connect to database

# Deployment
git push origin main  # Push to repository
railway up            # Deploy to Railway

# Monitoring
pm2 monit             # Monitor processes
tail -f logs/app.log  # View logs
```

---

**Document Approved**: [Signature/Date]  
**Next Review Date**: April 16, 2027

---

*This document is confidential and intended for authorized personnel only.*
