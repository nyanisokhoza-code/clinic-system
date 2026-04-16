# Clinic System - Quick Deployment Guide

## 🚀 Deploy in 5 Minutes (Vercel)

### Step 1: Push to GitHub
```bash
cd clinic-system-update
git init
git add .
git commit -m "Initial clinic system"
git remote add origin https://github.com/YOUR_USERNAME/clinic-system.git
git push -u origin main
```

### Step 2: Create Environment Variables File
Create `.env.production` in your repository:
```env
# Database Connection
DATABASE_URL=mysql://user:password@your-mysql-host:3306/clinic_system

# Node Environment
NODE_ENV=production

# Optional: OAuth Configuration
OAUTH_SERVER_URL=https://your-oauth-server.com
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret

# Optional: AWS S3 for file uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=clinic-uploads
```

### Step 3: Deploy to Vercel
1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select your clinic-system repository
4. Click **"Continue"**
5. In Environment Variables section, add all variables from `.env.production`
6. Click **"Deploy"**
7. Wait 2-3 minutes for deployment to complete
8. Your site is now live at `clinic-system.vercel.app`

### Step 4: Add Custom Domain (Optional)
1. In Vercel dashboard, go to **Settings → Domains**
2. Enter your domain (e.g., `clinic.yourdomain.com`)
3. Update DNS records as shown by Vercel
4. Wait 24 hours for DNS propagation

---

## 📊 Database Setup

### Option A: Use Vercel's MySQL Partner (Easiest)
1. In Vercel dashboard, go to **Storage**
2. Click **"Create Database"**
3. Select **"MySQL"**
4. Choose region and plan
5. Copy connection string to `.env.production`

### Option B: Use External MySQL Host
1. Create MySQL database on:
   - **AWS RDS**: https://aws.amazon.com/rds/
   - **PlanetScale**: https://planetscale.com/ (free tier)
   - **DigitalOcean**: https://www.digitalocean.com/products/managed-databases/
   - **Heroku**: https://www.heroku.com/

2. Create database and user:
```sql
CREATE DATABASE clinic_system;
CREATE USER 'clinic_user'@'%' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON clinic_system.* TO 'clinic_user'@'%';
FLUSH PRIVILEGES;
```

3. Get connection string: `mysql://clinic_user:strong_password@host:3306/clinic_system`

---

## ✅ Verify Deployment

### Check if Site is Live
```bash
curl https://your-domain.com
```

### Check Database Connection
```bash
# SSH into Vercel (if available) or test locally
npm run db:push
```

### Test All Workflows
1. **Patient Registration**: Visit site and register
2. **Nurse Vital Signs**: Log in as nurse and record vitals
3. **Doctor Consultation**: Log in as doctor and create prescription
4. **Medication Collection**: Verify dispensary workflow

---

## 🔧 Configuration After Deployment

### 1. Set Up Email Notifications
Add to `.env.production`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@clinic.yourdomain.com
```

### 2. Enable Analytics
Add Google Analytics ID:
```env
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### 3. Configure OAuth (Optional)
```env
OAUTH_SERVER_URL=https://your-oauth-provider.com
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
```

---

## 📱 Access Your Site

### Patient Portal
```
https://your-domain.com
```

### Admin Dashboard
```
https://your-domain.com/admin
```

### Staff Portal
```
https://your-domain.com/staff
```

---

## 🔐 Security Checklist

- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Set strong database password
- [ ] Configure environment variables in Vercel
- [ ] Enable database backups
- [ ] Set up monitoring and alerts
- [ ] Review security headers
- [ ] Enable rate limiting
- [ ] Configure CORS properly

---

## 📈 Monitoring & Maintenance

### View Logs
1. Go to Vercel dashboard
2. Select your project
3. Click **"Deployments"**
4. Click deployment → **"Logs"**

### Monitor Performance
1. Go to **"Analytics"** tab
2. View request counts, response times, errors
3. Set up alerts for errors

### Update Application
```bash
# Make changes locally
git add .
git commit -m "Update clinic system"
git push origin main

# Vercel automatically redeploys
# Check deployment status in dashboard
```

---

## 💾 Backup & Recovery

### Automated Backups
Most MySQL providers (AWS RDS, PlanetScale, DigitalOcean) offer automated backups.

### Manual Backup
```bash
mysqldump -h your-host -u your-user -p your-database > backup.sql
```

### Restore from Backup
```bash
mysql -h your-host -u your-user -p your-database < backup.sql
```

---

## 🆘 Troubleshooting

### Site shows "404 Not Found"
- Check Vercel deployment status
- Verify environment variables are set
- Check database connection

### Database connection error
- Verify `DATABASE_URL` in environment variables
- Check database is running and accessible
- Test connection locally first

### Slow performance
- Check Vercel analytics for bottlenecks
- Optimize database queries
- Enable caching headers
- Use CDN (Cloudflare)

### Application crashes
- Check Vercel logs for errors
- Verify all environment variables are set
- Check database migrations ran successfully
- Restart deployment

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Node.js Docs**: https://nodejs.org/docs/
- **MySQL Docs**: https://dev.mysql.com/doc/
- **TRPC Docs**: https://trpc.io/docs/

---

## 🎯 Next Steps

1. ✅ Push code to GitHub
2. ✅ Create `.env.production` file
3. ✅ Deploy to Vercel
4. ✅ Set up database
5. ✅ Configure custom domain
6. ✅ Test all workflows
7. ✅ Set up monitoring
8. ✅ Go live!

**Your clinic system is now live and ready to use! 🎉**

---

## 💡 Pro Tips

- **Use Vercel Preview Deployments**: Every git push creates a preview URL for testing
- **Enable Auto-Revert**: Vercel can automatically revert failed deployments
- **Use Environment Variable Groups**: Organize variables by environment (dev, staging, prod)
- **Monitor Costs**: Set up Vercel billing alerts to track usage
- **Use Vercel Analytics**: Built-in analytics for performance monitoring
- **Enable Error Tracking**: Integrate Sentry for error monitoring

---

## 📊 Expected Costs (Monthly)

| Service | Cost |
|---------|------|
| Vercel Hosting | Free - $20 |
| MySQL Database | $10 - $50 |
| Domain Name | $10 - $15 |
| **Total** | **$20 - $85** |

*Costs vary based on usage and selected tier*

---

**Congratulations! Your clinic system is now deployed as a permanent website.** 🚀
