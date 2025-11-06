import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error verifying admin access' });
  }
};

// Get all students (admin only)
router.get('/students', authenticateToken, requireAdmin, async (req, res) => {
  try {
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

// Get single student by ID (admin only)
router.get('/students/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Update student (admin only)
router.put('/students/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { studentFullName, email, phone } = req.body;
    
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    if (studentFullName) student.studentFullName = studentFullName;
    if (email) student.email = email.toLowerCase();
    if (phone !== undefined) student.phone = phone || null;
    
    await student.save();
    
    res.json({
      success: true,
      message: 'Student updated successfully',
      student: {
        id: student._id,
        studentFullName: student.studentFullName,
        email: student.email,
        phone: student.phone,
        idNumber: student.idNumber,
        role: student.role,
        emailVerified: student.emailVerified,
      },
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Reset student password (admin only)
router.post('/students/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    student.password = hashedPassword;
    await student.save();
    
    // Send password reset email (implement email sending here)
    // For now, just return success
    res.json({
      success: true,
      message: 'Password reset successfully. Student should use forgot password to set a new one.',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;

