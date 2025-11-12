/**
 * Dashboard layout with topbar and sidebar.
 */
// PUBLIC_INTERFACE
import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function DashboardLayout({ children }) {
  return (
    <div className="app-shell">
      <Topbar />
      <div className="shell-body">
        <Sidebar />
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
}
