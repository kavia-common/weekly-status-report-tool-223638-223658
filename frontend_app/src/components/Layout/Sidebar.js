/**
 * Sidebar with navigation links.
 */
// PUBLIC_INTERFACE
import React from 'react';
import { NavLink } from 'react-router-dom';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div className="brand">
          Weekly Reports
        </div>
        <div className="subtitle">Executive Gray</div>
      </div>
      <nav>
        <NavLink className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`} to="/dashboard">Dashboard</NavLink>
        <NavLink className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`} to="/weekly-report">Weekly Report</NavLink>
        <NavLink className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`} to="/history">History</NavLink>
      </nav>
    </aside>
  );
}
