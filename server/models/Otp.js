import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
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

// Create compound index for faster lookups (covers email queries via leftmost prefix)
// TTL index on expiresAt is already defined in the schema for auto-deletion
otpSchema.index({ email: 1, expiresAt: 1 });

const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);

export default Otp;

