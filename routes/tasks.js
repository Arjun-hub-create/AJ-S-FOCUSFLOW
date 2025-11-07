const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', protect, [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('project').notEmpty().withMessage('Project ID is required')
], validate, async (req, res) => {
  try {
    const { title, description, project, assignees, priority, dueDate, labels, status } = req.body;

    // Verify project exists and user is member
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignees,
      creator: req.user.id,
      priority,
      dueDate,
      labels,
      status: status || 'todo'
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('project', 'name');

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`project-${project}`).emit('task-created', populatedTask);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks (with filters)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { project, status, assignee, priority } = req.query;

    let query = {};
    
    if (project) query.project = project;
    if (status) query.status = status;
    if (assignee) query.assignees = assignee;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('assignees', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('project', 'name color')
      .sort('-createdAt');

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('project', 'name color')
      .populate('comments.user', 'name email avatar')
      .populate('timeEntries');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('assignees', 'name email avatar')
    .populate('creator', 'name email avatar')
    .populate('project', 'name color');

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`project-${task.project._id}`).emit('task-updated', task);

    res.json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.deleteOne();

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`project-${task.project}`).emit('task-deleted', { taskId: task._id });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', protect, [
  body('text').trim().notEmpty().withMessage('Comment text is required')
], validate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.comments.push({
      user: req.user.id,
      text: req.body.text
    });

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('comments.user', 'name email avatar');

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`project-${task.project}`).emit('comment-added', {
      taskId: task._id,
      comment: updatedTask.comments[updatedTask.comments.length - 1]
    });

    res.json({
      success: true,
      message: 'Comment added successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
