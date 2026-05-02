import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['todo', 'in-progress', 'review', 'done'];
const STATUS_LABELS = { 'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'Review', 'done': 'Done' };
const STATUS_COLORS = { todo: '#64748b', 'in-progress': '#2563eb', review: '#d97706', done: '#059669' };
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignee: '', status: 'todo', priority: 'medium', dueDate: '', tags: '' });
  const [memberUserId, setMemberUserId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [projRes, tasksRes, usersRes] = await Promise.all([
        API.get(`/projects/${id}`),
        API.get(`/tasks?project=${id}`),
        API.get('/auth/users')
      ]);
      setProject(projRes.data.project);
      setTasks(tasksRes.data.tasks);
      setAllUsers(usersRes.data.users);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const isAdmin = project && (
    project.owner?._id === user._id ||
    project.members?.some(m => m.user?._id === user._id && m.role === 'admin')
  );

  const openNewTask = () => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', assignee: '', status: 'todo', priority: 'medium', dueDate: '', tags: '' });
    setError('');
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignee: task.assignee?._id || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      tags: (task.tags || []).join(', ')
    });
    setError('');
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...taskForm, project: id, tags: taskForm.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (editingTask) {
        await API.put(`/tasks/${editingTask._id}`, payload);
      } else {
        await API.post('/tasks', payload);
      }
      setShowTaskModal(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await API.delete(`/tasks/${taskId}`);
    fetchAll();
  };

  const handleStatusChange = async (taskId, newStatus) => {
    await API.put(`/tasks/${taskId}`, { status: newStatus });
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post(`/projects/${id}/members`, { userId: memberUserId, role: 'member' });
      setShowMemberModal(false);
      setMemberUserId('');
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!project) return null;

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  const now = new Date();

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/projects')} className="btn btn-secondary btn-sm">← Back</button>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
          <div>
            <h2 style={{ fontSize: 20 }}>{project.name}</h2>
            {project.description && <p style={{ color: '#64748b', fontSize: 13 }}>{project.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => { setError(''); setShowMemberModal(true); }}>+ Member</button>}
          <button className="btn btn-primary btn-sm" onClick={openNewTask}>+ Task</button>
        </div>
      </div>

      <div className="page-body">
        {/* Members */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>Team:</span>
          {project.members?.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div className="avatar avatar-sm" style={{ background: ['#6366f1','#0ea5e9','#10b981','#f59e0b'][i % 4] }}>
                {(m.user?.name || '?')[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 13 }}>{m.user?.name}</span>
              <span className={`badge badge-${m.role}`} style={{ fontSize: 10 }}>{m.role}</span>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="board">
          {STATUSES.map(status => (
            <div key={status} className="board-column">
              <div className="board-column-header">
                <span style={{ color: STATUS_COLORS[status] }}>● {STATUS_LABELS[status]}</span>
                <span style={{ background: '#e2e8f0', borderRadius: 12, padding: '1px 8px', fontSize: 12 }}>
                  {tasksByStatus[status].length}
                </span>
              </div>
              {tasksByStatus[status].map(task => {
                const overdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
                return (
                  <div key={task._id} className={`task-card ${overdue ? 'overdue' : ''}`} onClick={() => openEditTask(task)}>
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>{task.title}</div>
                    {task.description && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className={`badge badge-${task.priority}`} style={{ fontSize: 11 }}>{task.priority}</span>
                      {task.dueDate && <span style={{ fontSize: 11, color: overdue ? '#dc2626' : '#94a3b8' }}>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                    {task.assignee && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                        <div className="avatar avatar-sm" style={{ background: '#6366f1' }}>{task.assignee.name[0].toUpperCase()}</div>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{task.assignee.name}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }} onClick={e => e.stopPropagation()}>
                      <select style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer' }}
                        value={task.status} onChange={e => handleStatusChange(task._id, e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                      {isAdmin && (
                        <button className="btn btn-sm btn-danger" style={{ padding: '2px 8px', fontSize: 11 }}
                          onClick={() => handleDeleteTask(task._id)}>Delete</button>
                      )}
                    </div>
                  </div>
                );
              })}
              {tasksByStatus[status].length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: '#94a3b8' }}>No tasks</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowTaskModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editingTask ? 'Edit Task' : 'New Task'}</h3>
              <button className="btn btn-icon" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" placeholder="Task title" value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Task description..." value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Assignee</label>
                <select value={taskForm.assignee} onChange={e => setTaskForm({ ...taskForm, assignee: e.target.value })}>
                  <option value="">Unassigned</option>
                  {project.members?.map(m => (
                    <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={taskForm.dueDate}
                  onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" placeholder="e.g. frontend, bug, urgent" value={taskForm.tags}
                  onChange={e => setTaskForm({ ...taskForm, tags: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMemberModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Team Member</h3>
              <button className="btn btn-icon" onClick={() => setShowMemberModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>Select User</label>
                <select value={memberUserId} onChange={e => setMemberUserId(e.target.value)} required>
                  <option value="">Choose a user...</option>
                  {allUsers.filter(u => !project.members?.some(m => m.user?._id === u._id)).map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
