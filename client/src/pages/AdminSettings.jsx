import { useEffect, useState } from 'react';
import { getAdminSettings, updateAdminSettings } from '../api/client';
import { getAuth } from '../utils/auth';
import Navbar from '../components/Navbar';

function AdminSettings() {
  const auth = getAuth();
  const [thresholdDays, setThresholdDays] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getAdminSettings(auth?.token);
        if (!cancelled) {
          setThresholdDays(String(data.settings.overdue_threshold_days));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [auth?.token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const data = await updateAdminSettings(Number(thresholdDays), auth?.token);
      setThresholdDays(String(data.settings.overdue_threshold_days));
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-content form-page">
      <h1>Settings</h1>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && (
        <form onSubmit={handleSubmit}>
          <label>
            Overdue threshold (days)
            <input
              type="number"
              min="1"
              max="365"
              value={thresholdDays}
              onChange={(e) => setThresholdDays(e.target.value)}
              required
            />
          </label>
          <p className="hint">
            A complaint that isn&apos;t Resolved within this many days of being raised is flagged
            overdue and sorted to the top of the admin complaints list.
          </p>
          {saveError && <p className="form-error">{saveError}</p>}
          {saveSuccess && <p className="form-success">Settings saved.</p>}
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}
      </div>
    </>
  );
}

export default AdminSettings;
