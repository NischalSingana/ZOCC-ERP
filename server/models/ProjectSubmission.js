import mongoose from 'mongoose';

const projectSubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
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
    enum: ['image', 'pdf', 'doc', 'docx', 'zip'],
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
projectSubmissionSchema.index({ userId: 1, projectId: 1 });
projectSubmissionSchema.index({ status: 1 });

const ProjectSubmission = mongoose.models.ProjectSubmission || mongoose.model('ProjectSubmission', projectSubmissionSchema);

export default ProjectSubmission;

