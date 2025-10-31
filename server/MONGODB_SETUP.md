# MongoDB Setup Guide

## Quick Setup

### Option 1: MongoDB Atlas (Cloud - Recommended)

1. **Create Free Account:**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free account

2. **Create Cluster:**
   - Choose "Free" tier (M0)
   - Select a cloud provider and region
   - Click "Create Cluster"

3. **Create Database User:**
   - Go to "Database Access" → "Add New Database User"
   - Choose "Password" authentication
   - Set username and password (save these!)
   - Set privileges: "Atlas admin" or "Read and write to any database"

4. **Whitelist IP Address:**
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP address

5. **Get Connection String:**
   - Go to "Clusters" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - **IMPORTANT:** If your password contains special characters (@, #, $, etc.), URL-encode them:
     - `@` becomes `%40`
     - `#` becomes `%23`
     - `$` becomes `%24`
     - Or use Node.js: `encodeURIComponent('yourpassword')`
   - Replace `<password>` with your database user password (URL-encoded if needed)
   - Add database name: `/zocc_erp` before the `?`

### Option 2: Local MongoDB

1. **Install MongoDB:**
   ```bash
   # macOS
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   
   # Or download from: https://www.mongodb.com/try/download/community
   ```

2. **Connection String:**
   ```
   mongodb://localhost:27017/zocc_erp
   ```

## Update .env File

Add MongoDB connection string to your `server/.env` file:

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Gmail SMTP
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/zocc_erp?retryWrites=true&w=majority

# OR for local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/zocc_erp
```

## Install Dependencies

```bash
cd server
npm install
```

## Start Server

```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
✅ Gmail SMTP server ready
Server running on http://localhost:4000
```

## Database Collections

The server will automatically create these collections:

1. **otps** - Stores OTP codes (auto-expires after 5 minutes)
2. **users** - Stores registered user data

## API Endpoints

### POST `/api/auth/register`
Register a new user (after email verification).

**Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### Existing Endpoints (now using MongoDB):
- `POST /api/auth/request-otp` - Stores OTP in MongoDB
- `POST /api/auth/verify-otp` - Verifies OTP from MongoDB

## Troubleshooting

**Error: "MongooseServerSelectionError"**
- Check your connection string is correct
- Verify IP address is whitelisted (Atlas)
- Check internet connection

**Error: "Authentication failed"**
- Verify database username and password in connection string
- Check database user has proper permissions

**Connection timeout**
- Check firewall settings
- Verify MongoDB service is running (local)
- Check Atlas cluster is active

## Production Notes

- Use environment-specific connection strings
- Enable MongoDB authentication
- Use connection pooling
- Consider adding password hashing (bcrypt) for stored passwords
- Implement rate limiting for registration

