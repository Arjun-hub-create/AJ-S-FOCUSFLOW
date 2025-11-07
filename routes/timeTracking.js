const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

// @route   POST /api/time/start
// @desc    Start time tracking
// @access  Private
router.post('/start', protect, async (req, res) => {
  try {
    const { taskId, description } = req.body;

    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has running timer
    const runningTimer = await TimeEntry.findOne({
      user: req.user.id,
      isRunning: true
    });

    if (runningTimer) {
      return res.status(400).json({
        success: false,
        message: 'You already have a running timer. Stop it first.'
      });
    }

    const timeEntry = await TimeEntry.create({
      user: req.user.id,
      task: taskId,
      project: task.project,
      description,
      startTime: new Date(),
      isRunning: true
    });

    const populatedEntry = await TimeEntry.findById(timeEntry._id)
      .populate('task', 'title')
      .populate('project', 'name');

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`user-${req.user.id}`).emit('timer-started', populatedEntry);

    res.status(201).json({
      success: true,
      message: 'Timer started',
      timeEntry: populatedEntry
    });
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/time/stop/:id
// @desc    Stop time tracking
// @access  Private
router.post('/stop/:id', protect, async (req, res) => {
  try {
    let timeEntry = await TimeEntry.findById(req.params.id);

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    if (timeEntry.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!timeEntry.isRunning) {
      return res.status(400).json({
        success: false,
        message: 'Timer is already stopped'
      });
    }

    timeEntry.endTime = new Date();
    timeEntry.isRunning = false;
    timeEntry.duration = Math.floor((timeEntry.endTime - timeEntry.startTime) / 1000);
    await timeEntry.save();

    // Update task total time
    const task = await Task.findById(timeEntry.task);
    task.totalTimeSpent += timeEntry.duration;
    task.timeEntries.push(timeEntry._id);
    await task.save();

    const populatedEntry = await TimeEntry.findById(timeEntry._id)
      .populate('task', 'title')
      .populate('project', 'name');

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`user-${req.user.id}`).emit('timer-stopped', populatedEntry);

    res.json({
      success: true,
      message: 'Timer stopped',
      timeEntry: populatedEntry
    });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/time
// @desc    Get time entries (with filters)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { project, task, startDate, endDate } = req.query;

    let query = { user: req.user.id };
    
    if (project) query.project = project;
    if (task) query.task = task;
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const entries = await TimeEntry.find(query)
      .populate('task', 'title status')
      .populate('project', 'name color')
      .sort('-startTime');

    const totalTime = entries.reduce((sum, entry) => sum + entry.duration, 0);

    res.json({
      success: true,
      count: entries.length,
      totalTime, // in seconds
      entries
    });
  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/time/active
// @desc    Get active timer
// @access  Private
router.get('/active', protect, async (req, res) => {
  try {
    const activeTimer = await TimeEntry.findOne({
      user: req.user.id,
      isRunning: true
    })
    .populate('task', 'title')
    .populate('project', 'name color');

    res.json({
      success: true,
      activeTimer
    });
  } catch (error) {
    console.error('Get active timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/time/:id
// @desc    Delete time entry
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findById(req.params.id);

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    if (timeEntry.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await timeEntry.deleteOne();

    res.json({
      success: true,
      message: 'Time entry deleted'
    });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
