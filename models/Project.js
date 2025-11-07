const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  boards: [{
    name: {
      type: String,
      required: true,
      default: 'Main Board'
    },
    lists: [{
      name: {
        type: String,
        required: true
      },
      order: Number,
      tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
      }]
    }]
  }],
  color: {
    type: String,
    default: '#00d4ff'
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'completed'],
    default: 'active'
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  deadline: Date,
  tags: [String]
}, {
  timestamps: true
});

// Initialize with default board and lists
projectSchema.pre('save', function(next) {
  if (this.isNew && this.boards.length === 0) {
    this.boards.push({
      name: 'Main Board',
      lists: [
        { name: 'To Do', order: 1, tasks: [] },
        { name: 'In Progress', order: 2, tasks: [] },
        { name: 'Done', order: 3, tasks: [] }
      ]
    });
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
