# Coolify Quick Start Guide

Deploy ZOCC-ERP to Coolify in minutes!

## Prerequisites

- ✅ Coolify instance running
- ✅ GitHub/GitLab repository with this code
- ✅ MongoDB Atlas account (recommended)
- ✅ Gmail account with App Password

## Quick Deployment Steps

### 1. Setup MongoDB Atlas (Recommended)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create a cluster (Free M0 tier)
4. Create database user (save credentials!)
5. Network Access → Add IP Address → Add `0.0.0.0/0` (or your server IP)
6. Database → Connect → Get connection string
7. Replace `<password>` with your password

**Connection string format:**
```
mongodb+srv://username:password@cluster.mongodb.net/zocc_erp
```

### 2. Setup Gmail App Password

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. App Passwords → Generate new app password → Mail
4. Copy the 16-character password (no spaces)

### 3. Deploy to Coolify

#### Option A: Docker Compose (Easiest)

1. **Create New Resource**
   - Type: Docker Compose
   - Repository: Connect your Git repo
   - Branch: `main` (or your default branch)
   - Dockerfile Location: Leave default

2. **Add Environment Variables**
   
   In Coolify, add these:
   ```bash
   # MongoDB
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zocc_erp
   
   # Gmail
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   
   # Security
   JWT_SECRET=generate-strong-random-string-here
   
   # CORS (update with your domains)
   CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
   
   # Frontend
   VITE_API_URL=https://api.yourdomain.com
   ```

3. **Configure Domains**
   - Backend: `api.yourdomain.com`
   - Frontend: `yourdomain.com`

4. **Deploy!**
   - Click "Deploy"
   - Wait for build (~3-5 minutes)
   - Check logs if issues

#### Option B: Separate Services

**Backend Service:**
1. Create Docker Compose resource
2. Path: `server/`
3. Port: `4000`
4. Environment: Backend vars above
5. Domain: `api.yourdomain.com`

**Frontend Service:**
1. Create Docker Compose resource
2. Path: `my-app/`
3. Port: `4173`
4. Environment:
   ```bash
   VITE_API_URL=https://api.yourdomain.com
   ```
5. Domain: `yourdomain.com`

**MongoDB Service (if not using Atlas):**
1. Add MongoDB service in Coolify
2. Update backend `MONGODB_URI` to: `mongodb://mongodb:27017/zocc_erp`

## Post-Deployment Verification

### 1. Check Backend
```bash
curl https://api.yourdomain.com/health
```
Should return: `{"status":"ok"}`

### 2. Test Email
```bash
curl https://api.yourdomain.com/test-email
```
Should return success message

### 3. Open Frontend
Visit `https://yourdomain.com`
- Should see login page
- Try registering a user

## Common Issues & Solutions

### ❌ MongoDB Connection Failed
**Solution:** 
- Verify connection string format
- Check IP whitelist in Atlas
- Verify credentials

### ❌ Email Not Sending
**Solution:**
- Verify App Password (16 chars, no spaces)
- Check SMTP_USER is full email
- See logs: `curl https://api.yourdomain.com/test-email`

### ❌ CORS Error
**Solution:**
- Add frontend domain to `CORS_ORIGIN`
- Include `https://` protocol
- Add both www and non-www versions

### ❌ Frontend Can't Reach Backend
**Solution:**
- Verify `VITE_API_URL` is correct
- Check backend is running
- Verify SSL certificates installed

### ❌ Build Fails
**Solution:**
- Check build logs in Coolify
- Verify Dockerfiles are correct
- Check for syntax errors

## Environment Variables Reference

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `SMTP_USER` | Gmail address | `your@gmail.com` |
| `SMTP_PASS` | Gmail app password | `abcd efgh ijkl mnop` |
| `JWT_SECRET` | Secret key for tokens | Generate random |
| `CORS_ORIGIN` | Allowed origins | `https://yourdomain.com` |
| `VITE_API_URL` | Backend URL | `https://api.yourdomain.com` |

### Optional
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | `4000` |
| `NODE_ENV` | Environment | `production` |

## Security Checklist

- [ ] JWT_SECRET is strong random string
- [ ] MongoDB has authentication enabled
- [ ] Gmail App Password is correct
- [ ] CORS_ORIGIN only includes your domains
- [ ] SSL certificates installed
- [ ] Environment variables are secure
- [ ] MongoDB IP whitelist configured
- [ ] Regular backups enabled

## Scaling

### Auto-scaling
Coolify supports auto-scaling:
1. Resource settings
2. Enable auto-scaling
3. Set min/max instances
4. Set CPU/memory limits

### Load Balancing
- Coolify handles load balancing automatically
- Uses nginx/traefik internally
- SSL termination included

## Monitoring

### View Logs
```
Coolify → Your Resource → Logs
```

### Health Checks
- Backend: `GET /health`
- Frontend: Root endpoint
- MongoDB: Built-in ping

### Metrics
- CPU usage
- Memory usage
- Request logs
- Error tracking

## Backup & Recovery

### MongoDB Backups
**Atlas:**
- Automatic daily backups
- Point-in-time recovery
- 7-day retention (M0)

**Self-hosted:**
```bash
# Manual backup
mongodump --uri="mongodb+srv://..." --out=/backup

# Restore
mongorestore --uri="mongodb+srv://..." /backup/zocc_erp
```

### Application Backups
- Code: Git repository
- Config: Export from Coolify
- Data: MongoDB backups

## Update Process

### Manual Update
1. Push code to Git
2. Coolify auto-detects
3. Click "Deploy" in Coolify
4. Monitor logs

### Auto-deploy
1. Settings → Auto-deploy
2. Enable for main branch
3. Optional: PR previews

## Cost Estimation

### MongoDB Atlas (Free Tier)
- Free M0 cluster
- 512 MB storage
- Shared CPU/RAM

### Coolify Hosting
- Varies by provider
- VPS: $5-20/month
- Cloud: $20+/month

### Email
- Gmail: Free
- 500 emails/day (free tier)

## Next Steps

1. ✅ Verify deployment
2. ✅ Test all features
3. ✅ Configure monitoring
4. ✅ Setup backups
5. ✅ Document access
6. ✅ Share with team

## Support

- Coolify Docs: https://coolify.io/docs
- MongoDB Docs: https://docs.mongodb.com
- Project Issues: Check logs in Coolify

## Need Help?

1. Check logs in Coolify
2. Verify environment variables
3. Test each service individually
4. Check COOLIFY.md for detailed guide

