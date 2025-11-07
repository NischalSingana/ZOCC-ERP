import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import connectDB from './db/connect.js';
import Otp from './models/Otp.js';
import User from './models/User.js';
import Session from './models/Session.js';
import Submission from './models/Submission.js';
import Attendance from './models/Attendance.js';

// Load environment variables from .env file
dotenv.config();

// Debug: Log if .env is loaded (don't log actual credentials)
console.log('🔍 Environment check:');
console.log('  - SMTP_USER:', process.env.SMTP_USER ? `Set (${process.env.SMTP_USER.length} chars)` : 'NOT SET');
console.log('  - SMTP_PASS:', process.env.SMTP_PASS ? `Set (${process.env.SMTP_PASS.length} chars)` : 'NOT SET');
console.log('  - MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
console.log('  - PORT:', process.env.PORT || '4000 (default)');
console.log('  - CORS_ORIGIN:', process.env.CORS_ORIGIN || 'http://localhost:5173 (default)');
console.log('  - ADMIN_EMAILS:', process.env.ADMIN_EMAILS ? `Set (${process.env.ADMIN_EMAILS.split(',').length} admin(s))` : 'NOT SET - No admin access!');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In production, allow all origins if CORS_ORIGIN includes '*' or is not set
    // Otherwise, check against allowed origins
    if (allowedOrigins.includes('*') || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log but allow anyway for flexibility
      console.log('CORS request from origin:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400 // 24 hours
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
    const { studentFullName, idNumber, email, password } = req.body;

    if (!studentFullName || !idNumber || !email || !password) {
      return res.status(400).json({ error: 'Student full name, ID number, email, and password are required' });
    }

    if (studentFullName.length < 2 || studentFullName.length > 100) {
      return res.status(400).json({ error: 'Student full name must be between 2 and 100 characters' });
    }

    if (idNumber.length !== 10 || !/^\d+$/.test(idNumber)) {
      return res.status(400).json({ error: 'ID number must be exactly 10 digits' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Verify email format matches ID number
    const expectedEmail = `${idNumber}@kluniversity.in`;
    if (email.toLowerCase() !== expectedEmail.toLowerCase()) {
      return res.status(400).json({ error: 'Email must match ID number format: idnumber@kluniversity.in' });
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

    // Check if ID number is already taken
    const existingIdNumber = await User.findOne({ 
      idNumber: idNumber,
      _id: { $ne: verifiedUser._id }
    });

    if (existingIdNumber) {
      return res.status(409).json({ error: 'ID number already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user with student full name, ID number, and password
    verifiedUser.studentFullName = studentFullName.trim();
    verifiedUser.idNumber = idNumber;
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
        studentFullName: user.studentFullName,
        idNumber: user.idNumber,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email or ID number already exists' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Admin email whitelist from environment variable
const ADMIN_EMAILS = process.env.ADMIN_EMAILS 
  ? process.env.ADMIN_EMAILS.split(',').map(email => email.toLowerCase().trim())
  : [];

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is in admin whitelist
    const isAdminEmail = ADMIN_EMAILS.includes(normalizedEmail);

    // Find user by email - don't use lean() to get Mongoose document with methods
    let user = await User.findOne({
      email: normalizedEmail
    });

    // If admin email and user doesn't exist, create admin user
    if (!user && isAdminEmail) {
      // Hash password for new admin user
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Create admin user
      user = await User.create({
        email: normalizedEmail,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: true, // Auto-verify admin emails
        studentFullName: 'Admin User',
      });
    }

    // If user doesn't exist and not in admin whitelist, deny access
    if (!user && !isAdminEmail) {
      return res.status(401).json({ error: 'Invalid email or password. Access is restricted. Please contact admin.' });
    }
    
    // If user doesn't exist but is admin email, it will be created above
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password. Access is restricted.' });
    }

    // Check if user has a password set
    if (!user.password) {
      return res.status(401).json({ error: 'Account not fully set up. Please contact admin.' });
    }

    // Check password - handle bcrypt errors gracefully
    let isPasswordValid = false;
    try {
      // Compare password with the user's stored password
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error('Password comparison error:', bcryptError);
      return res.status(500).json({ error: 'Error verifying password. Please try again.' });
    }
    
    if (!isPasswordValid) {
      console.error('Login failed - invalid password for user:', user.email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // For admin emails, ensure role is set to ADMIN
    if (isAdminEmail && user.role !== 'ADMIN') {
      user.role = 'ADMIN';
      await user.save();
    }

    // Check if email is verified (skip for admin emails, they're auto-verified)
    if (!user.emailVerified && !isAdminEmail) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    // Only allow login if user is admin (from whitelist) or already exists in database (created by admin)
    // This ensures only admins can login via whitelist, others must be created by admin
    if (!isAdminEmail && !user.emailVerified) {
      return res.status(403).json({ error: 'Account not verified. Please contact admin for access.' });
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
        studentFullName: user.studentFullName,
        idNumber: user.idNumber,
        email: user.email,
        role: user.role || 'STUDENT'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Forgot password - Request OTP endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { usernameOrEmail } = req.body;

    if (!usernameOrEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email (or ID number if it matches email format)
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { idNumber: usernameOrEmail }
      ]
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ 
        success: true, 
        message: 'If the account exists, an OTP has been sent to the registered email' 
      });
    }

    if (!user.email) {
      return res.status(400).json({ error: 'User account has no email registered' });
    }

    // Check if OTP already exists and is still valid
    const existingOtp = await Otp.findOne({ 
      email: user.email.toLowerCase(),
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
    await Otp.deleteMany({ email: user.email.toLowerCase() });

    // Save new OTP to MongoDB with type 'password-reset'
    await Otp.create({
      email: user.email.toLowerCase(),
      otp,
      expiresAt,
      attempts: 0,
      type: 'password-reset'
    });

    // Send email using nodemailer
    const mailOptions = {
      from: `"ZeroOne Coding Club" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Password Reset OTP - ZeroOne Coding Club ERP',
      text: `Your password reset code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`,
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
            
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #fff; text-align: center;">Your password reset code is:</p>
              
              <div style="background: #0b1220; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid rgba(79, 156, 255, 0.3);">
                <h2 style="color: #4f9cff; font-size: 36px; letter-spacing: 12px; margin: 0; font-weight: bold; font-family: 'Courier New', monospace;">${otp}</h2>
              </div>
              
              <div style="background: rgba(0, 0, 0, 0.2); padding: 15px; border-radius: 6px; margin-top: 20px;">
                <p style="margin: 0; font-size: 14px; color: #e0e0e0; text-align: center;">
                  ⏱️ This code will expire in <strong>5 minutes</strong>
                </p>
              </div>
            </div>
            
            <div style="background: rgba(220, 38, 38, 0.1); padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #dc2626;">
              <p style="margin: 0; font-size: 14px; color: #888; line-height: 1.6;">
                <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. 
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
    await transporter.sendMail(mailOptions);
    
    console.log('Password reset OTP email sent:', {
      to: user.email,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'If the account exists, an OTP has been sent to the registered email',
      expiresIn: OTP_TTL_MS / 1000 
    });
  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    res.status(500).json({ error: 'Failed to send password reset OTP. Please try again.' });
  }
});

// Forgot password - Verify OTP endpoint
app.post('/api/auth/verify-reset-otp', async (req, res) => {
  try {
    const { usernameOrEmail, otp } = req.body;

    if (!usernameOrEmail || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find user by email (or ID number if it matches email format)
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { idNumber: usernameOrEmail }
      ]
    });

    if (!user || !user.email) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    // Find OTP in MongoDB
    const storedOtp = await Otp.findOne({ 
      email: user.email.toLowerCase(),
      type: 'password-reset'
    });

    if (!storedOtp) {
      return res.status(400).json({ error: 'No password reset OTP found. Please request a new one.' });
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

    // OTP verified - mark it as verified by adding a flag or returning a token
    // For security, we'll create a temporary token that can be used to reset password
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email, purpose: 'password-reset' },
      JWT_SECRET,
      { expiresIn: '10m' } // 10 minutes to reset password
    );

    // Remove OTP from database
    await Otp.deleteOne({ _id: storedOtp._id });

    res.json({ 
      success: true, 
      message: 'OTP verified successfully',
      resetToken 
    });
  } catch (error) {
    console.error('Error verifying reset OTP:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// Forgot password - Reset password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
      if (decoded.purpose !== 'password-reset') {
        return res.status(400).json({ error: 'Invalid reset token' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid or expired reset token. Please request a new password reset.' });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    
    // Ensure email is verified (should already be, but double-check)
    if (!user.emailVerified) {
      user.emailVerified = true;
    }
    
    // Save the user
    await user.save();

    // Reload user from database to ensure we have the latest data
    const updatedUser = await User.findById(user._id);
    if (!updatedUser) {
      console.error('Failed to reload user after password reset:', user._id);
      return res.status(500).json({ error: 'Password reset failed. Please try again.' });
    }

    // Verify the password was saved correctly by testing it
    const verifyPassword = await bcrypt.compare(newPassword, updatedUser.password);
    if (!verifyPassword) {
      console.error('Password reset verification failed:', {
        userId: updatedUser._id,
        email: updatedUser.email
      });
      return res.status(500).json({ error: 'Password reset failed. Please try again.' });
    }

    console.log('Password reset successful:', {
      userId: user._id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'Password reset successfully. You can now login with your new password.' 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Password reset failed. Please try again.' });
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

// Helper function to generate random sessions
function generateRandomSessions() {
  const titles = [
    'React Advanced Patterns',
    'Database Design & Optimization',
    'API Development with Express',
    'Git Workflow & Version Control',
    'Docker & Containerization',
    'AWS Cloud Services',
    'Node.js Performance Optimization',
    'Microservices Architecture',
    'GraphQL Fundamentals',
    'TypeScript Best Practices',
    'Test-Driven Development',
    'CI/CD Pipeline Setup',
    'MongoDB Advanced Queries',
    'Redis Caching Strategies',
    'WebSocket Real-time Communication',
    'Serverless Architecture',
    'Kubernetes Orchestration',
    'Machine Learning Basics',
    'Blockchain Development',
    'Mobile App Development'
  ];

  const descriptions = [
    'Learn advanced React patterns and best practices for building scalable applications.',
    'Master database design principles and optimization techniques.',
    'Build robust RESTful APIs using Express.js and Node.js.',
    'Understand Git workflows and collaborative development practices.',
    'Containerize applications with Docker and deploy them efficiently.',
    'Explore AWS cloud services and infrastructure management.',
    'Optimize Node.js applications for better performance.',
    'Design and implement microservices architecture.',
    'Learn GraphQL query language and schema design.',
    'TypeScript fundamentals and advanced type system.',
    'Write better code with TDD methodology.',
    'Set up continuous integration and deployment pipelines.',
    'Advanced MongoDB queries and aggregation pipelines.',
    'Implement caching strategies with Redis.',
    'Build real-time applications with WebSockets.',
    'Design serverless applications and functions.',
    'Orchestrate containers with Kubernetes.',
    'Introduction to machine learning concepts.',
    'Blockchain development fundamentals.',
    'Build cross-platform mobile applications.'
  ];

  const venues = [
    'Lab 1 - Computer Science Building',
    'Lab 2 - Engineering Block',
    'Conference Hall A',
    'Auditorium - Main Building',
    'Lab 3 - Technology Center',
    'Seminar Room 101',
    'Workshop Hall',
    'Innovation Lab',
    'Tech Hub',
    'Digital Classroom'
  ];

  const trainers = [
    'Dr. John Smith',
    'Prof. Sarah Johnson',
    'Mr. Michael Chen',
    'Dr. Emily Davis',
    'Prof. David Wilson',
    'Ms. Lisa Anderson',
    'Dr. Robert Brown',
    'Prof. Maria Garcia'
  ];

  const sessions = [];
  const today = new Date();
  
  // Generate 10 past sessions
  for (let i = 10; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const hour = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
    const minute = Math.random() < 0.5 ? '00' : '30';
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
    
    const titleIndex = Math.floor(Math.random() * titles.length);
    sessions.push({
      title: titles[titleIndex],
      description: descriptions[titleIndex],
      date: dateStr,
      time: timeStr,
      venue: venues[Math.floor(Math.random() * venues.length)],
      trainer: trainers[Math.floor(Math.random() * trainers.length)]
    });
  }

  // Generate 15 upcoming sessions
  for (let i = 1; i <= 15; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const hour = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
    const minute = Math.random() < 0.5 ? '00' : '30';
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
    
    const titleIndex = Math.floor(Math.random() * titles.length);
    sessions.push({
      title: titles[titleIndex],
      description: descriptions[titleIndex],
      date: dateStr,
      time: timeStr,
      venue: venues[Math.floor(Math.random() * venues.length)],
      trainer: trainers[Math.floor(Math.random() * trainers.length)]
    });
  }

  return sessions;
}

// Cloudflare R2 Configuration (only if credentials are provided)
let r2Client = null;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  console.log('✅ Cloudflare R2 client initialized');
} else {
  console.log('⚠️  Cloudflare R2 credentials not configured. Image uploads will be disabled.');
}

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and Word documents
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPG, PNG, GIF, WEBP, SVG), PDFs, and Word documents (DOC, DOCX) are allowed'), false);
    }
  },
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Sessions API - Get all sessions
app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    // Check if sessions exist, if not generate random ones
    let sessions = await Session.find().sort({ date: 1, time: 1 });
    
    if (sessions.length === 0) {
      // Generate and save random sessions
      const randomSessions = generateRandomSessions();
      sessions = await Session.insertMany(randomSessions);
      console.log('Generated and saved random sessions');
    }

    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Submissions API - Get user submissions
app.get('/api/submissions', authenticateToken, async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.userId })
      .populate({
        path: 'sessionId',
        select: 'title description date time venue trainer',
        model: 'Session'
      })
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Submissions API - Upload submission with image to R2
app.post('/api/submissions', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { sessionId, notes } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Check if R2 is configured
    if (!r2Client || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
      return res.status(503).json({ error: 'File upload service is not configured. Please configure Cloudflare R2 credentials.' });
    }

    // Verify session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Determine file type
    const mimeType = req.file.mimetype;
    let fileType = 'image';
    if (mimeType === 'application/pdf') {
      fileType = 'pdf';
    } else if (mimeType === 'application/msword') {
      fileType = 'doc';
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      fileType = 'docx';
    }

    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const originalFileName = req.file.originalname;
    const uniqueFileName = `submissions/${req.userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    // Upload to R2
    const uploadParams = {
      Bucket: R2_BUCKET_NAME,
      Key: uniqueFileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      CacheControl: 'public, max-age=31536000', // Cache for 1 year
    };

    await r2Client.send(new PutObjectCommand(uploadParams));

    // Construct public URL - ensure no double slashes
    const cleanPublicUrl = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
    const cleanFileName = uniqueFileName.startsWith('/') ? uniqueFileName.slice(1) : uniqueFileName;
    const fileUrl = `${cleanPublicUrl}/${cleanFileName}`;
    
    console.log('File uploaded successfully:', {
      fileName: originalFileName,
      fileType,
      fileUrl,
      size: req.file.size
    });

    // Save submission to database
    const submission = await Submission.create({
      userId: req.userId,
      sessionId,
      fileUrl,
      fileName: originalFileName,
      fileType,
      notes: notes || '',
      status: 'pending'
    });

    // Populate session data
    await submission.populate({
      path: 'sessionId',
      select: 'title description date time venue trainer',
      model: 'Session'
    });

    res.status(201).json({
      success: true,
      message: 'Submission uploaded successfully',
      submission
    });
  } catch (error) {
    console.error('Error uploading submission:', error);
    res.status(500).json({ error: 'Failed to upload submission. Please try again.' });
  }
});

// Attendance API - Get user attendance (linked to sessions)
app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    // Get all sessions
    const sessions = await Session.find().sort({ date: -1, time: -1 });
    
    // Get user's attendance records with populated session data
    const userAttendance = await Attendance.find({ userId: req.userId })
      .populate({
        path: 'sessionId',
        select: 'title description date time venue trainer',
        model: 'Session'
      })
      .sort({ markedAt: -1 });
    
    const attendanceMap = new Map();
    userAttendance.forEach(att => {
      if (att.sessionId) {
        attendanceMap.set(att.sessionId._id.toString(), {
          status: att.status,
          markedAt: att.markedAt,
          notes: att.notes
        });
      }
    });
    
    // Map sessions with attendance status
    const attendanceData = sessions.map(session => {
      const attendanceRecord = attendanceMap.get(session._id.toString());
      return {
        sessionId: session._id,
        title: session.title,
        description: session.description,
        date: session.date,
        time: session.time,
        venue: session.venue,
        trainer: session.trainer,
        status: attendanceRecord?.status || 'absent', // Default to absent if not marked
        markedAt: attendanceRecord?.markedAt,
        notes: attendanceRecord?.notes
      };
    });

    res.json({
      success: true,
      attendance: attendanceData
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Attendance API - Mark attendance for a session
app.post('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const { sessionId, status } = req.body;

    if (!sessionId || !status) {
      return res.status(400).json({ error: 'Session ID and status are required' });
    }

    if (!['present', 'absent', 'late', 'excused'].includes(status)) {
      return res.status(400).json({ error: 'Invalid attendance status' });
    }

    // Verify session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update or create attendance record
    const attendance = await Attendance.findOneAndUpdate(
      { userId: req.userId, sessionId },
      { 
        userId: req.userId,
        sessionId,
        status,
        markedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Attendance already marked for this session' });
    }
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Proxy endpoint to serve files from R2 (bypasses CORS issues)
app.get('/api/files/:filePath(*)', async (req, res) => {
  try {
    if (!r2Client || !R2_BUCKET_NAME) {
      return res.status(503).json({ error: 'File service not configured' });
    }

    const filePath = req.params.filePath;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Security: Only allow files from submissions directory
    if (!filePath.startsWith('submissions/')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filePath
    });

    const response = await r2Client.send(command);
    
    // Set appropriate headers
    res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Stream the file
    if (response.Body) {
      response.Body.pipe(res);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error serving file:', error);
    if (error.name === 'NoSuchKey') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: 'Failed to serve file' });
    }
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

// ========== ADMIN ROUTES ==========

// Get all users/students endpoint (for admin)
app.get('/api/users/all', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const students = await User.find({ role: 'STUDENT' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get single user by ID (for admin or self)
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.userId);
    const targetUser = await User.findById(req.params.id).select('-password');
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Only allow admin or the user themselves
    if (requestingUser.role !== 'ADMIN' && requestingUser._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({
      success: true,
      user: targetUser,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (for admin or self)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.userId);
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Only allow admin or the user themselves
    if (requestingUser.role !== 'ADMIN' && requestingUser._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { studentFullName, email, phone } = req.body;
    
    if (studentFullName) targetUser.studentFullName = studentFullName;
    if (email && requestingUser.role === 'ADMIN') targetUser.email = email.toLowerCase();
    if (phone !== undefined) targetUser.phone = phone || null;
    
    await targetUser.save();
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: targetUser._id,
        studentFullName: targetUser.studentFullName,
        email: targetUser.email,
        phone: targetUser.phone,
        idNumber: targetUser.idNumber,
        role: targetUser.role,
        emailVerified: targetUser.emailVerified,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Reset student password (admin only)
app.post('/api/admin/students/:id/reset-password', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    student.password = hashedPassword;
    await student.save();
    
    res.json({
      success: true,
      message: 'Password reset successfully. Student should use forgot password to set a new one.',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Update submission status (admin only)
app.put('/api/submissions/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { status, feedback } = req.body;
    
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    if (status) submission.status = status;
    if (feedback !== undefined) submission.feedback = feedback;
    submission.reviewedAt = new Date();
    submission.reviewedBy = req.userId;
    
    await submission.save();
    
    res.json({
      success: true,
      message: 'Submission updated successfully',
      submission,
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// Delete session (admin only)
app.delete('/api/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Update session (admin only)
app.put('/api/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const { title, description, date, startTime, endTime, venue, trainer, maxSeats, joinLink, status } = req.body;
    
    if (title) session.title = title;
    if (description) session.description = description;
    if (date) session.date = new Date(date);
    if (startTime) session.startTime = new Date(startTime);
    if (endTime) session.endTime = new Date(endTime);
    if (venue) session.venue = venue;
    if (trainer !== undefined) session.trainer = trainer;
    if (maxSeats !== undefined) session.maxSeats = maxSeats;
    if (joinLink !== undefined) session.joinLink = joinLink;
    if (status) session.status = status;
    
    await session.save();
    
    res.json({
      success: true,
      message: 'Session updated successfully',
      session,
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Create session (admin only)
app.post('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { title, description, date, startTime, endTime, venue, trainer, maxSeats, joinLink, status } = req.body;
    
    if (!title || !description || !date || !venue) {
      return res.status(400).json({ error: 'Title, description, date, and venue are required' });
    }
    
    const session = await Session.create({
      title,
      description,
      date: new Date(date),
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      venue,
      trainer: trainer || null,
      maxSeats: maxSeats || 50,
      joinLink: joinLink || null,
      status: status || 'scheduled',
    });
    
    res.json({
      success: true,
      message: 'Session created successfully',
      session,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

