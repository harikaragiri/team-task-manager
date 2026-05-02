import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const statusColors = { todo: '#64748b', 'in-progress': '#2563eb', review: '#d97706', done: '#059669' };
const priorityColors = { low: '#16a34a', medium: '#ca8a04', high: '#ea580c', urgent: '#dc2626' };

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          API.get('/tasks/dashboard/stats'),
          API.get('/tasks?assignee=' + user._id)
        ]);
        setStats(statsRes.data.stats);
        setTasks(tasksRes.data.tasks.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user._id]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Total Tasks', value: stats?.total || 0, color: '#6366f1', bg: '#eef2ff' },
    { label: 'In Progress', value: stats?.inProgress || 0, color: '#2563eb', bg: '#dbeafe' },
    { label: 'Overdue', value: stats?.overdue || 0, color: '#dc2626', bg: '#fee2e2' },
    { label: 'Completed', value: stats?.done || 0, color: '#059669', bg: '#d1fae5' },
    { label: 'My Tasks', value: stats?.myTasks || 0, color: '#d97706', bg: '#fef3c7' },
    { label: 'Projects', value: stats?.projects || 0, color: '#7c3aed', bg: '#ede9fe' },
  ];

  const now = new Date();

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 20 }}>Good {getTimeOfDay()}, {user?.name?.split(' ')[0]} 👋</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>Here's what's happening today</p>
        </div>
        <Link to="/tasks" className="btn btn-primary btn-sm">+ New Task</Link>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          {statCards.map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Progress bar */}
          <div className="card">
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>Task Progress</h3>
            {[
              { label: 'To Do', value: stats?.todo || 0, color: statusColors.todo },
              { label: 'In Progress', value: stats?.inProgress || 0, color: statusColors['in-progress'] },
              { label: 'In Review', value: stats?.review || 0, color: statusColors.review },
              { label: 'Done', value: stats?.done || 0, color: statusColors.done },
            ].map(bar => (
              <div key={bar.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{bar.label}</span><span style={{ fontWeight: 600 }}>{bar.value}</span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: bar.color, borderRadius: 4,
                    width: stats?.total ? `${(bar.value / stats.total) * 100}%` : '0%',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Recent tasks */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16 }}>My Recent Tasks</h3>
              <Link to="/tasks" style={{ fontSize: 13, color: '#6366f1' }}>View all →</Link>
            </div>
            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: 14 }}>
                No tasks assigned yet
              </div>
            ) : tasks.map(task => {
              const overdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
              return (
                <div key={task._id} style={{
                  padding: '10px 0', borderBottom: '1px solid #f1f5f9',
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: priorityColors[task.priority] || '#64748b'
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {task.project?.name} {overdue && <span style={{ color: '#dc2626' }}>· Overdue</span>}
                    </div>
                  </div>
                  <span className={`badge badge-${task.status}`} style={{ fontSize: 11 }}>{task.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
