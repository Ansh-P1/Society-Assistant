import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Megaphone, Plus, Star, User, ScrollText,
} from 'lucide-react';
import { getNotices } from '../api/client';
import { getAuth } from '../utils/auth';
import Navbar from '../components/Navbar';
import PageBanner from '../components/PageBanner';
import EmptyState from '../components/EmptyState';

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
      <PageBanner
        icon={<Megaphone size={26} strokeWidth={2.2} />}
        title="Notice board"
        subtitle="Announcements from your building admin, important ones pinned to the top."
      />
      <div className="page-content list-page">
        {isAdmin && (
          <div className="section-header">
            <Link to="/admin/notices/new" className="btn-primary-link">
              <Plus size={16} strokeWidth={2.5} />
              Post a notice
            </Link>
          </div>
        )}

        {loading && <p>Loading…</p>}
        {error && <p className="form-error">{error}</p>}
        {!loading && !error && notices.length === 0 && (
          <EmptyState
            icon={<ScrollText size={26} strokeWidth={2} />}
            title="No notices yet"
            description={isAdmin ? 'Post one to keep residents in the loop.' : "Check back later — your admin hasn't posted anything yet."}
          />
        )}

        {!loading && notices.length > 0 && (
          <ul className="notice-list">
            {notices.map((notice, index) => (
              <motion.li
                key={notice.id}
                className={notice.is_important ? 'notice-important' : ''}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                {notice.is_important && (
                  <span className="notice-badge">
                    <Star size={12} strokeWidth={2.5} />
                    Important
                  </span>
                )}
                <h2>{notice.title}</h2>
                <p className="notice-meta">
                  <User size={13} strokeWidth={2.5} />
                  {notice.posted_by_name}
                  <span aria-hidden="true">·</span>
                  {new Date(notice.posted_at).toLocaleString()}
                </p>
                <p className="notice-body">{notice.body}</p>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default NoticeBoard;
