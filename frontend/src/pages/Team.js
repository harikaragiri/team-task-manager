import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Team() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/auth/users').then(res => setUsers(res.data.users)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 20 }}>Team Members</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>{users.length} member{users.length !== 1 ? 's' : ''} in workspace</p>
        </div>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {users.map((u, i) => (
            <div key={u._id} className="card" style={{ textAlign: 'center', padding: 24 }}>
              <div className="avatar" style={{ background: COLORS[i % COLORS.length], width: 56, height: 56, fontSize: 22, margin: '0 auto 12px' }}>
                {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>{u.name}</h3>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{u.email}</p>
              <span className={`badge badge-${u.role}`}>{u.role}</span>
              {u._id === user._id && <span className="badge" style={{ marginLeft: 6, background: '#f0fdf4', color: '#16a34a' }}>You</span>}
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
                Joined {new Date(u.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
