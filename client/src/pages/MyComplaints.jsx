import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyComplaints } from '../api/client';
import { getAuth } from '../utils/auth';

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
    <div className="list-page">
      <h1>My complaints</h1>
      <p>
        <Link to="/resident">Back to dashboard</Link> ·{' '}
        <Link to="/complaints/new">Raise a complaint</Link>
      </p>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && complaints.length === 0 && (
        <p>You haven&apos;t raised any complaints yet.</p>
      )}

      {!loading && complaints.length > 0 && (
        <ul className="complaint-list">
          {complaints.map((complaint) => (
            <li key={complaint.id}>
              <Link to={`/complaints/${complaint.id}`}>
                <span className="complaint-category">{complaint.category}</span>
                <span className={statusClass(complaint.status)}>{complaint.status}</span>
                <span className="complaint-priority">{complaint.priority} priority</span>
                <span className="complaint-date">
                  {new Date(complaint.created_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyComplaints;
