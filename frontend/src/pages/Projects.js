import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', deadline: '', color: COLORS[0] });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await API.post('/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '', deadline: '', color: COLORS[0] });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const isOwner = (project) => project.owner?._id === user._id || project.owner === user._id;

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 20 }}>Projects</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>
      <div className="page-body">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📁</div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>Create Project</button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(p => (
              <div key={p._id} className="project-card" style={{ '--project-color': p.color }}
                onClick={() => navigate(`/projects/${p._id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16 }}>{p.name}</h3>
                  <span className={`badge ${p.status === 'active' ? 'badge-in-progress' : p.status === 'completed' ? 'badge-done' : 'badge-todo'}`}>
                    {p.status}
                  </span>
                </div>
                {p.description && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>{p.description}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
                  <div style={{ display: 'flex', gap: -4 }}>
                    {(p.members || []).slice(0, 4).map((m, i) => (
                      <div key={i} className="avatar avatar-sm"
                        style={{ background: COLORS[i % COLORS.length], marginLeft: i > 0 ? -8 : 0, border: '2px solid white' }}>
                        {(m.user?.name || '?')[0].toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{p.members?.length || 0} member{p.members?.length !== 1 ? 's' : ''}</span>
                  {isOwner(p) && <span className="badge badge-admin" style={{ marginLeft: 'auto', fontSize: 11 }}>Owner</span>}
                </div>
                {p.deadline && (
                  <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
                    📅 Due {new Date(p.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Create New Project</h3>
              <button className="btn btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name *</label>
                <input type="text" placeholder="e.g. Website Redesign" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Brief description..." value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input type="date" value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setForm({ ...form, color: c })}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                        border: form.color === c ? '3px solid #1e293b' : '3px solid transparent',
                        transition: 'transform 0.1s'
                      }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
