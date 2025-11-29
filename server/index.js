import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import mongoose from 'mongoose';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import connectDB from './db/connect.js';
import Otp from './models/Otp.js';
import User from './models/User.js';
import Session from './models/Session.js';
import Submission from './models/Submission.js';
import Attendance from './models/Attendance.js';
import Announcement from './models/Announcement.js';
import Project from './models/Project.js';
import Query from './models/Query.js';

dotenv.config();

// Constants
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_LENGTH = 6;
const MAX_VERIFY_ATTEMPTS = 5;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map(email => email.toLowerCase().trim())
  : [];

// Database connection
let dbConnected = false;
connectDB()
  .then(() => {
    dbConnected = true;
    console.log('✅ Database connected');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    dbConnected = false;
  });

// Express app setup
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); // Allow all origins
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400
}));

// Helper functions
function generateOTP() {
  return Array.from({ length: OTP_LENGTH }, () => 
    Math.floor(Math.random() * 10)
  ).join('');
}

async function withTimeout(promise, timeoutMs, errorMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

function checkDatabaseConnection(res) {
  const dbState = mongoose.connection.readyState;
  if (!dbConnected || dbState !== 1) {
    res.status(503).json({ error: 'Database not connected' });
    return false;
  }
  return true;
}

// Email configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify((error) => {
  if (error) {
    console.error('❌ Outlook SMTP connection failed:', error.message);
  } else {
    console.log('✅ Outlook SMTP ready');
  }
});

// Email templates
function getOTPEmailTemplate(otp) {
  return `
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
        <div style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); padding: 30px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #fff; text-align: center;">Your email verification code is:</p>
              <div style="background: #0b1220; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid rgba(79, 156, 255, 0.3);">
                <h2 style="color: #4f9cff; font-size: 36px; letter-spacing: 12px; margin: 0; font-weight: bold; font-family: 'Courier New', monospace;">${otp}</h2>
              </div>
              <div style="background: rgba(0, 0, 0, 0.2); padding: 15px; border-radius: 6px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #e0e0e0; text-align: center;">⏱️ This code will expire in <strong>5 minutes</strong></p>
              </div>
            </div>
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <p style="margin: 0; font-size: 12px; color: #666;">© ${new Date().getFullYear()} ZeroOne Coding Club. All rights reserved.</p>
            </div>
      </div>
    </body>
    </html>
  `;
}

function getPasswordResetEmailTemplate(otp) {
  return `
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
        <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0 0 20px 0; font-size: 18px; color: #fff; text-align: center;">Your password reset code is:</p>
          <div style="background: #0b1220; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid rgba(79, 156, 255, 0.3);">
            <h2 style="color: #4f9cff; font-size: 36px; letter-spacing: 12px; margin: 0; font-weight: bold; font-family: 'Courier New', monospace;">${otp}</h2>
          </div>
          <div style="background: rgba(0, 0, 0, 0.2); padding: 15px; border-radius: 6px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #e0e0e0; text-align: center;">⏱️ This code will expire in <strong>5 minutes</strong></p>
          </div>
        </div>
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <p style="margin: 0; font-size: 12px; color: #666;">© ${new Date().getFullYear()} ZeroOne Coding Club. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
  `;
}

// Authentication middleware
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

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// ========== AUTH ROUTES ==========

