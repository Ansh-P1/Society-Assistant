import { useCallback, useEffect, useState } from 'react';
import { getAdminComplaints, updateComplaintPriority } from '../api/client';
import { getAuth } from '../utils/auth';
import { CATEGORIES } from '../constants/categories';
import { STATUSES, PRIORITIES } from '../constants/statuses';

function statusClass(status) {
  return `status status-${status.replace(/\s+/g, '-').toLowerCase()}`;
}

function AdminComplaints() {
  const auth = getAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', date_from: '', date_to: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminComplaints(filters, auth?.token);
      setComplaints(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, auth?.token]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  async function handlePriorityChange(id, priority) {
    const previous = complaints;
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, priority } : c)));
    try {
      await updateComplaintPriority(id, priority, auth?.token);
    } catch (err) {
      setComplaints(previous);
      setError(err.message);
    }
  }

  return (
    <div className="admin-page">
      <h1>All complaints</h1>

      <div className="filters">
        <label>
          Status
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All</option>
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select name="category" value={filters.category} onChange={handleFilterChange}>
            <option value="">All</option>
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          From
          <input type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} />
        </label>
        <label>
          To
          <input type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} />
        </label>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && complaints.length === 0 && <p>No complaints match these filters.</p>}

      {!loading && complaints.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Resident</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Raised</th>
              <th>Overdue</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => (
              <tr key={complaint.id} className={complaint.is_overdue ? 'overdue-row' : ''}>
                <td>{complaint.category}</td>
                <td>{complaint.resident_name}</td>
                <td>
                  <span className={statusClass(complaint.status)}>{complaint.status}</span>
                </td>
                <td>
                  <select
                    value={complaint.priority}
                    onChange={(e) => handlePriorityChange(complaint.id, e.target.value)}
                  >
                    {PRIORITIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{new Date(complaint.created_at).toLocaleDateString()}</td>
                <td>{complaint.is_overdue ? 'Overdue' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminComplaints;
