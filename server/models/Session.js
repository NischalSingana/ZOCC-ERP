import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  date: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
  },
  time: {
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format']
  },
  venue: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  trainer: {
    type: String,
    trim: true,
    maxlength: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for faster queries
sessionSchema.index({ date: 1, time: 1 });

const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

export default Session;

