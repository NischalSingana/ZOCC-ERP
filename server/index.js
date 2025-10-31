import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from './db/connect.js';
import Otp from './models/Otp.js';
import User from './models/User.js';

// Load environment variables from .env file
dotenv.config();

// Debug: Log if .env is loaded (don't log actual credentials)
console.log('🔍 Environment check:');
console.log('  - SMTP_USER:', process.env.SMTP_USER ? `Set (${process.env.SMTP_USER.length} chars)` : 'NOT SET');
console.log('  - SMTP_PASS:', process.env.SMTP_PASS ? `Set (${process.env.SMTP_PASS.length} chars)` : 'NOT SET');
console.log('  - MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
console.log('  - PORT:', process.env.PORT || '4000 (default)');
console.log('  - CORS_ORIGIN:', process.env.CORS_ORIGIN || 'http://localhost:5173 (default)');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Enhanced CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for development, log for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_LENGTH = 6;
const MAX_VERIFY_ATTEMPTS = 5;

// JWT Secret (use env variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

function generateOTP() {
  return Array.from({ length: OTP_LENGTH }, () => 
    Math.floor(Math.random() * 10)
  ).join('');
}

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS // Gmail App Password
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify Gmail SMTP connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('\n❌ Gmail SMTP connection error:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('\n📋 Troubleshooting steps:');
    console.error('1. Make sure 2-Step Verification is ENABLED in your Google Account');
    console.error('2. Generate an App Password (not your regular password)');
    console.error('3. App Password steps: Google Account → Security → 2-Step Verification → App Passwords');
    console.error('4. Use the 16-character App Password (no spaces) in SMTP_PASS');
    console.error('5. Make sure SMTP_USER is your full Gmail address (e.g., yourname@gmail.com)');
    console.error('\n');
  } else {
    console.log('✅ Gmail SMTP server ready');
    console.log('📧 Connected to:', process.env.SMTP_USER);
  }
});

// Request OTP endpoint
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Check if OTP already exists and is still valid in MongoDB
    const existingOtp = await Otp.findOne({ 
      email: email.toLowerCase(),
      expiresAt: { $gt: new Date() }
    });
    
    if (existingOtp) {
      const timeLeft = Math.ceil((existingOtp.expiresAt - Date.now()) / 1000);
      return res.status(429).json({ 
        error: `Please wait ${timeLeft} seconds before requesting a new OTP` 
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Delete any old OTPs for this email
    await Otp.deleteMany({ email: email.toLowerCase() });

    // Save new OTP to MongoDB
    await Otp.create({
      email: email.toLowerCase(),
      otp,
      expiresAt,
      attempts: 0
    });

    // Send email using nodemailer with Gmail
    const mailOptions = {
      from: `"ZeroOne Coding Club" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Email Verification OTP - ZeroOne Coding Club ERP',
      text: `Your email verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0b1220;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #4f9cff; margin: 0; font-size: 32px; font-weight: bold;">ZeroOne Coding Club</h1>
              <p style="color: #60a5fa; margin: 8px 0 0 0; font-size: 18px;">ERP Portal</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); padding: 30px; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #fff; text-align: center;">Your email verification code is:</p>
              
              <div style="background: #0b1220; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid rgba(79, 156, 255, 0.3);">
                <h2 style="color: #4f9cff; font-size: 36px; letter-spacing: 12px; margin: 0; font-weight: bold; font-family: 'Courier New', monospace;">${otp}</h2>
              </div>
              
              <div style="background: rgba(0, 0, 0, 0.2); padding: 15px; border-radius: 6px; margin-top: 20px;">
                <p style="margin: 0; font-size: 14px; color: #e0e0e0; text-align: center;">
                  ⏱️ This code will expire in <strong>5 minutes</strong>
                </p>
              </div>
            </div>
            
            <div style="background: rgba(79, 156, 255, 0.1); padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #4f9cff;">
              <p style="margin: 0; font-size: 14px; color: #888; line-height: 1.6;">
                <strong>Security Notice:</strong> If you didn't request this verification code, please ignore this email. 
                Do not share this code with anyone.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 0; font-size: 12px; color: #666;">
                © ${new Date().getFullYear()} ZeroOne Coding Club. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send email using nodemailer
    const info = await transporter.sendMail(mailOptions);
    
    console.log('OTP email sent successfully:', {
      messageId: info.messageId,
      to: email,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'OTP sent to your email',
      expiresIn: OTP_TTL_MS / 1000 
    });
  } catch (error) {
    console.error('Error sending OTP via nodemailer:', error);
    console.error('Error code:', error.code);
    console.error('Error response:', error.response);
    
    // Handle specific nodemailer errors
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      return res.status(500).json({ 
        error: 'Gmail authentication failed. Please verify:\n' +
               '1. 2-Step Verification is enabled\n' +
               '2. You are using an App Password (not your regular password)\n' +
               '3. Your email and App Password are correct in .env file'
      });
    }
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      return res.status(500).json({ error: 'Connection to Gmail server failed. Please check your internet connection.' });
    }
    if (error.code === 'EENVELOPE') {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }
    
    res.status(500).json({ error: 'Failed to send OTP. Error: ' + (error.message || 'Unknown error') });
  }
});

