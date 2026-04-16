# 🚀 Clinic System - Vercel Deployment Guide

## Overview

This guide will help you deploy the Clinic System to production on **Vercel** with a free **PlanetScale** MySQL database in **15 minutes**.

**Cost**: **FREE** (Vercel + PlanetScale free tiers)

---

## 📋 Prerequisites

You'll need:
- GitHub account (free at https://github.com)
- Vercel account (free at https://vercel.com)
- PlanetScale account (free at https://planetscale.com)

---

## Step 1: Push Code to GitHub (5 minutes)

### 1.1 Create a GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `clinic-system`
3. Choose "Public" (easier for Vercel)
4. Click "Create repository"

### 1.2 Push Your Code

In your terminal:

```bash
cd /home/ubuntu/clinic-system-update

# Initialize git
git init
git add .
git commit -m "Initial clinic system commit with vital signs, doctor consultation, and medication collection features"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/clinic-system.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username**

---

## Step 2: Set Up PlanetScale Database (3 minutes)

### 2.1 Create PlanetScale Account

1. Go to https://planetscale.com
2. Sign up with GitHub (easiest)
3. Create a new organization

### 2.2 Create a Database

1. Click "Create a database"
2. Name it: `clinic-system`
3. Choose region closest to you
4. Click "Create database"

### 2.3 Get Connection String

1. Click on your database
2. Click "Connect"
3. Select "Node.js"
4. Copy the connection string (looks like: `mysql://...`)
5. **Save this - you'll need it in Step 3**

---

## Step 3: Deploy to Vercel (5 minutes)

### 3.1 Connect GitHub to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Paste your GitHub repository URL
4. Click "Import"

### 3.2 Configure Environment Variables

Vercel will ask for environment variables. Add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your PlanetScale connection string from Step 2.3 |
| `NODE_ENV` | `production` |

### 3.3 Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for deployment to complete
3. You'll get a URL like: `https://clinic-system-xxx.vercel.app`

---

## Step 4: Run Database Migrations (2 minutes)

### 4.1 Connect to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Link your project:
```bash
cd /home/ubuntu/clinic-system-update
vercel link
```

### 4.2 Run Migrations

```bash
# Run database migrations
npm run db:push

# Or with pnpm
pnpm db:push
```

---

## ✅ Your System is Live!

Your clinic system is now deployed and accessible at your Vercel URL!

### 🎯 Access Your System

**Main URL**: `https://clinic-system-xxx.vercel.app`

### 👥 Test Accounts

**Staff Login Credentials** (for testing):
- **Nurse**: Password `nurse123`
- **Doctor**: Password `doctor123`
- **Dispensary**: Password `dispensary123`
- **Admin**: Password `admin123`

### 📱 Test the Workflow

1. **Patient**: Register with SA ID `1234567890123`
2. **Nurse**: Record vital signs including HIV/AIDS test
3. **Doctor**: Create consultation and prescription
4. **Dispensary**: Collect medication
5. **Admin**: View analytics and reports

---

## 🔧 Troubleshooting

### Database Connection Error

**Problem**: "Database connection failed"

**Solution**:
1. Check your `DATABASE_URL` is correct in Vercel settings
2. Verify PlanetScale database is running
3. Check IP whitelist in PlanetScale (should allow all IPs)

### Deployment Failed

**Problem**: Build fails on Vercel

**Solution**:
1. Check Vercel logs for error details
2. Ensure all environment variables are set
3. Try redeploying: `vercel --prod`

### OAuth Not Working

**Problem**: "OAuth configuration error"

**Solution**:
This is expected in development. For production OAuth:
1. Set up OAuth provider (Google, Microsoft, etc.)
2. Add OAuth credentials to environment variables
3. Update `.env` with OAuth settings

---

## 📊 Monitoring Your System

### View Logs

```bash
vercel logs clinic-system-xxx
```

### Monitor Database

1. Go to PlanetScale dashboard
2. Click your database
3. View "Insights" tab for usage stats

### Check Performance

1. Go to Vercel dashboard
2. Click your project
3. View "Analytics" tab

---

## 🔐 Security Checklist

- [ ] Database connection string is secure (use environment variables)
- [ ] Set up HTTPS (automatic on Vercel)
- [ ] Enable POPIA compliance features
- [ ] Set up regular backups (PlanetScale does this automatically)
- [ ] Monitor access logs
- [ ] Update authentication credentials regularly

---

## 📈 Scaling (When You Need It)

### If You Exceed Free Tier

**Vercel**: 
- Free tier: 100GB bandwidth/month
- Upgrade: $20/month for more

**PlanetScale**:
- Free tier: 5GB storage
- Upgrade: $39/month for more

---

## 🆘 Support

For issues:

1. **Vercel Support**: https://vercel.com/support
2. **PlanetScale Support**: https://planetscale.com/support
3. **GitHub Issues**: Create an issue in your repository

---

## 🎉 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test all workflows
3. ✅ Share with your team
4. ✅ Monitor performance
5. ✅ Gather feedback
6. ✅ Make improvements

Your clinic system is now live and ready to transform healthcare delivery!

---

**Questions?** Refer to the troubleshooting section or check the Vercel/PlanetScale documentation.
