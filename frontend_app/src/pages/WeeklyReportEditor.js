/**
 * Weekly Report editor page with auto-save drafts and submit/publish flow.
 * Saves to Supabase table 'weekly_reports':
 *  - id (uuid), user_id, week_start (date), status ('draft'|'submitted'),
 *  - sections (jsonb), updated_at (timestamp)
 */
// PUBLIC_INTERFACE
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { TextArea } from '../components/UI/TextArea';
import { Alert } from '../components/UI/Alert';
import { useAuth } from '../contexts/AuthContext';

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sunday..6 Saturday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  const monday = new Date(d.setDate(diff));
  monday.setHours(0,0,0,0);
  return monday;
}

function toISODate(d) {
  const dd = new Date(d);
  return dd.toISOString().split('T')[0];
}

const emptySections = () => ({
  accomplishments: '',
  plans: '',
  blockers: '',
  notes: '',
});

export default function WeeklyReportEditor() {
  const { user, client } = useAuth();
  const [weekStart, setWeekStart] = useState(toISODate(startOfWeek(new Date())));
  const [sections, setSections] = useState(emptySections());
  const [status, setStatus] = useState('draft');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  const [reportId, setReportId] = useState(null);
  const saveTimer = useRef(null);

  const sectionSet = (key, val) => setSections((s) => ({ ...s, [key]: val }));

  const formIsValid = useMemo(() => {
    // simple validation: accomplishments or plans should be filled for submit
    const hasCore = sections.accomplishments.trim().length > 0 || sections.plans.trim().length > 0;
    return { draft: true, submit: hasCore };
  }, [sections]);

  const loadExistingDraft = async (wk) => {
    setError(null);
    if (!client || !user) return;
    const { data, error: err } = await client
      .from('weekly_reports')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', wk)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (err && err.code !== 'PGRST116') {
      setError(err.message || String(err));
      return;
    }
    if (data) {
      setReportId(data.id);
      setSections({
        accomplishments: data.sections?.accomplishments || '',
        plans: data.sections?.plans || '',
        blockers: data.sections?.blockers || '',
        notes: data.sections?.notes || '',
      });
      setStatus(data.status || 'draft');
      setLastSaved(data.updated_at);
    } else {
      setReportId(null);
      setSections(emptySections());
      setStatus('draft');
      setLastSaved(null);
    }
  };

  useEffect(() => {
    loadExistingDraft(weekStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, user?.id, client]);

  // Auto-save draft after debounce
  useEffect(() => {
    if (!client || !user) return;
    if (status !== 'draft') return; // don't auto-save submitted reports
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      setError(null);
      try {
        const payload = {
          user_id: user.id,
          week_start: weekStart,
          status: 'draft',
          sections,
        };
        let resp;
        if (reportId) {
          resp = await client.from('weekly_reports')
            .update(payload)
            .eq('id', reportId)
            .select('*')
            .single();
        } else {
          resp = await client.from('weekly_reports')
            .insert(payload)
            .select('*')
            .single();
        }
        if (resp.error) throw resp.error;
        if (!reportId) setReportId(resp.data.id);
        setLastSaved(resp.data.updated_at);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setSaving(false);
      }
    }, 600); // 600ms debounce
    return () => clearTimeout(saveTimer.current);
  }, [sections, weekStart, client, user, reportId, status]);

  const onSubmit = async () => {
    setError(null);
    if (!client || !user) return;
    if (!formIsValid.submit) {
      setError('Please add at least some accomplishments or plans before submitting.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        week_start: weekStart,
        status: 'submitted',
        sections,
      };
      let resp;
      if (reportId) {
        resp = await client.from('weekly_reports')
          .update(payload)
          .eq('id', reportId)
          .select('*')
          .single();
      } else {
        resp = await client.from('weekly_reports')
          .insert(payload)
          .select('*')
          .single();
      }
      if (resp.error) throw resp.error;
      setReportId(resp.data.id);
      setStatus('submitted');
      setLastSaved(resp.data.updated_at);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container" style={{ padding: 0, maxWidth: 900 }}>
        <div className="card">
          <div className="row" style={{ alignItems: 'center', marginBottom: 8 }}>
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 4 }}>Weekly Report</h3>
              <div className="help">Auto-saves as draft. Choose week and fill sections.</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge">Status: {status}</span>
            </div>
          </div>

          {error && <Alert kind="error">{error}</Alert>}
          {lastSaved && <div className="help" style={{ marginBottom: 8 }}>Last saved: {new Date(lastSaved).toLocaleString()}</div>}
          {saving && <div className="help" style={{ marginBottom: 8 }}>Saving…</div>}

          <div className="row">
            <div className="form-group">
              <label>Week starting</label>
              <input
                className="input"
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              />
              <div className="help">Monday of the reporting week.</div>
            </div>
          </div>

          <div className="section">
            <TextArea
              label="Accomplishments"
              rows={5}
              value={sections.accomplishments}
              onChange={(e) => sectionSet('accomplishments', e.target.value)}
              placeholder="What did you complete this week?"
            />
          </div>

          <div className="section">
            <TextArea
              label="Plans"
              rows={4}
              value={sections.plans}
              onChange={(e) => sectionSet('plans', e.target.value)}
              placeholder="What will you work on next week?"
            />
          </div>

          <div className="section">
            <TextArea
              label="Blockers"
              rows={3}
              value={sections.blockers}
              onChange={(e) => sectionSet('blockers', e.target.value)}
              placeholder="Any impediments or risks?"
            />
          </div>

          <div className="section">
            <TextArea
              label="Notes"
              rows={3}
              value={sections.notes}
              onChange={(e) => sectionSet('notes', e.target.value)}
              placeholder="Other updates or context."
            />
          </div>

          <div className="row">
            <Button onClick={onSubmit} disabled={!formIsValid.submit || saving} className="success">
              {status === 'submitted' ? 'Update Submission' : 'Submit Report'}
            </Button>
            <Button variant="secondary" onClick={() => window.history.back()}>Back</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
