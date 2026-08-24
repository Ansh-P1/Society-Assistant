import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getComplaint, API_URL } from '../api/client';
import { getAuth } from '../utils/auth';
import StatusTimeline from '../components/StatusTimeline';
import Navbar from '../components/Navbar';

function statusClass(status) {
  return `status status-${status.replace(/\s+/g, '-').toLowerCase()}`;
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
    <>
      <Navbar />
      <div className="page-content detail-page">
        <p>
          <Link to="/complaints">← Back to my complaints</Link>
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
            <StatusTimeline history={history} />
          </>
        )}
      </div>
    </>
  );
}

export default ComplaintDetail;