// Request OTP
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    if (!checkDatabaseConnection(res)) return;

    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const existingOtp = await withTimeout(
      Otp.findOne({ email: email.toLowerCase(), expiresAt: { $gt: new Date() } }),
      10000,
      'Database query timeout'
    );

    if (existingOtp) {
      const timeLeft = Math.ceil((existingOtp.expiresAt - Date.now()) / 1000);
      return res.status(429).json({ error: `Please wait ${timeLeft} seconds before requesting a new OTP` });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await withTimeout(
      Otp.deleteMany({ email: email.toLowerCase() }),
      10000,
      'Database query timeout'
    );

    await withTimeout(
      Otp.create({ email: email.toLowerCase(), otp, expiresAt, attempts: 0 }),
      10000,
      'Database query timeout'
    );

    const mailOptions = {
      from: `"ZeroOne Coding Club" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Email Verification OTP - ZeroOne Coding Club ERP',
      text: `Your email verification code is: ${otp}\n\nThis code will expire in 5 minutes.`,
      html: getOTPEmailTemplate(otp)
    };

    await withTimeout(
      transporter.sendMail(mailOptions),
      15000,
      'SMTP timeout'
    );

    res.json({ success: true, message: 'OTP sent to your email', expiresIn: OTP_TTL_MS / 1000 });
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      return res.status(500).json({ error: 'Outlook authentication failed. Check your SMTP credentials.' });
    }
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.message === 'SMTP timeout') {
      return res.status(500).json({ error: 'Connection to Outlook server failed.' });
    }
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    const storedOtp = await Otp.findOne({ email: email.toLowerCase() });
    if (!storedOtp) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    if (new Date() > storedOtp.expiresAt) {
      await Otp.deleteOne({ _id: storedOtp._id });
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    if (storedOtp.attempts >= MAX_VERIFY_ATTEMPTS) {
      await Otp.deleteOne({ _id: storedOtp._id });
      return res.status(429).json({ error: 'Too many attempts. Please request a new OTP.' });
    }

    storedOtp.attempts += 1;
    await storedOtp.save();

    if (storedOtp.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { email: email.toLowerCase(), emailVerified: true },
      { upsert: true, new: true }
    );

    await Otp.deleteOne({ _id: storedOtp._id });
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { studentFullName, idNumber, email, password } = req.body;

    if (!studentFullName || !idNumber || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (studentFullName.length < 2 || studentFullName.length > 100) {
      return res.status(400).json({ error: 'Student name must be between 2 and 100 characters' });
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

    const expectedEmail = `${idNumber}@kluniversity.in`;
    if (email.toLowerCase() !== expectedEmail.toLowerCase()) {
      return res.status(400).json({ error: 'Email must match ID number format: idnumber@kluniversity.in' });
    }

    const verifiedUser = await User.findOne({ email: email.toLowerCase(), emailVerified: true });
    if (!verifiedUser) {
      return res.status(400).json({ error: 'Please verify your email first using OTP' });
    }

    if (verifiedUser.password) {
      return res.status(409).json({ error: 'Email already registered. Please login instead.' });
    }

    const existingIdNumber = await User.findOne({ idNumber, _id: { $ne: verifiedUser._id } });
    if (existingIdNumber) {
      return res.status(409).json({ error: 'ID number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    verifiedUser.studentFullName = studentFullName.trim();
    verifiedUser.idNumber = idNumber;
    verifiedUser.password = hashedPassword;
    await verifiedUser.save();
    
    const token = jwt.sign({ userId: verifiedUser._id, email: verifiedUser.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    verifiedUser.lastLogin = new Date();
    await verifiedUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: verifiedUser._id,
        studentFullName: verifiedUser.studentFullName,
        idNumber: verifiedUser.idNumber,
        email: verifiedUser.email
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

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isAdminEmail = ADMIN_EMAILS.includes(normalizedEmail);
    let user = await User.findOne({ email: normalizedEmail });

    if (!user && isAdminEmail) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        email: normalizedEmail,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: true,
        studentFullName: 'Admin User'
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Account not fully set up. Please contact admin.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (isAdminEmail && user.role !== 'ADMIN') {
      user.role = 'ADMIN';
      await user.save();
    }

    if (!user.emailVerified && !isAdminEmail) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
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

// Forgot password - Request OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { usernameOrEmail } = req.body;
    if (!usernameOrEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { idNumber: usernameOrEmail }
      ]
    });

    if (!user || !user.email) {
      return res.json({ success: true, message: 'If the account exists, an OTP has been sent to the registered email' });
    }

    const existingOtp = await Otp.findOne({ email: user.email.toLowerCase(), expiresAt: { $gt: new Date() } });
    if (existingOtp) {
      const timeLeft = Math.ceil((existingOtp.expiresAt - Date.now()) / 1000);
      return res.status(429).json({ error: `Please wait ${timeLeft} seconds before requesting a new OTP` });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await Otp.deleteMany({ email: user.email.toLowerCase() });
    await Otp.create({ email: user.email.toLowerCase(), otp, expiresAt, attempts: 0, type: 'password-reset' });

    const mailOptions = {
      from: `"ZeroOne Coding Club" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Password Reset OTP - ZeroOne Coding Club ERP',
      text: `Your password reset code is: ${otp}\n\nThis code will expire in 5 minutes.`,
      html: getPasswordResetEmailTemplate(otp)
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'If the account exists, an OTP has been sent to the registered email', expiresIn: OTP_TTL_MS / 1000 });
  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    res.status(500).json({ error: 'Failed to send password reset OTP. Please try again.' });
  }
});

