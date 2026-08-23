import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, clearAuth } from '../utils/auth';
import { getAdminDashboard } from '../api/client';

function AdminDashboard() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

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
    <div className="admin-page">
      <h1>Admin dashboard</h1>
      <p>Welcome, {auth?.user?.name}.</p>
      <p>
        <Link to="/admin/complaints">All complaints</Link> ·{' '}
        <Link to="/admin/settings">Settings</Link> ·{' '}
        <Link to="/notices">Notice board</Link> ·{' '}
        <Link to="/admin/notices/new">Post a notice</Link>
      </p>

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

      <button onClick={handleLogout}>Log out</button>
    </div>
  );
}

export default AdminDashboard;
