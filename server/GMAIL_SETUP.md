# Gmail SMTP Setup Guide - Fix Authentication Failed

## Quick Fix Steps

### Step 1: Enable 2-Step Verification (Required!)
1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification" section
3. Click "Get Started" or "Turn on"
4. Follow the steps to enable it

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
   - OR: Google Account → Security → 2-Step Verification → App Passwords
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Enter name: `ZOCC ERP Server`
5. Click **Generate**
6. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
7. Remove spaces when using it in `.env` file

### Step 3: Update .env File
```env
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Gmail Configuration
SMTP_USER=yourname@gmail.com
SMTP_PASS=abcdefghijklmnop
```

**Important:**
- Use your **full Gmail address** (e.g., `yourname@gmail.com`)
- Use the **16-character App Password** (no spaces, no dashes)
- Do NOT use your regular Gmail password

### Step 4: Test Connection
```bash
# Restart your server
npm run dev

# In another terminal, test the connection:
curl http://localhost:4000/test-email
```

## Common Issues & Solutions

### ❌ Error: "Invalid login" or "Authentication failed"
**Solution:**
- ✅ Make sure 2-Step Verification is **enabled**
- ✅ Use **App Password**, not regular password
- ✅ Remove spaces from App Password: `abcd efgh ijkl mnop` → `abcdefghijklmnop`
- ✅ Check `.env` file has no quotes around values
- ✅ Restart server after changing `.env`

### ❌ Error: "Username and Password not accepted"
**Solution:**
- The App Password might be wrong
- Generate a new App Password and try again
- Make sure you copied the entire 16-character password

### ❌ Error: "Less secure app access"
**Solution:**
- Google no longer supports "Less secure apps"
- You **MUST** use App Passwords with 2-Step Verification enabled
- There's no way around this - it's a security requirement

### ❌ Still not working?
1. Check `.env` file format:
   ```env
   # ✅ Correct
   SMTP_USER=yourname@gmail.com
   SMTP_PASS=abcdefghijklmnop
   
   # ❌ Wrong (has quotes)
   SMTP_USER="yourname@gmail.com"
   SMTP_PASS="abcdefghijklmnop"
   ```

2. Verify App Password format:
   - Should be exactly 16 characters
   - No spaces, no dashes
   - All lowercase letters

3. Test your App Password manually:
   - Try logging into Gmail with the App Password
   - If it doesn't work, generate a new one

4. Check server logs:
   ```bash
   # Look for detailed error messages
   npm run dev
   ```

## Alternative: Use OAuth2 (Advanced)
If App Passwords don't work for your account type, you can use OAuth2:
- More complex setup
- Requires Google Cloud Console project
- Better for production

## Verification Checklist
- [ ] 2-Step Verification is enabled
- [ ] App Password generated from Google Account
- [ ] `.env` file has correct credentials (no quotes)
- [ ] App Password has no spaces (16 characters total)
- [ ] SMTP_USER is full Gmail address (yourname@gmail.com)
- [ ] Server restarted after `.env` changes
- [ ] Test endpoint shows success: `curl http://localhost:4000/test-email`

## Need Help?
1. Check server console for detailed error messages
2. Test connection: `curl http://localhost:4000/test-email`
3. Verify your App Password format
4. Try generating a new App Password