// Forgot password - Verify OTP
app.post('/api/auth/verify-reset-otp', async (req, res) => {
  try {
    const { usernameOrEmail, otp } = req.body;
    if (!usernameOrEmail || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { idNumber: usernameOrEmail }
      ]
    });

    if (!user || !user.email) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const storedOtp = await Otp.findOne({ email: user.email.toLowerCase(), type: 'password-reset' });
    if (!storedOtp) {
      return res.status(400).json({ error: 'No password reset OTP found. Please request a new one.' });
    }

    if (new Date() > storedOtp.expiresAt) {
      await Otp.deleteOne({ _id: storedOtp._id });
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    if (storedOtp.attempts >= MAX_VERIFY_ATTEMPTS) {
      await Otp.deleteOne({ _id: storedOtp._id });
      return res.status(429).json({ error: 'Too many attempts. Please request a new OTP.' });
    }

    storedOtp.attempts += 1;
    await storedOtp.save();

    if (storedOtp.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    const resetToken = jwt.sign({ userId: user._id, email: user.email, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '10m' });
    await Otp.deleteOne({ _id: storedOtp._id });

    res.json({ success: true, message: 'OTP verified successfully', resetToken });
  } catch (error) {
    console.error('Error verifying reset OTP:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// Forgot password - Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
      if (decoded.purpose !== 'password-reset') {
        return res.status(400).json({ error: 'Invalid reset token' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid or expired reset token. Please request a new password reset.' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    if (!user.emailVerified) {
      user.emailVerified = true;
    }
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Password reset failed. Please try again.' });
  }
});

// ========== SESSION ROUTES ==========

// Get all sessions
app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    // Sort by createdAt descending to show newest sessions first
    const sessions = await Session.find().sort({ createdAt: -1, date: -1, startTime: -1 }).lean();
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create session (admin only)
app.post('/api/sessions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, venue, trainer, maxSeats, joinLink, status } = req.body;
    if (!title || !description || !date || !venue) {
      return res.status(400).json({ error: 'Title, description, date, and venue are required' });
    }
    const session = await Session.create({
      title, description, date: new Date(date),
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      venue, trainer: trainer || null,
      maxSeats: maxSeats || 50,
      joinLink: joinLink || null,
      status: status || 'scheduled'
    });
    res.json({ success: true, message: 'Session created successfully', session });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update session (admin only)
app.put('/api/sessions/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
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
    res.json({ success: true, message: 'Session updated successfully', session });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete session (admin only)
app.delete('/api/sessions/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// ========== SUBMISSION ROUTES ==========

// Get user submissions (or all submissions for admin)
app.get('/api/submissions', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const isAdmin = user && user.role === 'ADMIN';

    const query = isAdmin ? {} : { userId: req.userId };

    // Only show submissions from new bucket (fileUrl starts with "submissions/")
    // Filter out old submissions from old bucket (those with full HTTP URLs or invalid keys)
    const allSubmissions = await Submission.find(query)
      .populate({ path: 'sessionId', select: 'title description date time venue trainer', model: 'Session' })
      .populate({ path: 'userId', select: 'studentFullName email idNumber phone role' })
      .sort({ submittedAt: -1 });

    const submissions = allSubmissions.filter(sub => {
      if (!sub.fileUrl) return false;
      // Include if it starts with "submissions/" (new bucket format)
      if (sub.fileUrl.startsWith('submissions/')) return true;
      // Exclude old bucket URLs (full HTTP URLs that don't contain "submissions/" in path)
      if (sub.fileUrl.startsWith('http')) {
        // Try to extract key - if we can't, it's from old bucket
        const match = sub.fileUrl.match(/(submissions\/.*)/);
        return !!match; // Only include if we can extract a valid key
      }
      return false; // Exclude anything else
    });

    // Generate signed URLs for private bucket access
    const submissionsWithUrls = await Promise.all(submissions.map(async (sub) => {
      const subObj = sub.toObject();

      // If we have a fileUrl
      if (subObj.fileUrl) {
        let key = subObj.fileUrl;

        // Backward compatibility: Extract key if it's a full URL
        if (subObj.fileUrl.startsWith('http')) {
          // Try to extract key from URL (e.g. https://.../submissions/...)
          const match = subObj.fileUrl.match(/(submissions\/.*)/);
          if (match) {
            key = match[1];
          } else {
            // If we can't extract a key pattern, use proxy endpoint as fallback
            subObj.fileUrl = `${req.protocol}://${req.get('host')}/api/files/${encodeURIComponent(subObj.fileUrl)}`;
            return subObj;
          }
        }

        // Only generate signed URL if R2 client is configured and key looks valid
        if (r2Client && R2_BUCKET_NAME && key && key.startsWith('submissions/')) {
          try {
            const command = new GetObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: key
            });
            // Generate signed URL valid for 1 hour
            subObj.fileUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
          } catch (error) {
            console.error(`Error generating signed URL for key ${key}:`, error.message);
            // Fallback to proxy endpoint if signed URL generation fails
            subObj.fileUrl = `${req.protocol}://${req.get('host')}/api/files/${encodeURIComponent(key)}`;
          }
} else {
          // If R2 is not configured or key is invalid, use proxy endpoint
          if (key && key.startsWith('submissions/')) {
            subObj.fileUrl = `${req.protocol}://${req.get('host')}/api/files/${encodeURIComponent(key)}`;
          } else {
            // Invalid key format, mark as unavailable
            subObj.fileUrl = null;
            subObj.fileError = 'File URL is invalid or unavailable';
          }
        }
      }
      return subObj;
    }));

    res.json({ success: true, submissions: submissionsWithUrls });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions', details: error.message });
  }
});

// Upload submission
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed. Only images, PDFs, and Word documents are allowed`), false);
    }
  }
});

let r2Client = null;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME) {
  try {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      }
    });
    console.log('✅ Cloudflare R2 client initialized');
    console.log(`   Bucket: ${process.env.R2_BUCKET_NAME}`);
    console.log(`   Endpoint: ${process.env.R2_ENDPOINT}`);
  } catch (error) {
    console.error('❌ Failed to initialize R2 client:', error.message);
    r2Client = null;
  }
} else {
  console.warn('⚠️  R2 configuration incomplete. File uploads will be disabled.');
  console.warn('   Required: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
}

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Only one file is allowed' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'File upload error' });
  }
  next();
};

app.post('/api/submissions', authenticateToken, upload.single('image'), handleMulterError, async (req, res) => {
  try {
    const { sessionId, notes } = req.body;

    // Validate input
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Check R2 configuration
    if (!r2Client || !R2_BUCKET_NAME) {
      console.error('R2 upload failed: R2 client or bucket name not configured');
      console.error('R2 client:', r2Client ? 'initialized' : 'null');
      console.error('R2_BUCKET_NAME:', R2_BUCKET_NAME || 'not set');
      return res.status(503).json({
        error: 'File upload service is not configured. Please contact administrator.',
        details: 'R2 storage not properly configured'
      });
    }

    // Validate session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Determine file type
    const mimeType = req.file.mimetype;
    let fileType = 'image';
    if (mimeType === 'application/pdf') fileType = 'pdf';
    else if (mimeType === 'application/msword') fileType = 'doc';
    else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileType = 'docx';

    // Generate unique file name
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const uniqueFileName = `submissions/${req.userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    console.log(`📤 Uploading file to R2: ${uniqueFileName}`);
    console.log(`   File size: ${(req.file.size / 1024).toFixed(2)} KB`);
    console.log(`   Content type: ${req.file.mimetype}`);

    // Upload to R2 with timeout
    try {
      await withTimeout(
        r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: uniqueFileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
        })),
        30000, // 30 second timeout
        'R2 upload timeout'
      );
      console.log(`✅ File uploaded successfully to R2: ${uniqueFileName}`);
    } catch (r2Error) {
      console.error('❌ R2 upload error:', r2Error);
      console.error('   Error name:', r2Error.name);
      console.error('   Error message:', r2Error.message);
      console.error('   Error code:', r2Error.Code || r2Error.code);

      let errorMessage = 'Failed to upload file to storage';
      if (r2Error.message === 'R2 upload timeout') {
        errorMessage = 'Upload timeout. The file may be too large or the connection is slow.';
      } else if (r2Error.name === 'InvalidAccessKeyId' || r2Error.Code === 'InvalidAccessKeyId') {
        errorMessage = 'Invalid R2 credentials. Please contact administrator.';
      } else if (r2Error.name === 'SignatureDoesNotMatch' || r2Error.Code === 'SignatureDoesNotMatch') {
        errorMessage = 'R2 authentication failed. Please contact administrator.';
      } else if (r2Error.name === 'NoSuchBucket' || r2Error.Code === 'NoSuchBucket') {
        errorMessage = 'R2 bucket not found. Please contact administrator.';
      }

      return res.status(500).json({
        error: errorMessage,
        details: r2Error.message,
        code: r2Error.Code || r2Error.code
      });
    }

    // Store submission in database
    const fileUrl = uniqueFileName; // Store key for private bucket

    try {
    const submission = await Submission.create({
      userId: req.userId,
      sessionId,
      fileUrl,
        fileName: req.file.originalname,
      fileType,
      notes: notes || '',
        status: 'PENDING'
      });

      await submission.populate({ path: 'sessionId', select: 'title description date time venue trainer', model: 'Session' });

      console.log(`✅ Submission created in database: ${submission._id}`);

    res.status(201).json({
      success: true,
      message: 'Submission uploaded successfully',
      submission
    });
    } catch (dbError) {
      console.error('❌ Database error creating submission:', dbError);
      // File is already uploaded to R2, but we failed to save to DB
      // This is a critical error - file is orphaned
      return res.status(500).json({
        error: 'File uploaded but failed to save submission record. Please contact administrator.',
        details: dbError.message
      });
    }
  } catch (error) {
    console.error('❌ Unexpected error in upload endpoint:', error);
    console.error('   Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to upload submission. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update submission status (admin only)
app.put('/api/submissions/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    const { status, feedback, notes } = req.body;

    // Normalize status to uppercase
    if (status) {
      const normalizedStatus = status.toUpperCase();
      if (['PENDING', 'ACCEPTED', 'REJECTED'].includes(normalizedStatus)) {
        submission.status = normalizedStatus;
      } else {
        return res.status(400).json({ error: 'Invalid status. Must be PENDING, ACCEPTED, or REJECTED' });
      }
    }

    if (feedback !== undefined) submission.feedback = feedback;
    if (notes !== undefined) submission.notes = notes;

    submission.reviewedAt = new Date();
    submission.reviewedBy = req.userId;
    await submission.save();

    await submission.populate({ path: 'sessionId', select: 'title description date time venue trainer', model: 'Session' });
    await submission.populate({ path: 'userId', select: 'studentFullName email idNumber phone role' });

    res.json({ success: true, message: 'Submission updated successfully', submission });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// ========== ATTENDANCE ROUTES ==========

// Get user attendance
app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const sessions = await Session.find().sort({ date: -1, time: -1 });
    const userAttendance = await Attendance.find({ userId: req.userId })
      .populate({ path: 'sessionId', select: 'title description date time venue trainer', model: 'Session' })
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
        status: attendanceRecord?.status || 'absent',
        markedAt: attendanceRecord?.markedAt,
        notes: attendanceRecord?.notes
      };
    });

    res.json({ success: true, attendance: attendanceData });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Mark attendance (user marks own, or admin marks for any user)