// Verify OTP endpoint
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    // Find OTP in MongoDB
    const storedOtp = await Otp.findOne({ email: email.toLowerCase() });

    if (!storedOtp) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    // Check if expired
    if (new Date() > storedOtp.expiresAt) {
      await Otp.deleteOne({ _id: storedOtp._id });
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    // Check attempts
    if (storedOtp.attempts >= MAX_VERIFY_ATTEMPTS) {
      await Otp.deleteOne({ _id: storedOtp._id });
      return res.status(429).json({ error: 'Too many attempts. Please request a new OTP.' });
    }

    // Increment attempts
    storedOtp.attempts += 1;
    await storedOtp.save();

    // Verify OTP
    if (storedOtp.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    // OTP verified - create/update user with emailVerified: true
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { email: email.toLowerCase(), emailVerified: true },
      { upsert: true, new: true }
    );

    // Remove OTP from database
    await Otp.deleteOne({ _id: storedOtp._id });

    res.json({ 
      success: true, 
      message: 'Email verified successfully' 
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// Register user endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email was verified (user should exist with emailVerified: true from OTP step)
    const verifiedUser = await User.findOne({ 
      email: email.toLowerCase(),
      emailVerified: true
    });

    if (!verifiedUser) {
      return res.status(400).json({ error: 'Please verify your email first using OTP' });
    }

    // If user already has password, they're already registered
    if (verifiedUser.password) {
      return res.status(409).json({ error: 'Email already registered. Please login instead.' });
    }

    // Check if username is already taken
    const existingUsername = await User.findOne({ 
      username: username.toLowerCase(),
      _id: { $ne: verifiedUser._id }
    });

    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user with username and password
    verifiedUser.username = username.toLowerCase();
    verifiedUser.password = hashedPassword;
    await verifiedUser.save();
    
    const user = verifiedUser;

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email or username already exists' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Verify token endpoint (optional - for frontend to check auth status)
app.get('/api/auth/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test Gmail connection endpoint
app.get('/test-email', async (req, res) => {
  // Debug: Check what's loaded from .env
  const envCheck = {
    hasSMTP_USER: !!process.env.SMTP_USER,
    hasSMTP_PASS: !!process.env.SMTP_PASS,
    smtpUserLength: process.env.SMTP_USER?.length || 0,
    smtpPassLength: process.env.SMTP_PASS?.length || 0,
    smtpUserPreview: process.env.SMTP_USER ? 
      (process.env.SMTP_USER.substring(0, 5) + '...') : 'NOT SET',
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('SMTP') || key.includes('PORT') || key.includes('CORS')
    )
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ 
      error: 'SMTP credentials not configured. Check your .env file.',
      debug: envCheck,
      instructions: [
        '1. Make sure .env file is in the server/ directory',
        '2. Check .env file has SMTP_USER and SMTP_PASS (no quotes)',
        '3. Restart server after changing .env file',
        '4. Format: SMTP_USER=your-email@gmail.com (no spaces around =)'
      ]
    });
  }

  try {
    await transporter.verify();
    res.json({ 
      success: true, 
      message: 'Gmail SMTP connection successful!',
      email: process.env.SMTP_USER 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Gmail SMTP connection failed',
      details: {
        code: error.code,
        message: error.message,
        response: error.response
      },
      troubleshooting: [
        '1. Enable 2-Step Verification in your Google Account',
        '2. Generate an App Password at: myaccount.google.com/apppasswords',
        '3. Use the 16-character App Password (no spaces)',
        '4. Make sure SMTP_USER is your full Gmail address'
      ]
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

