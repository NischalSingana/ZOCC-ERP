import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  studentFullName: {
    type: String,
    required: false, // Will be set during registration
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  idNumber: {
    type: String,
    required: false, // Will be set during registration
    trim: true,
    unique: true,
    sparse: true, // Allows multiple null/undefined values
    match: [/^\d{10}$/, 'ID number must be exactly 10 digits']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: false, // Will be set during registration
    minlength: 6
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ idNumber: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;

