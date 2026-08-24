import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList, Plus, CircleDot, Clock, CheckCircle2, Inbox,
} from 'lucide-react';
import { getMyComplaints } from '../api/client';
import { getAuth } from '../utils/auth';
import Navbar from '../components/Navbar';
import PageBanner from '../components/PageBanner';
import EmptyState from '../components/EmptyState';

const STATUS_ICONS = {
  Open: CircleDot,
  'In Progress': Clock,
  Resolved: CheckCircle2,
};

function statusClass(status) {
  return `status status-${status.replace(/\s+/g, '-').toLowerCase()}`;
}

function MyComplaints() {
  const auth = getAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getMyComplaints(auth?.token);
        if (!cancelled) {
          setComplaints(data.data);
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
        icon={<ClipboardList size={26} strokeWidth={2.2} />}
        title="My complaints"
        subtitle="Everything you've raised, and where it stands."
      />
      <div className="page-content list-page">
        <div className="section-header">
          <Link to="/complaints/new" className="btn-primary-link">
            <Plus size={16} strokeWidth={2.5} />
            Raise a complaint
          </Link>
        </div>

        {loading && <p>Loading…</p>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && complaints.length === 0 && (
          <EmptyState
            icon={<Inbox size={26} strokeWidth={2} />}
            title="You haven't raised any complaints yet"
            description="When something needs fixing, raise a complaint and track it right here."
          />
        )}

        {!loading && complaints.length > 0 && (
          <ul className="complaint-list">
            {complaints.map((complaint, index) => {
              const StatusIcon = STATUS_ICONS[complaint.status] ?? CircleDot;
              return (
                <motion.li
                  key={complaint.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link to={`/complaints/${complaint.id}`}>
                    <span className="complaint-category">{complaint.category}</span>
                    <span className={statusClass(complaint.status)}>
                      <StatusIcon size={12} strokeWidth={3} />
                      {complaint.status}
                    </span>
                    <span className="complaint-priority">{complaint.priority} priority</span>
                    <span className="complaint-date">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

export default MyComplaints;
