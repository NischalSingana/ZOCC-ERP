# Deployment Guide for Coolify

This guide will help you deploy the ZOCC-ERP application to Coolify with proper configuration.

## Issues Fixed

1. ✅ **CORS Error**: Added `spendingcalculator.xyz` domain to allowed origins
2. ✅ **SMTP Configuration**: Added missing `SMTP_HOST` environment variable
3. ✅ **API URL Detection**: Updated frontend to correctly detect backend URL for both domains

## Prerequisites

- Coolify instance running
- Domain names configured:
  - Frontend: `spendingcalculator.xyz` (or your domain)
  - Backend: `backend.spendingcalculator.xyz`
- MongoDB database (can be external or in Coolify)
- Cloudflare R2 bucket configured
- Outlook/Office365 email account for SMTP

## Environment Variables for Backend (Coolify)

Set these environment variables in your Coolify backend service:

```bash
# Server Configuration
NODE_ENV=production
PORT=4000

# Database - Use your MongoDB connection string
MONGODB_URI=mongodb://your-mongodb-host:27017/zocc_erp

# JWT Secret - CHANGE THIS!
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string

# CORS - Add your frontend domains
CORS_ORIGIN=https://spendingcalculator.xyz,https://www.spendingcalculator.xyz

# Admin Emails - Comma-separated list
ADMIN_EMAILS=admin@example.com,youremail@example.com

# SMTP Configuration - CRITICAL FOR OTP EMAILS
SMTP_HOST=smtp.office365.com
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-email-password

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-r2-public-url.com
```

## Environment Variables for Frontend (Coolify)

Set these build-time environment variables in your Coolify frontend service:

```bash
# API URL - Point to your backend
VITE_API_URL=https://backend.spendingcalculator.xyz
```

## Deployment Steps

### 1. Backend Deployment

1. In Coolify, create a new service for the backend
2. Set the source to your Git repository
3. Set the base directory to `server`
4. Configure the Dockerfile path: `server/Dockerfile`
5. Add all the backend environment variables listed above
6. Set the port mapping: `4000:4000`
7. Deploy the service

### 2. Frontend Deployment

1. In Coolify, create a new service for the frontend
2. Set the source to your Git repository
3. Set the base directory to `my-app`
4. Configure the Dockerfile path: `my-app/Dockerfile`
5. Add the frontend environment variable: `VITE_API_URL=https://backend.spendingcalculator.xyz`
6. Set the port mapping (check your frontend Dockerfile for the port)
7. Deploy the service

### 3. Domain Configuration

1. Point `spendingcalculator.xyz` to your frontend service in Coolify
2. Point `backend.spendingcalculator.xyz` to your backend service in Coolify
3. Enable SSL/TLS certificates in Coolify for both domains

## Testing SMTP Configuration

After deployment, test your SMTP configuration:

### Test 1: Check SMTP Connection
```bash
curl https://backend.spendingcalculator.xyz/test-email
```

Expected response:
```json
{
  "success": true,
  "message": "Outlook SMTP connection successful!",
  "email": "your-email@outlook.com"
}
```

### Test 2: Send Test Email
```bash
curl -X POST https://backend.spendingcalculator.xyz/test-email-send \
  -H "Content-Type: application/json" \
  -d '{"to": "your-test-email@example.com"}'
```

### Test 3: SMTP Diagnostic
```bash
curl https://backend.spendingcalculator.xyz/api/smtp/test
```

This will test both port 587 and 465 and provide recommendations.

## Common Issues and Solutions

### Issue 1: CORS Error
**Symptom**: "No 'Access-Control-Allow-Origin' header is present"

**Solution**:
- Verify `CORS_ORIGIN` environment variable includes your frontend domain
- Check that both domains are using HTTPS (not mixing HTTP/HTTPS)
- Clear browser cache and try again

### Issue 2: OTP Emails Not Sending
**Symptom**: OTP request succeeds but no email received

**Solutions**:
1. **Check SMTP credentials**:
   - Verify `SMTP_USER` and `SMTP_PASS` are correct
   - Make sure you're using an app-specific password if 2FA is enabled
   
2. **Check SMTP ports**:
   - Port 587 (TLS) is preferred
   - Port 465 (SSL) is fallback
   - Contact Coolify support if both ports are blocked
   
3. **Check server logs**:
   ```bash
   # In Coolify, view backend logs
   # Look for SMTP connection messages
   ```

4. **Test SMTP manually**:
   - Use the test endpoints mentioned above
   - Check if emails go to spam folder

### Issue 3: Database Connection Failed
**Symptom**: "Database not connected" error

**Solution**:
- Verify `MONGODB_URI` is correct
- If using MongoDB in Coolify, use the internal service name
- If using external MongoDB, ensure firewall allows connections

### Issue 4: Frontend Can't Connect to Backend
**Symptom**: Network errors in browser console

**Solutions**:
1. Verify `VITE_API_URL` is set correctly during build
2. Check that backend domain is accessible: `curl https://backend.spendingcalculator.xyz/health`
3. Verify SSL certificates are valid for both domains
4. Check browser console for the detected API URL

## Verification Checklist

After deployment, verify:

- [ ] Frontend loads at `https://spendingcalculator.xyz`
- [ ] Backend health check works: `https://backend.spendingcalculator.xyz/health`
- [ ] SMTP test passes: `https://backend.spendingcalculator.xyz/test-email`
- [ ] Can request OTP (check email)
- [ ] Can verify OTP and register
- [ ] Can login
- [ ] Database operations work (create/read data)
- [ ] File uploads work (R2 storage)

## SMTP Troubleshooting for Coolify/Docker

If SMTP is not working in Docker but works locally:

### 1. Port Blocking
Many hosting providers block SMTP ports (25, 587, 465) to prevent spam.

**Check with Coolify/hosting provider**:
- Ask if outbound SMTP ports are blocked
- Request to whitelist ports 587 and 465

### 2. Alternative: Use Microsoft Graph API
If SMTP ports are blocked, consider using Microsoft Graph API instead:
- Requires Azure AD app registration
- Uses HTTPS (port 443) which is never blocked
- More reliable for production

### 3. Alternative: Use SendGrid/Mailgun
If Outlook SMTP doesn't work:
- Sign up for SendGrid or Mailgun
- Update SMTP configuration:
  ```bash
  SMTP_HOST=smtp.sendgrid.net  # or smtp.mailgun.org
  SMTP_USER=apikey              # SendGrid uses 'apikey' as username
  SMTP_PASS=your-sendgrid-api-key
  ```

## Support

If you encounter issues:

1. Check backend logs in Coolify
2. Check frontend browser console
3. Test SMTP using the diagnostic endpoints
4. Verify all environment variables are set correctly
5. Ensure domains have valid SSL certificates

## Security Notes

- Never commit `.env` files to Git
- Use strong, random JWT_SECRET
- Use app-specific passwords for email accounts with 2FA
- Keep R2 credentials secure
- Regularly rotate secrets
