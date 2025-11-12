/**
 * Simple dashboard overview page.
 */
// PUBLIC_INTERFACE
import React from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { Button } from '../components/UI/Button';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="container" style={{ padding: 0 }}>
        <div className="row" style={{ marginBottom: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Welcome</h3>
            <p className="help">Create and submit your weekly report, or review your submission history.</p>
            <div className="row">
              <Link to="/weekly-report"><Button>New Weekly Report</Button></Link>
              <Link to="/history"><Button variant="secondary">View History</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
