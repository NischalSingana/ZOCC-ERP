# OTP Email Server

Simple Express server for sending email OTPs via Gmail SMTP.

## Setup

1. Create `.env` file in the `server` directory:
```bash
touch .env
```

2. Update `.env` with your credentials:
```env
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Gmail SMTP
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/zocc_erp?retryWrites=true&w=majority
# OR for local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/zocc_erp
```

**Important:**
- **Gmail:** Use Gmail App Password (not regular password). Enable 2-Step Verification and generate an App Password from Google Account settings.
- **MongoDB:** Get connection string from MongoDB Atlas or use local MongoDB.

3. Install dependencies:
```bash
npm install
```

4. Start the server:
```bash
npm run dev
```

## API Endpoints

### POST `/api/auth/request-otp`
Request an OTP to be sent to an email.

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "expiresIn": 300
}
```

### POST `/api/auth/verify-otp`
Verify an OTP.

**Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

## Notes

- OTPs expire in 5 minutes
- Maximum 5 verification attempts per OTP
- In-memory storage (sufficient for 200-400 users)
- For production, consider using Redis or a database

