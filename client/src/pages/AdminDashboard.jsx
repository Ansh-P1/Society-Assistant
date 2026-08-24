import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react';
import { getAuth } from '../utils/auth';
import { getAdminDashboard } from '../api/client';
import Navbar from '../components/Navbar';
import PageBanner from '../components/PageBanner';

function StatCard({
  value, label, overdue = false, delay = 0,
}) {
  return (
    <motion.div
      className={`stat-card${overdue ? ' stat-card-overdue' : ''}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </motion.div>
  );
}

StatCard.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  overdue: PropTypes.bool,
  delay: PropTypes.number,
};

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
      <PageBanner
        icon={<LayoutDashboard size={26} strokeWidth={2.2} />}
        title={`Welcome back, ${auth?.user?.name ?? ''}`}
        subtitle="Here's how things are looking across the building."
      />
      <div className="page-content admin-page">
        {loading && <p>Loading…</p>}
        {error && <p className="form-error">{error}</p>}

        {stats && (
          <div className="dashboard-stats">
            <div className="stat-cards">
              <StatCard value={stats.overdue_count} label="Overdue" overdue delay={0} />
            </div>

            <div className="stat-group">
              <h2>By status</h2>
              <div className="stat-cards">
                {Object.entries(stats.by_status).map(([status, count], index) => (
                  <StatCard key={status} value={count} label={status} delay={0.05 + index * 0.05} />
                ))}
              </div>
            </div>

            <div className="stat-group">
              <h2>By category</h2>
              <div className="stat-cards">
                {Object.entries(stats.by_category).map(([category, count], index) => (
                  <StatCard key={category} value={count} label={category} delay={0.2 + index * 0.04} />
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