app.post('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const { sessionId, status, userId } = req.body;
    if (!sessionId || !status) {
      return res.status(400).json({ error: 'Session ID and status are required' });
    }

    if (!['present', 'absent', 'late', 'excused'].includes(status.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid attendance status. Must be: present, absent, late, or excused' });
    }

    const user = await User.findById(req.userId);
    const isAdmin = user && user.role?.toUpperCase() === 'ADMIN';

    // If admin provided userId, use it; otherwise use the authenticated user's ID
    const targetUserId = (isAdmin && userId) ? userId : req.userId;

    // If admin is marking for another user, verify that user exists
    if (isAdmin && userId && userId !== req.userId) {
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found' });
      }
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Ensure userId and sessionId are ObjectIds
    const targetUserIdObj = typeof targetUserId === 'string' ? new mongoose.Types.ObjectId(targetUserId) : targetUserId;
    const sessionIdObj = typeof sessionId === 'string' ? new mongoose.Types.ObjectId(sessionId) : sessionId;
    
    const attendance = await Attendance.findOneAndUpdate(
      { userId: targetUserIdObj, sessionId: sessionIdObj },
      { userId: targetUserIdObj, sessionId: sessionIdObj, status: status.toLowerCase(), markedAt: new Date() },
      { upsert: true, new: true }
    );

    await attendance.populate({ path: 'sessionId', select: 'title description date time venue trainer', model: 'Session' });
    await attendance.populate({ path: 'userId', select: 'studentFullName email idNumber', model: 'User' });

    res.json({ success: true, message: 'Attendance marked successfully', attendance });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Get attendance for a specific session (admin only - shows all students)
app.get('/api/admin/sessions/:sessionId/attendance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get all students
    const allStudents = await User.find({ role: 'STUDENT' }).select('studentFullName email idNumber');

    // Get attendance records for this session
    const attendanceRecords = await Attendance.find({ sessionId })
      .populate({ path: 'userId', select: 'studentFullName email idNumber', model: 'User' });

    // Create a map of attendance
    const attendanceMap = new Map();
    attendanceRecords.forEach(att => {
      if (att.userId) {
        attendanceMap.set(att.userId._id.toString(), {
          status: att.status,
          markedAt: att.markedAt,
          notes: att.notes
        });
      }
    });

    // Combine all students with their attendance status
    const attendanceData = allStudents.map(student => {
      const attendanceRecord = attendanceMap.get(student._id.toString());
      return {
        userId: student._id,
        studentFullName: student.studentFullName,
        idNumber: student.idNumber,
        email: student.email,
        status: attendanceRecord?.status || null,
        markedAt: attendanceRecord?.markedAt,
        notes: attendanceRecord?.notes
      };
    });

    res.json({ success: true, session, attendance: attendanceData });
  } catch (error) {
    console.error('Error fetching session attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// ========== FILE ROUTES ==========

app.get('/api/files/:filePath(*)', async (req, res) => {
  try {
    if (!r2Client || !process.env.R2_BUCKET_NAME) {
      return res.status(503).json({ error: 'File service not configured' });
    }

    const filePath = decodeURIComponent(req.params.filePath);
    console.log('Proxy requesting file:', filePath); // Debug log

    if (!filePath || !filePath.startsWith('submissions/')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // This allows images to load without auth, but still validates if token is present
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        const isAdmin = user && user.role?.toUpperCase() === 'ADMIN';

        if (!isAdmin) {
          // Extract userId from file path: submissions/{userId}/...
          const pathMatch = filePath.match(/^submissions\/([^/]+)\//);
          if (pathMatch && pathMatch[1] !== decoded.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
          }
        }
      } catch (authError) {
        // If auth fails, still allow access (for images without auth headers)
        // This is a fallback - primary access should be through signed URLs
      }
    }

    const response = await r2Client.send(new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filePath
    }));

    res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=3600'); // 1 hour for private files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Disposition', `inline; filename="${filePath.split('/').pop()}"`);
    
    if (response.Body) {
      // Convert stream to buffer for proper handling
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      res.send(buffer);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error serving file:', error);
    if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: 'Failed to serve file', details: error.message });
    }
  }
});

