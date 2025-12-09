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
    required: false,
    trim: true,
    unique: true,
    sparse: true,
    validate: {
      validator: function (v) {
        // Allow null, undefined, or empty string
        if (!v || v === '') return true;
        // Otherwise must be exactly 10 digits
        return /^\d{10}$/.test(v);
      },
      message: 'ID number must be exactly 10 digits'
    }
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
  role: {
    type: String,
    enum: ['STUDENT', 'ADMIN'],
    default: 'STUDENT'
  },
  phone: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    trim: true
  },
  accountStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'APPROVED' // Default to approved for existing flow
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

// Note: email and idNumber indexes are automatically created by unique: true
// No need to create them explicitly

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;

