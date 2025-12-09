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
    type: Date,
    required: false
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
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
  maxSeats: {
    type: Number,
    default: 50
  },
  joinLink: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for faster queries
sessionSchema.index({ date: 1, startTime: 1 });

const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

export default Session;

