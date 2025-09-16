import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Infrastructure', 'Environment', 'Safety', 'Transportation', 'Utilities', 'Other'],
    maxlength: 50
  },
  zone: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true
  },
  photoUrl: {
    type: String,
    default: null
  },
  location: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    address: {
      type: String,
      default: ''
    }
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in_progress', 'awaiting_confirmation', 'resolved'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Citizen confirmation after resolution
  resolutionConfirmed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for geospatial queries
issueSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

export default mongoose.model('Issue', issueSchema);

