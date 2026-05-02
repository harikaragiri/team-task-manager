const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const isMember = project.owner.equals(userId) ||
    project.members.some(m => m.user.equals(userId));
  return isMember ? project : false;
};

// GET /api/tasks?project=id  or  GET /api/tasks (all user tasks)
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.query.project) {
      const access = await checkProjectAccess(req.query.project, req.user._id);
      if (!access) return res.status(403).json({ success: false, message: 'Access denied' });
      query.project = req.query.project;
    } else {
      // Get all projects user is part of
      const projects = await Project.find({
        $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
      }).select('_id');
      query.project = { $in: projects.map(p => p._id) };
    }
    if (req.query.status) query.status = req.query.status;
    if (req.query.assignee) query.assignee = req.query.assignee;

    const tasks = await Task.find(query)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name color')
      .sort({ createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/tasks
router.post('/', protect, [
  body('title').trim().isLength({ min: 2 }).withMessage('Task title required'),
  body('project').notEmpty().withMessage('Project ID required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { title, description, project, assignee, status, priority, dueDate, tags } = req.body;
    const access = await checkProjectAccess(project, req.user._id);
    if (!access) return res.status(403).json({ success: false, message: 'Access denied' });
    const task = await Task.create({
      title, description, project, assignee, status, priority, dueDate, tags,
      createdBy: req.user._id
    });
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name color');
    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name color');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const access = await checkProjectAccess(task.project._id, req.user._id);
    if (!access) return res.status(403).json({ success: false, message: 'Access denied' });
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const access = await checkProjectAccess(task.project, req.user._id);
    if (!access) return res.status(403).json({ success: false, message: 'Access denied' });
    const { title, description, assignee, status, priority, dueDate, tags } = req.body;
    Object.assign(task, { title, description, assignee, status, priority, dueDate, tags });
    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name color');
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const project = await Project.findById(task.project);
    const isAdmin = project.owner.equals(req.user._id) ||
      project.members.some(m => m.user.equals(req.user._id) && m.role === 'admin') ||
      task.createdBy.equals(req.user._id);
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Not authorized' });
    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tasks/dashboard/stats
router.get('/dashboard/stats', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    }).select('_id');
    const projectIds = projects.map(p => p._id);
    const tasks = await Task.find({ project: { $in: projectIds } });
    const now = new Date();
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
      myTasks: tasks.filter(t => t.assignee && t.assignee.equals(req.user._id)).length,
      projects: projects.length
    };
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
