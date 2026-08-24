import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNotices } from '../api/client';
import { getAuth } from '../utils/auth';
import Navbar from '../components/Navbar';

function NoticeBoard() {
  const auth = getAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getNotices(auth?.token);
        if (!cancelled) {
          setNotices(data.data);
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

  const isAdmin = auth?.user?.role === 'admin';

  return (
    <>
      <Navbar />
      <div className="page-content list-page">
        <h1>Notice board</h1>
        {isAdmin && (
          <p>
            <Link to="/admin/notices/new">Post a notice</Link>
          </p>
        )}

        {loading && <p>Loading…</p>}
        {error && <p className="form-error">{error}</p>}
        {!loading && !error && notices.length === 0 && <p>No notices yet.</p>}

        {!loading && notices.length > 0 && (
          <ul className="notice-list">
            {notices.map((notice) => (
              <li key={notice.id} className={notice.is_important ? 'notice-important' : ''}>
                {notice.is_important && <span className="notice-badge">Important</span>}
                <h2>{notice.title}</h2>
                <p className="notice-meta">
                  Posted by {notice.posted_by_name} · {new Date(notice.posted_at).toLocaleString()}
                </p>
                <p className="notice-body">{notice.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default NoticeBoard;
