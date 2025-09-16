import mongoose from 'mongoose';

const issueUpdateSchema = new mongoose.Schema({
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in_progress', 'awaiting_confirmation', 'resolved'],
    required: true
  },
  comment: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('IssueUpdate', issueUpdateSchema);

