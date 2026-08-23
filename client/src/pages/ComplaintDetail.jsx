import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getComplaint, API_URL } from '../api/client';
import { getAuth } from '../utils/auth';

function statusClass(status) {
  return `status status-${status.replace(/\s+/g, '-').toLowerCase()}`;
}

function describeChange(entry) {
  return entry.from_status ? `${entry.from_status} → ${entry.to_status}` : `Raised as ${entry.to_status}`;
}

function ComplaintDetail() {
  const { id } = useParams();
  const auth = getAuth();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getComplaint(id, auth?.token);
        if (!cancelled) {
          setComplaint(data.complaint);
          setHistory(data.history);
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
  }, [id, auth?.token]);

  return (
    <div className="detail-page">
      <p>
        <Link to="/complaints">Back to my complaints</Link>
      </p>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {complaint && (
        <>
          <h1>{complaint.category}</h1>
          <p className="complaint-meta">
            <span className={statusClass(complaint.status)}>{complaint.status}</span>
            {' · '}
            {complaint.priority} priority
            {' · '}
            Raised {new Date(complaint.created_at).toLocaleString()}
          </p>
          <p>{complaint.description}</p>
          {complaint.photo_url && (
            <img
              src={`${API_URL}${complaint.photo_url}`}
              alt="Complaint"
              className="complaint-photo"
            />
          )}

          <h2>Status timeline</h2>
          <ul className="timeline">
            {history.map((entry) => (
              <li key={entry.id}>
                <span className="timeline-date">{new Date(entry.changed_at).toLocaleString()}</span>
                <span className="timeline-change">{describeChange(entry)}</span>
                {entry.actor_name && <span className="timeline-actor">by {entry.actor_name}</span>}
                {entry.note && <p className="timeline-note">{entry.note}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default ComplaintDetail;
