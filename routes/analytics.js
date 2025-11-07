const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const TimeEntry = require('../models/TimeEntry');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// @route   GET /api/analytics/overview
// @desc    Get overall analytics
// @access  Private
router.get('/overview', protect, async (req, res) => {
  try {
    const { startDate, endDate, projectId } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let projectFilter = {};
    if (projectId) projectFilter.project = projectId;

    // Get tasks statistics
    const totalTasks = await Task.countDocuments({
      ...projectFilter,
      $or: [
        { creator: req.user.id },
        { assignees: req.user.id }
      ]
    });

    const completedTasks = await Task.countDocuments({
      ...projectFilter,
      ...dateFilter,
      status: 'done',
      $or: [
        { creator: req.user.id },
        { assignees: req.user.id }
      ]
    });

    const inProgressTasks = await Task.countDocuments({
      ...projectFilter,
      status: 'in-progress',
      $or: [
        { creator: req.user.id },
        { assignees: req.user.id }
      ]
    });

    const todoTasks = await Task.countDocuments({
      ...projectFilter,
      status: 'todo',
      $or: [
        { creator: req.user.id },
        { assignees: req.user.id }
      ]
    });

    // Get time tracking statistics
    const timeEntries = await TimeEntry.find({
      ...projectFilter,
      user: req.user.id,
      isRunning: false,
      ...(startDate || endDate ? {
        startTime: dateFilter.createdAt
      } : {})
    });

    const totalTimeSpent = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const avgTimePerTask = totalTasks > 0 ? totalTimeSpent / totalTasks : 0;

    // Get productivity by day of week
    const tasksByDay = await Task.aggregate([
      {
        $match: {
          ...projectFilter,
          ...dateFilter,
          status: 'done',
          $or: [
            { creator: req.user._id },
            { assignees: req.user._id }
          ]
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$completedAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get tasks by priority
    const tasksByPriority = await Task.aggregate([
      {
        $match: {
          ...projectFilter,
          $or: [
            { creator: req.user._id },
            { assignees: req.user._id }
          ]
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get projects statistics
    const totalProjects = await Project.countDocuments({
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ]
    });

    const activeProjects = await Project.countDocuments({
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ],
      status: 'active'
    });

    const completedProjects = await Project.countDocuments({
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ],
      status: 'completed'
    });

    const archivedProjects = await Project.countDocuments({
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ],
      status: 'archived'
    });

    res.json({
      success: true,
      analytics: {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          todo: todoTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          archived: archivedProjects
        },
        time: {
          totalSeconds: totalTimeSpent,
          totalHours: (totalTimeSpent / 3600).toFixed(2),
          avgSecondsPerTask: Math.floor(avgTimePerTask),
          avgHoursPerTask: (avgTimePerTask / 3600).toFixed(2)
        },
        productivity: {
          byDay: tasksByDay,
          byPriority: tasksByPriority
        }
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/project/:id
// @desc    Get project-specific analytics
// @access  Private
router.get('/project/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const tasks = await Task.find({ project: req.params.id });
    const timeEntries = await TimeEntry.find({ 
      project: req.params.id,
      isRunning: false 
    }).populate('user', 'name');

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const totalTime = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);

    // Time by user
    const timeByUser = {};
    timeEntries.forEach(entry => {
      const userName = entry.user.name;
      if (!timeByUser[userName]) {
        timeByUser[userName] = 0;
      }
      timeByUser[userName] += entry.duration;
    });

    res.json({
      success: true,
      analytics: {
        projectName: project.name,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0,
        totalTimeHours: (totalTime / 3600).toFixed(2),
        timeByUser: Object.entries(timeByUser).map(([name, seconds]) => ({
          name,
          hours: (seconds / 3600).toFixed(2)
        }))
      }
    });
  } catch (error) {
    console.error('Project analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
