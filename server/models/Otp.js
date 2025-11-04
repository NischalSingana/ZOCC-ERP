import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired documents
  },
  attempts: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['email-verification', 'password-reset'],
    default: 'email-verification'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for faster lookups
otpSchema.index({ email: 1, expiresAt: 1 });

const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);

export default Otp;

