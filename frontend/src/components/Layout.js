import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: '⊞',
  projects: '📁',
  tasks: '✓',
  team: '👥',
  logout: '⇤'
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>⚡ TaskFlow</h2>
          <span>Team Task Manager</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard">
            <span>{icons.dashboard}</span> Dashboard
          </NavLink>
          <NavLink to="/projects">
            <span>{icons.projects}</span> Projects
          </NavLink>
          <NavLink to="/tasks">
            <span>{icons.tasks}</span> My Tasks
          </NavLink>
          <NavLink to="/team">
            <span>{icons.team}</span> Team
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar" style={{ background: '#6366f1' }}>{initials}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ color: 'white', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ color: '#a5b4fc', fontSize: 12 }}>{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-sm" onClick={handleLogout}
            style={{ width: '100%', marginTop: 8, background: 'rgba(255,255,255,0.1)', color: '#a5b4fc', justifyContent: 'center' }}>
            {icons.logout} Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
