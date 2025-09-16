import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  locationZone: {
    type: String,
    required: true,
    maxlength: 100
  }
}, {
  timestamps: true
});

export default mongoose.model('Department', departmentSchema);

