# Coolify Deployment Guide

This guide explains how to deploy the ZOCC-ERP application to Coolify.

## Overview

Coolify will deploy:
1. **MongoDB** - Database service
2. **Backend Server** - Express API server
3. **Frontend** - React application served via Vite preview

## Prerequisites

- Coolify instance running
- GitHub/GitLab repository
- MongoDB Atlas account (or use Coolify's MongoDB service)
- Gmail account with App Password

## Deployment Options

### Option 1: Deploy with Docker Compose (Recommended for Coolify)

Use the `docker-compose.yml` file for a complete stack deployment.

### Option 2: Deploy Services Separately

Deploy each service as separate applications in Coolify.

## Environment Variables

### For Backend Service

Create these environment variables in Coolify:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://username:password@host:port/zocc_erp
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zocc_erp

# Server Configuration
PORT=4000
NODE_ENV=production

# CORS Configuration (add your domain)
CORS_ORIGIN=https://your-frontend-domain.com

# JWT Secret (generate strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Gmail SMTP
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password-16chars
```

### For Frontend Service

```bash
# API URL (point to your backend domain)
VITE_API_URL=https://api.yourdomain.com
```

## MongoDB Setup

### Option A: MongoDB Atlas (Recommended)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Create database user
4. Whitelist Coolify IP (or 0.0.0.0/0 for testing)
5. Get connection string
6. Update `MONGODB_URI` in Coolify

### Option B: Coolify MongoDB Service

1. In Coolify, add MongoDB as a service
2. Use connection string: `mongodb://mongodb:27017/zocc_erp`

## Gmail App Password Setup

1. Go to Google Account: https://myaccount.google.com/
2. Enable 2-Step Verification
3. Go to Security → 2-Step Verification → App Passwords
4. Generate "Mail" app password
5. Copy 16-character password (no spaces)
6. Add to `SMTP_PASS` in Coolify

## Step-by-Step Deployment

### Method 1: Docker Compose Deployment

1. **Add New Resource** in Coolify
2. **Select "Docker Compose"**
3. **Connect Repository**:
   - Connect your Git repository
   - Select branch (main/master)
4. **Configure Build**:
   - Build Command: (leave blank, uses Dockerfile)
   - Dockerfile Location: (uses default)
5. **Set Environment Variables**:
   - Add all environment variables listed above
6. **Set Domain**:
   - Assign domain for your application
   - Use wildcard SSL or Let's Encrypt
7. **Deploy**

### Method 2: Separate Services

#### Deploy Backend

1. **Add New Resource** → **Docker Compose**
2. **Repository**: Your git repo, path: `server/`
3. **Build**: Uses `server/Dockerfile`
4. **Environment**: Add backend variables
5. **Port**: 4000
6. **Domain**: `api.yourdomain.com`

#### Deploy Frontend

1. **Add New Resource** → **Docker Compose**
2. **Repository**: Your git repo, path: `my-app/`
3. **Build**: Uses `my-app/Dockerfile`
4. **Environment**: 
   - `VITE_API_URL=https://api.yourdomain.com`
5. **Port**: 4173
6. **Domain**: `yourdomain.com`

#### Deploy MongoDB (Optional)

1. **Add Service** → **MongoDB**
2. Use Coolify's managed MongoDB
3. Update backend `MONGODB_URI` accordingly

## CORS Configuration

Update `CORS_ORIGIN` in backend environment:

```bash
CORS_ORIGIN=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

## SSL/TLS

Coolify handles SSL automatically:
- Uses Let's Encrypt for free SSL
- Auto-renewal configured
- HTTPS redirect enabled

## Post-Deployment Verification

1. **Check Backend Health**:
   ```bash
   curl https://api.yourdomain.com/health
   ```

2. **Check Frontend**:
   Open `https://yourdomain.com` in browser

3. **Test Email**:
   ```bash
   curl https://api.yourdomain.com/test-email
   ```

4. **Test Registration**:
   - Register new user
   - Verify OTP sent to email
   - Complete registration

## Monitoring & Logs

### View Logs in Coolify
1. Navigate to your resource
2. Click "Logs" tab
3. View real-time logs

### Health Checks
- Backend: `GET /health`
- Frontend: Root endpoint
- Check logs for health check status

## Troubleshooting

### Backend Issues

**Connection to MongoDB fails:**
- Check `MONGODB_URI` format
- Verify MongoDB is accessible from Coolify
- Check network/firewall settings

**Email not sending:**
- Verify Gmail App Password
- Check `SMTP_USER` and `SMTP_PASS`
- Test with `/test-email` endpoint
- Check logs for SMTP errors

**CORS errors:**
- Add frontend domain to `CORS_ORIGIN`
- Include both www and non-www
- Include protocol (https://)

### Frontend Issues

**Cannot connect to backend:**
- Verify `VITE_API_URL` is correct
- Check CORS configuration
- Verify backend is running

**Build fails:**
- Check build logs in Coolify
- Verify all dependencies in package.json
- Check Dockerfile configuration

### General Issues

**Deployment fails:**
- Check build logs
- Verify Dockerfiles are correct
- Ensure port configurations match
- Check resource limits

**Services can't communicate:**
- Verify they're on same network (for docker-compose)
- Check internal service URLs
- Use service names for internal communication

## Rollback

In Coolify:
1. Navigate to your resource
2. Go to "Deployments" tab
3. Select previous deployment
4. Click "Rollback"

## Scaling

### Horizontal Scaling
- Coolify supports auto-scaling
- Configure in resource settings
- Set min/max instances

### Resource Limits
- Set CPU/Memory limits per service
- Monitor usage in Coolify dashboard
- Adjust based on traffic

## Backup Strategy

### MongoDB Backup
- Use MongoDB Atlas backup (if using Atlas)
- Or configure periodic snapshots in Coolify
- Test restore procedures

### Application Backup
- Code: Git repository
- Environment: Export from Coolify
- Data: MongoDB backups

## Updates & CI/CD

### Manual Updates
1. Push to git repository
2. Coolify auto-detects changes
3. Trigger deployment in Coolify

### Auto-Deploy
Configure in Coolify:
- Auto-deploy on push to main/master
- Branch-based deployments
- Pull request previews

## Production Checklist

- [ ] Environment variables secured
- [ ] MongoDB backed up and monitored
- [ ] SSL/TLS configured
- [ ] CORS properly configured
- [ ] Email sending verified
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Resource limits set
- [ ] Domain DNS configured
- [ ] Error logging setup
- [ ] Rate limiting considered
- [ ] Database indexes optimized

## Support

- Coolify Documentation: https://coolify.io/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Application Issues: Check logs in Coolify

