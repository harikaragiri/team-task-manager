import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['', 'todo', 'in-progress', 'review', 'done'];
const PRIORITY_COLORS = { low: '#16a34a', medium: '#ca8a04', high: '#ea580c', urgent: '#dc2626' };

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', project: '', assignee: '', status: 'todo', priority: 'medium', dueDate: '', tags: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [tasksRes, projRes] = await Promise.all([
        API.get('/tasks'),
        API.get('/projects')
      ]);
      setTasks(tasksRes.data.tasks);
      setProjects(projRes.data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterProject && t.project?._id !== filterProject) return false;
    return true;
  });

  const openNew = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', project: '', assignee: '', status: 'todo', priority: 'medium', dueDate: '', tags: '' });
    setMembers([]);
    setError('');
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      project: task.project?._id || '',
      assignee: task.assignee?._id || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      tags: (task.tags || []).join(', ')
    });
    const proj = projects.find(p => p._id === (task.project?._id || task.project));
    setMembers(proj?.members || []);
    setError('');
    setShowModal(true);
  };

  const handleProjectChange = (projectId) => {
    setForm(f => ({ ...f, project: projectId, assignee: '' }));
    const proj = projects.find(p => p._id === projectId);
    setMembers(proj?.members || []);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (editingTask) {
        await API.put(`/tasks/${editingTask._id}`, payload);
      } else {
        await API.post('/tasks', payload);
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await API.delete(`/tasks/${id}`);
    fetchAll();
  };

  const now = new Date();

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 20 }}>All Tasks</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New Task</button>
      </div>
      <div className="page-body">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
            value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="icon">✓</div>
            <h3>No tasks found</h3>
            <p>Create a task to get started</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => {
                  const overdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
                  return (
                    <tr key={task._id}>
                      <td>
                        <div style={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.title}
                        </div>
                        {task.tags?.length > 0 && <div style={{ marginTop: 4 }}>{task.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.project?.color || '#6366f1', flexShrink: 0 }} />
                          <span style={{ fontSize: 13 }}>{task.project?.name || '—'}</span>
                        </div>
                      </td>
                      <td><span className={`badge badge-${task.status}`}>{task.status.replace('-', ' ')}</span></td>
                      <td>
                        <span style={{ fontSize: 13, fontWeight: 500, color: PRIORITY_COLORS[task.priority] }}>
                          {task.priority}
                        </span>
                      </td>
                      <td>
                        {task.assignee ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="avatar avatar-sm" style={{ background: '#6366f1' }}>{task.assignee.name[0]}</div>
                            <span style={{ fontSize: 13 }}>{task.assignee.name}</span>
                          </div>
                        ) : <span style={{ color: '#94a3b8', fontSize: 13 }}>Unassigned</span>}
                      </td>
                      <td style={{ fontSize: 13, color: overdue ? '#dc2626' : '#64748b' }}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                        {overdue && ' ⚠️'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(task)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(task._id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editingTask ? 'Edit Task' : 'New Task'}</h3>
              <button className="btn btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" placeholder="Task title" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Project *</label>
                <select value={form.project} onChange={e => handleProjectChange(e.target.value)} required>
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Assignee</label>
                <select value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Tags</label>
                <input type="text" placeholder="frontend, bug, urgent" value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
