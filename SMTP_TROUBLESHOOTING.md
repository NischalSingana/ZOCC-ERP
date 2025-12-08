# SMTP Troubleshooting Guide

## Problem
SMTP works on localhost but fails in Coolify with "Connection timeout" error.

## Root Cause
Your hosting provider (Coolify server) is blocking outbound SMTP connections on ports 587 and 465. This is common for security reasons (to prevent spam).

## What I've Fixed

### 1. **Improved SMTP Configuration**
- Added connection timeout settings (10 seconds)
- Added TLS/SSL configuration
- Added debug logging
- Made SMTP host configurable via `SMTP_HOST` environment variable

### 2. **Automatic Port Fallback**
- Tries port 587 (STARTTLS) first
- Automatically falls back to port 465 (SSL) if 587 fails
- Tests both ports on startup

### 3. **Retry Logic**
- Automatically retries with alternative port if first attempt fails
- Better error messages with specific port information

### 4. **SMTP Diagnostic Endpoint**
- New endpoint: `GET /api/smtp/test`
- Tests both ports and reports which ones work
- Provides recommendations

## How to Use

### Test SMTP Connectivity
After deploying, visit:
```
https://backend.nischalsingana.com/api/smtp/test
```

This will show:
- Which ports are accessible
- Current SMTP configuration
- Specific error messages
- Recommendations

### Check Backend Logs
After deployment, check logs for:
- `✅ Outlook SMTP ready (port 587)` - Port 587 works
- `✅ Outlook SMTP ready (port 465)` - Port 465 works
- `❌ Outlook SMTP connection failed` - Both ports blocked

## Solutions

### Solution 1: Contact Your Hosting Provider (Recommended)
Ask them to:
1. **Unblock outbound SMTP ports** (587, 465)
2. **Whitelist** `smtp.office365.com`
3. **Allow outbound connections** to Microsoft's SMTP servers

**Example message:**
> "I need to send emails from my application using Microsoft Outlook SMTP. Can you please unblock outbound connections to smtp.office365.com on ports 587 and 465? This is for legitimate application use."

### Solution 2: Use Microsoft Graph API (Alternative)
Instead of SMTP, use Microsoft Graph API which uses HTTPS (port 443 - usually open).

**Advantages:**
- Uses HTTPS (port 443) - rarely blocked
- More reliable
- Better error handling
- Microsoft's recommended approach

**Implementation:** Would require code changes to use Graph API instead of SMTP.

### Solution 3: Use Email Relay Service
Use a service like SendGrid, Mailgun, or Resend that your network allows, then forward through Outlook.

### Solution 4: VPN/Proxy (Not Recommended)
Route SMTP through a VPN or proxy, but this adds complexity.

## Current Workaround

The code now:
- ✅ Still generates OTP even if email fails
- ✅ Logs OTP to console for testing
- ✅ Returns OTP in development mode
- ✅ Doesn't crash the application

## Environment Variables

Make sure these are set in Coolify:

```env
SMTP_USER=zeroone@kluniversity.in
SMTP_PASS=your-password
SMTP_HOST=smtp.office365.com  # Optional, defaults to smtp.office365.com
```

## Next Steps

1. **Deploy the updated code** to Coolify
2. **Test SMTP connectivity**: Visit `/api/smtp/test` endpoint
3. **Check logs** to see which port (if any) works
4. **Contact hosting provider** if both ports are blocked
5. **Consider Microsoft Graph API** as a long-term solution

## Testing

After deployment:
1. Request an OTP - it should work (OTP generated even if email fails)
2. Check backend logs for SMTP status
3. Visit `/api/smtp/test` to see detailed diagnostics
4. Check if OTP is in logs (for testing purposes)

## Expected Behavior

### If SMTP Works:
- Email is sent successfully
- User receives OTP via email
- Logs show: `✅ OTP email sent to {email}`

### If SMTP Fails:
- OTP is still generated and stored
- Application continues working
- Logs show: `⚠️ SMTP Error (OTP still generated)`
- OTP visible in logs for testing

## Support

If you need help:
1. Check `/api/smtp/test` endpoint results
2. Share backend logs showing SMTP errors
3. Contact your hosting provider about port access
4. Consider implementing Microsoft Graph API

---

**Last Updated:** After implementing improved SMTP configuration with port fallback and retry logic.


