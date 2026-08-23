import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getComplaint, updateComplaintStatus, API_URL } from '../api/client';
import { getAuth } from '../utils/auth';
import StatusTimeline from '../components/StatusTimeline';
import { VALID_STATUS_TRANSITIONS } from '../constants/statuses';

function statusClass(status) {
  return `status status-${status.replace(/\s+/g, '-').toLowerCase()}`;
}

function AdminComplaintDetail() {
  const { id } = useParams();
  const auth = getAuth();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [toStatus, setToStatus] = useState('');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getComplaint(id, auth?.token);
      setComplaint(data.complaint);
      setHistory(data.history);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, auth?.token]);

  useEffect(() => {
    load();
  }, [load]);

  // Default the "new status" dropdown to the first valid next status
  // whenever the complaint's current status changes (e.g. after an update).
  useEffect(() => {
    const options = complaint ? VALID_STATUS_TRANSITIONS[complaint.status] : [];
    if (options.length > 0) {
      setToStatus(options[0]);
    }
  }, [complaint]);

  async function handleUpdateStatus(e) {
    e.preventDefault();
    setUpdating(true);
    setUpdateError('');
    setUpdateSuccess(false);
    try {
      await updateComplaintStatus(id, toStatus, note, auth?.token);
      setNote('');
      setUpdateSuccess(true);
      await load();
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  const nextOptions = complaint ? VALID_STATUS_TRANSITIONS[complaint.status] : [];

  return (
    <div className="detail-page">
      <p>
        <Link to="/admin/complaints">Back to all complaints</Link>
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
            {complaint.resident_name}
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

          <h2>Update status</h2>
          {nextOptions.length === 0 ? (
            <p>This complaint is resolved and closed.</p>
          ) : (
            <form className="status-update-form" onSubmit={handleUpdateStatus}>
              <label>
                New status
                <select value={toStatus} onChange={(e) => setToStatus(e.target.value)}>
                  {nextOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Note (optional)
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
              </label>
              {updateError && <p className="form-error">{updateError}</p>}
              {updateSuccess && <p className="form-success">Status updated.</p>}
              <button type="submit" disabled={updating}>
                {updating ? 'Updating…' : 'Update status'}
              </button>
            </form>
          )}

          <h2>Status timeline</h2>
          <StatusTimeline history={history} />
        </>
      )}
    </div>
  );
}

export default AdminComplaintDetail;
