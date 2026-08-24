import { useEffect, useState } from 'react';
import { getAuth } from '../utils/auth';
import { getAdminDashboard } from '../api/client';
import Navbar from '../components/Navbar';

function AdminDashboard() {
  const auth = getAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getAdminDashboard(auth?.token);
        if (!cancelled) {
          setStats(data);
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

  return (
    <>
      <Navbar />
      <div className="page-content admin-page">
        <h1>Welcome back, {auth?.user?.name}</h1>
        <p className="hint">Here&apos;s how things are looking across the building.</p>

        {loading && <p>Loading…</p>}
        {error && <p className="form-error">{error}</p>}

        {stats && (
          <div className="dashboard-stats">
            <div className="stat-cards">
              <div className="stat-card stat-card-overdue">
                <span className="stat-value">{stats.overdue_count}</span>
                <span className="stat-label">Overdue</span>
              </div>
            </div>

            <div className="stat-group">
              <h2>By status</h2>
              <div className="stat-cards">
                {Object.entries(stats.by_status).map(([status, count]) => (
                  <div key={status} className="stat-card">
                    <span className="stat-value">{count}</span>
                    <span className="stat-label">{status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="stat-group">
              <h2>By category</h2>
              <div className="stat-cards">
                {Object.entries(stats.by_category).map(([category, count]) => (
                  <div key={category} className="stat-card">
                    <span className="stat-value">{count}</span>
                    <span className="stat-label">{category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminDashboard;