// ========== ADMIN ROUTES ==========

// Get all users (admin only - returns all registered users)
app.get('/api/users/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: 'STUDENT' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get current user (me)
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        studentFullName: user.studentFullName,
        idNumber: user.idNumber,
        email: user.email,
        role: user.role || 'STUDENT',
        emailVerified: user.emailVerified,
        phone: user.phone,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update current user (me)
app.put('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { studentFullName, email, phone } = req.body;

    if (studentFullName) user.studentFullName = studentFullName;
    // Only allow email update if not verified or if admin (but this is 'me' route, so usually strict)
    // For now, let's allow updating email but maybe require re-verification? 
    // Keeping it simple: allow update if provided.
    if (email) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;

    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        studentFullName: user.studentFullName,
        idNumber: user.idNumber,
        email: user.email,
        role: user.role || 'STUDENT',
        emailVerified: user.emailVerified,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get single user
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.userId);
    const targetUser = await User.findById(req.params.id).select('-password');
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (requestingUser.role !== 'ADMIN' && requestingUser._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json({ success: true, user: targetUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.userId);
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
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
        emailVerified: targetUser.emailVerified
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Admin reset password for student
app.post('/api/admin/students/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Clear existing OTPs and save new one
    await Otp.deleteMany({ email: user.email.toLowerCase() });
    await Otp.create({ email: user.email.toLowerCase(), otp, expiresAt, attempts: 0, type: 'password-reset' });

    // Send email
    const mailOptions = {
      from: `"ZeroOne Coding Club" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Password Reset Request - ZeroOne Coding Club ERP',
      text: `An admin has requested a password reset for your account.\n\nYour password reset code is: ${otp}\n\nThis code will expire in 5 minutes.`,
      html: getPasswordResetEmailTemplate(otp)
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Password reset email sent to student' });
  } catch (error) {
    console.error('Error initiating admin password reset:', error);
    res.status(500).json({ error: 'Failed to initiate password reset' });
  }
});



// Clean up old submissions from old bucket (admin only)
app.delete('/api/admin/submissions/cleanup-old', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Find all submissions that are from old bucket
    const allSubmissions = await Submission.find({});

    const oldSubmissions = allSubmissions.filter(sub => {
      if (!sub.fileUrl) return true; // Include submissions with no fileUrl

      // Exclude new bucket submissions (start with "submissions/")
      if (sub.fileUrl.startsWith('submissions/')) return false;

      // Include old bucket URLs (full HTTP URLs)
      return true;
    });

    let deletedFilesCount = 0;

    // Try to delete files from R2 if possible
    if (r2Client && R2_BUCKET_NAME) {
      for (const sub of oldSubmissions) {
        if (sub.fileUrl && sub.fileUrl.startsWith('http')) {
          try {
            // Try to extract key from URL
            // Assuming URL format: https://.../key
            const urlObj = new URL(sub.fileUrl);
            const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;

            if (key) {
              const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
              await r2Client.send(new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key
              }));
              deletedFilesCount++;
            }
          } catch (err) {
            console.warn(`Failed to delete file for submission ${sub._id}:`, err.message);
            // Continue deleting DB record even if file delete fails
          }
        }
      }
    }

    const oldSubmissionIds = oldSubmissions.map(sub => sub._id);
    const deletedCount = await Submission.deleteMany({ _id: { $in: oldSubmissionIds } });

    console.log(`🗑️  Deleted ${deletedCount.deletedCount} old submissions from DB and ${deletedFilesCount} files from R2`);
    
    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount.deletedCount} old submissions and ${deletedFilesCount} files`,
      deletedCount: deletedCount.deletedCount,
      deletedFilesCount
    });
  } catch (error) {
    console.error('Error cleaning up old submissions:', error);
    res.status(500).json({ error: 'Failed to clean up old submissions', details: error.message });
  }
});

