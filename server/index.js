import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import mongoose from 'mongoose';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import connectDB from './db/connect.js';
import Otp from './models/Otp.js';
import User from './models/User.js';
import Session from './models/Session.js';
import Submission from './models/Submission.js';
import Attendance from './models/Attendance.js';

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
    if (!user || user.role !== 'ADMIN') {
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
    const sessions = await Session.find().sort({ date: 1, time: 1 });
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
    const submissions = await Submission.find(query)
      .populate({ path: 'sessionId', select: 'title description date time venue trainer', model: 'Session' })
      .populate({ path: 'userId', select: 'studentFullName email idNumber', model: 'User' })
      .sort({ submittedAt: -1 });
    
    res.json({ success: true, submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Upload submission
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
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
      cb(new Error('Only images, PDFs, and Word documents are allowed'), false);
    }
  }
});

let r2Client = null;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  });
  console.log('✅ Cloudflare R2 client initialized');
}

app.post('/api/submissions', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { sessionId, notes } = req.body;
    if (!sessionId || !req.file) {
      return res.status(400).json({ error: 'Session ID and file are required' });
    }

    if (!r2Client || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
      return res.status(503).json({ error: 'File upload service is not configured' });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const mimeType = req.file.mimetype;
    let fileType = 'image';
    if (mimeType === 'application/pdf') fileType = 'pdf';
    else if (mimeType === 'application/msword') fileType = 'doc';
    else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileType = 'docx';

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const uniqueFileName = `submissions/${req.userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: uniqueFileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      CacheControl: 'public, max-age=31536000'
    }));

    const cleanPublicUrl = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
    const cleanFileName = uniqueFileName.startsWith('/') ? uniqueFileName.slice(1) : uniqueFileName;
    const fileUrl = `${cleanPublicUrl}/${cleanFileName}`;
    
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

    res.status(201).json({ success: true, message: 'Submission uploaded successfully', submission });
  } catch (error) {
    console.error('Error uploading submission:', error);
    res.status(500).json({ error: 'Failed to upload submission. Please try again.' });
  }
});

// Update submission status (admin only)
app.put('/api/submissions/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    const { status, feedback } = req.body;
    
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
    submission.reviewedAt = new Date();
    submission.reviewedBy = req.userId;
    await submission.save();
    
    await submission.populate({ path: 'sessionId', select: 'title description date time venue trainer', model: 'Session' });
    await submission.populate({ path: 'userId', select: 'studentFullName email idNumber', model: 'User' });
    
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
    const isAdmin = user && user.role === 'ADMIN';
    
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

    const attendance = await Attendance.findOneAndUpdate(
      { userId: targetUserId, sessionId },
      { userId: targetUserId, sessionId, status: status.toLowerCase(), markedAt: new Date() },
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
        status: attendanceRecord?.status || 'absent',
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
    if (!r2Client || !R2_BUCKET_NAME) {
      return res.status(503).json({ error: 'File service not configured' });
    }

    const filePath = req.params.filePath;
    if (!filePath || !filePath.startsWith('submissions/')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const response = await r2Client.send(new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filePath
    }));

    res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
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

// Reset student password (admin only)
app.post('/api/admin/students/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    student.password = hashedPassword;
    await student.save();
    res.json({ success: true, message: 'Password reset successfully. Student should use forgot password to set a new one.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
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
