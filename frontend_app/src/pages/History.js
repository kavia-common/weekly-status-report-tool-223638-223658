/**
 * History view listing user's weekly reports with filters.
 */
// PUBLIC_INTERFACE
import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Alert } from '../components/UI/Alert';

export default function History() {
  const { user, client } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('all'); // all | draft | submitted
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const load = async () => {
    if (!client || !user) return;
    setLoading(true);
    setErr(null);
    try {
      let query = client.from('weekly_reports')
        .select('*')
        .eq('user_id', user.id);

      if (status !== 'all') query = query.eq('status', status);
      if (from) query = query.gte('week_start', from);
      if (to) query = query.lte('week_start', to);

      const { data, error } = await query.order('week_start', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, client]);

  return (
    <DashboardLayout>
      <div className="container" style={{ padding: 0 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Report History</h3>
          <div className="row">
            <div className="form-group">
              <label>Status</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
              </select>
            </div>
            <Input label="From (week start)" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input label="To (week start)" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <div className="form-group" style={{ alignSelf: 'flex-end' }}>
              <Button onClick={load}>Apply</Button>
            </div>
          </div>
          {err && <Alert kind="error">{err}</Alert>}
          {loading ? (
            <div className="help">Loading…</div>
          ) : (
            <div>
              {items.length === 0 && <div className="help">No reports found.</div>}
              {items.map((it) => (
                <div key={it.id} className="card" style={{ marginBottom: 10 }}>
                  <div className="row" style={{ alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Week of {it.week_start}</div>
                      <div className="help">Updated: {new Date(it.updated_at).toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge" style={{ textTransform: 'capitalize' }}>{it.status}</span>
                    </div>
                  </div>
                  {it.sections?.accomplishments && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Accomplishments: </strong>
                      <span className="help">{it.sections.accomplishments.slice(0, 200)}{it.sections.accomplishments.length > 200 ? '…' : ''}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
