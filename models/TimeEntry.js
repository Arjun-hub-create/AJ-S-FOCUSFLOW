const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: Date,
  duration: {
    type: Number, // in seconds
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  isRunning: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate duration when stopping timer
timeEntrySchema.pre('save', function(next) {
  if (this.endTime && this.startTime && !this.isRunning) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
