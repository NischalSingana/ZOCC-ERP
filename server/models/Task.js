import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000 // Increased for text content
  },
  isActive: {
    type: Boolean,
    default: true
  },
  attachments: {
    type: [String], // R2 file paths
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create index for faster queries
taskSchema.index({ isActive: 1, createdAt: -1 });

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

export default Task;

