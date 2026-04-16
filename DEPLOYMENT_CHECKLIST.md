# Clinic System - Deployment Checklist

## Pre-Deployment (Local Testing)

- [ ] All code committed to git
- [ ] `.env.production` file created with all required variables
- [ ] Database migrations tested locally (`pnpm db:push`)
- [ ] All workflows tested:
  - [ ] Patient registration
  - [ ] Nurse vital signs checklist with HIV/AIDS test
  - [ ] Doctor consultation and prescription
  - [ ] Medication collection station
- [ ] No console errors in browser
- [ ] No errors in server logs
- [ ] Build completes successfully (`pnpm build`)
- [ ] All tests pass (`pnpm test`)

## Deployment Platform Setup

### Vercel Deployment
- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Environment variables added to Vercel project
- [ ] Build settings configured:
  - [ ] Build Command: `pnpm install && pnpm build`
  - [ ] Output Directory: `dist`
  - [ ] Install Command: `pnpm install`
- [ ] Deployment triggered
- [ ] Deployment completed successfully
- [ ] No build errors in Vercel logs

### AWS EC2 Deployment
- [ ] EC2 instance created and running
- [ ] Security groups configured
- [ ] SSH key pair created and secured
- [ ] Node.js installed
- [ ] PM2 installed globally
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Application cloned and built
- [ ] PM2 process started
- [ ] Nginx reverse proxy configured

### DigitalOcean Deployment
- [ ] DigitalOcean account created
- [ ] App Platform app created
- [ ] GitHub repository connected
- [ ] Environment variables configured
- [ ] Database cluster created
- [ ] App deployed successfully
- [ ] No deployment errors

## Database Setup

- [ ] MySQL database created
- [ ] Database user created with strong password
- [ ] User permissions granted
- [ ] Connection string verified
- [ ] Database migrations applied (`pnpm db:push`)
- [ ] Tables created successfully:
  - [ ] `users`
  - [ ] `patients`
  - [ ] `queue_entries`
  - [ ] `vitalSignsChecklist`
  - [ ] `consultations`
  - [ ] `prescriptions`
  - [ ] `medicationCollectionStation`
- [ ] Backup strategy implemented
- [ ] Backup tested and verified

## Domain & DNS

- [ ] Domain name registered
- [ ] DNS records updated:
  - [ ] A record pointing to server IP
  - [ ] MX records for email (if applicable)
  - [ ] CNAME record for www subdomain
- [ ] DNS propagation verified (24-48 hours)
- [ ] SSL certificate installed
- [ ] HTTPS working on custom domain

## Security Configuration

- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] Security headers configured:
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] Strict-Transport-Security
  - [ ] Content-Security-Policy
- [ ] CORS configured for your domain only
- [ ] Rate limiting enabled
- [ ] Database password is strong (16+ characters)
- [ ] Environment variables not exposed in code
- [ ] API keys rotated
- [ ] Firewall rules configured
- [ ] Database access restricted to application server only

## Monitoring & Logging

- [ ] Application logging configured
- [ ] Error tracking enabled (Sentry or similar)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alert notifications set up:
  - [ ] Email alerts for errors
  - [ ] Slack integration (optional)
  - [ ] SMS alerts for critical issues (optional)
- [ ] Log rotation configured
- [ ] Log storage configured (CloudWatch, DataDog, etc.)

## Backup & Disaster Recovery

- [ ] Automated database backups enabled
- [ ] Backup frequency: Daily
- [ ] Backup retention: 30 days minimum
- [ ] Backup location: Separate from primary database
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] Recovery time objective (RTO): < 1 hour
- [ ] Recovery point objective (RPO): < 1 hour

## Email Configuration

- [ ] SMTP server configured
- [ ] Email templates created:
  - [ ] Patient registration confirmation
  - [ ] Appointment reminders
  - [ ] Prescription ready notification
  - [ ] Password reset
- [ ] Email sending tested
- [ ] Email delivery verified (check spam folder)
- [ ] Unsubscribe links working

## Testing on Production

- [ ] Patient registration workflow tested
- [ ] Nurse vital signs checklist tested:
  - [ ] All 8 vitals recordable
  - [ ] HIV/AIDS test visible
  - [ ] Progress updates real-time
- [ ] Doctor consultation tested
- [ ] Prescription creation tested
- [ ] Medication collection workflow tested
- [ ] Multi-device access tested (phone, tablet, desktop)
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
- [ ] Performance acceptable (< 3 second load time)
- [ ] No console errors in production

## Performance Optimization

- [ ] Database indexes created for common queries
- [ ] Query optimization completed
- [ ] Caching enabled (Redis or similar)
- [ ] CDN configured (Cloudflare or similar)
- [ ] Image optimization enabled
- [ ] Code minification verified
- [ ] Bundle size acceptable
- [ ] Lazy loading implemented for heavy components
- [ ] Database connection pooling configured

## Documentation

- [ ] README.md updated with production URL
- [ ] Deployment guide completed
- [ ] API documentation updated
- [ ] Database schema documented
- [ ] Environment variables documented
- [ ] Troubleshooting guide created
- [ ] Runbook created for common issues
- [ ] Team trained on deployment process

## Post-Deployment (First Week)

- [ ] Monitor error logs daily
- [ ] Check performance metrics
- [ ] Verify backups are running
- [ ] Test disaster recovery procedures
- [ ] Gather user feedback
- [ ] Fix any reported issues
- [ ] Optimize based on real-world usage
- [ ] Document lessons learned

## Post-Deployment (First Month)

- [ ] Review security audit logs
- [ ] Analyze usage patterns
- [ ] Optimize database queries based on usage
- [ ] Review and optimize costs
- [ ] Plan for scaling if needed
- [ ] Update documentation based on learnings
- [ ] Schedule regular maintenance windows
- [ ] Plan for future enhancements

## Ongoing Maintenance

- [ ] Weekly: Check error logs and alerts
- [ ] Weekly: Verify backups completed
- [ ] Monthly: Review performance metrics
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review security logs
- [ ] Quarterly: Full security audit
- [ ] Quarterly: Disaster recovery drill
- [ ] Annually: Penetration testing

## Sign-Off

- [ ] Project Manager: _________________ Date: _______
- [ ] DevOps/Infrastructure: _________________ Date: _______
- [ ] Security Lead: _________________ Date: _______
- [ ] Product Owner: _________________ Date: _______

## Notes

```
[Space for deployment notes, issues encountered, and resolutions]
```

---

## Quick Reference

### Deployment URLs
- **Production**: https://your-domain.com
- **Admin Dashboard**: https://your-domain.com/admin
- **Staff Portal**: https://your-domain.com/staff
- **API Base**: https://your-domain.com/api

### Important Contacts
- **DevOps Lead**: [Name] [Email] [Phone]
- **Database Admin**: [Name] [Email] [Phone]
- **Security Lead**: [Name] [Email] [Phone]
- **Support Team**: [Email] [Phone]

### Emergency Procedures
- **Database Down**: Contact DevOps Lead immediately
- **Application Crash**: Restart via PM2 or deployment platform
- **Security Breach**: Contact Security Lead and disable affected accounts
- **Data Loss**: Restore from latest backup

### Monitoring Dashboards
- **Vercel**: https://vercel.com/dashboard
- **Database**: [Your database provider dashboard]
- **Monitoring**: [Your monitoring tool URL]
- **Logs**: [Your logging tool URL]

---

**Deployment Status**: ☐ Not Started | ☐ In Progress | ☐ Completed | ☐ Live

**Last Updated**: [Date]
**Last Verified**: [Date]
