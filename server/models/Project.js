import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
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
    maxlength: 2000
  },
  isActive: {
    type: Boolean,
    default: true
  },
  referenceFiles: {
    type: [String],
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create index for faster queries
projectSchema.index({ isActive: 1, createdAt: -1 });

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export default Project;