// ========== ANNOUNCEMENT ROUTES ==========

// Get all announcements (public/students see published only, admin sees all)
app.get('/api/announcements', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const isAdmin = user && user.role?.toUpperCase() === 'ADMIN';

    let query = {};
    // If not admin, only return published announcements
    if (!isAdmin) {
      query.published = true;
    }

    const announcements = await Announcement.find(query)
      .populate({ path: 'createdBy', select: 'studentFullName email name', model: 'User' })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Create announcement (admin only)
app.post('/api/announcements', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, published } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const announcement = await Announcement.create({
      title,
      content,
      published: published || false,
      publishedAt: published ? new Date() : null,
      createdBy: req.userId
    });

    res.status(201).json({ success: true, message: 'Announcement created successfully', announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Update announcement (admin only)
app.put('/api/announcements/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, published } = req.body;
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (title) announcement.title = title;
    if (content) announcement.content = content;

    if (published !== undefined) {
      announcement.published = published;
      if (published && !announcement.publishedAt) {
        announcement.publishedAt = new Date();
      }
    }

    await announcement.save();
    res.json({ success: true, message: 'Announcement updated successfully', announcement });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement (admin only)
app.delete('/api/announcements/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// ========== PROJECT ROUTES ==========

// Get all projects (students see active only, admin sees all)
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const isAdmin = user && user.role?.toUpperCase() === 'ADMIN';

    let query = {};
    // If not admin, only return active projects
    if (!isAdmin) {
      query.isActive = true;
    }

    const projects = await Project.find(query)
      .populate({ path: 'createdBy', select: 'studentFullName email name', model: 'User' })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch projects',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create project (admin only)
app.post('/api/projects', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, isActive, referenceFiles } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    // Ensure referenceFiles is an array of strings
    let filesArray = [];
    if (Array.isArray(referenceFiles)) {
      filesArray = referenceFiles
        .map(file => {
          if (typeof file === 'string') return file.trim();
          if (file && typeof file === 'object' && file.name) return file.name;
          return null;
        })
        .filter(file => file && file.length > 0);
    }

    const project = await Project.create({
      title: title.trim(),
      description: description.trim(),
      isActive: isActive !== undefined ? isActive : true,
      referenceFiles: filesArray,
      createdBy: req.userId
    });

    res.status(201).json({ success: true, message: 'Project created successfully', project });
  } catch (error) {
    console.error('Error creating project:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create project',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update project (admin only)
app.put('/api/projects/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, isActive, referenceFiles } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (title) project.title = title;
    if (description) project.description = description;
    if (isActive !== undefined) project.isActive = isActive;
    if (referenceFiles !== undefined) project.referenceFiles = referenceFiles;

    await project.save();
    res.json({ success: true, message: 'Project updated successfully', project });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project (admin only)
app.delete('/api/projects/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ========== QUERY ROUTES ==========

// Get user queries (or all for admin)
app.get('/api/queries', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const isAdmin = user && user.role === 'ADMIN';

    const filter = isAdmin ? {} : { user: req.userId };

    const queries = await Query.find(filter)
      .populate('user', 'studentFullName email idNumber')
      .populate('repliedBy', 'studentFullName')
      .sort({ createdAt: -1 });

    res.json({ success: true, queries });
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
});

// Create query (student)
app.post('/api/queries', authenticateToken, async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const query = await Query.create({
      user: req.userId,
      subject,
      message,
      status: 'PENDING'
    });

    await query.populate('user', 'studentFullName email idNumber');

    res.status(201).json({ success: true, message: 'Query submitted successfully', query });
  } catch (error) {
    console.error('Error creating query:', error);
    res.status(500).json({ error: 'Failed to submit query' });
  }
});

// Reply to query (admin only)
app.put('/api/queries/:id/reply', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reply, status } = req.body;
    if (!reply) {
      return res.status(400).json({ error: 'Reply message is required' });
    }

    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }

    query.reply = reply;
    query.repliedAt = new Date();
    query.repliedBy = req.userId;
    query.status = status || 'RESOLVED';

    await query.save();

    // Populate for response
    await query.populate('user', 'studentFullName email idNumber');
    await query.populate('repliedBy', 'studentFullName');

    res.json({ success: true, message: 'Reply sent successfully', query });
  } catch (error) {
    console.error('Error replying to query:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// ========== UTILITY ROUTES ==========

app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is responding!', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ok', database: dbStatus, timestamp: new Date().toISOString() });
});

app.get('/test-email', async (req, res) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ error: 'SMTP credentials not configured' });
  }
  try {
    await transporter.verify();
    res.json({ success: true, message: 'Outlook SMTP connection successful!', email: process.env.SMTP_USER });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Outlook SMTP connection failed',
      details: { code: error.code, message: error.message }
    });
  }
});

