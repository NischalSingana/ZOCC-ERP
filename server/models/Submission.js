import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  fileUrl: {
    type: String,
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileType: {
    type: String,
    enum: ['image', 'pdf', 'doc', 'docx'],
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING',
    set: (value) => value ? value.toUpperCase() : 'PENDING'
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: 500
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
submissionSchema.index({ userId: 1, sessionId: 1 });
submissionSchema.index({ status: 1 });

const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);

export default Submission;