app.post('/test-email-send', async (req, res) => {
  const { to } = req.body;
  const testEmail = to || process.env.SMTP_USER;

  if (!testEmail || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(400).json({ error: 'Email address and SMTP credentials required' });
  }

  try {
    const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const mailOptions = {
      from: `"ZeroOne Coding Club" <${process.env.SMTP_USER}>`,
      to: testEmail,
      subject: '🧪 Test Email - ZeroOne Coding Club ERP',
      text: `This is a test email from ZeroOne Coding Club ERP.\n\nTest OTP: ${testOTP}\n\nIf you received this email, your Outlook SMTP configuration is working correctly!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0b1220;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #4f9cff; margin: 0; font-size: 32px; font-weight: bold;">ZeroOne Coding Club</h1>
              <p style="color: #60a5fa; margin: 8px 0 0 0; font-size: 18px;">ERP Portal - Test Email</p>
            </div>
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #fff; text-align: center;">✅ Test Email Successful!</p>
              <div style="background: #0b1220; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid rgba(79, 156, 255, 0.3);">
                <p style="color: #4f9cff; font-size: 16px; margin: 0;">Test OTP Code:</p>
                <h2 style="color: #4f9cff; font-size: 36px; letter-spacing: 8px; margin: 10px 0 0 0; font-weight: bold; font-family: 'Courier New', monospace;">${testOTP}</h2>
              </div>
              <p style="margin: 20px 0 0 0; font-size: 14px; color: #e0e0e0; text-align: center;">If you received this email, your Outlook SMTP configuration is working correctly! 🎉</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await withTimeout(transporter.sendMail(mailOptions), 15000, 'SMTP timeout');
    res.json({ success: true, message: 'Test email sent successfully!', to: testEmail, messageId: info.messageId, testOTP });
  } catch (error) {
    console.error('Test email error:', error);
    let errorMessage = 'Failed to send test email.';
    if (error.code === 'EAUTH' || error.responseCode === 535) errorMessage = 'Outlook authentication failed.';
    else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.message === 'SMTP timeout') errorMessage = 'Connection to Outlook server failed.';
    res.status(500).json({ success: false, error: errorMessage, details: { code: error.code, message: error.message } });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
