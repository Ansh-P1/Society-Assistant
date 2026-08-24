import { Link } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import Navbar from '../components/Navbar';

function ResidentDashboard() {
  const auth = getAuth();

  return (
    <>
      <Navbar />
      <div className="page-content">
        <h1>Welcome back, {auth?.user?.name}</h1>
        <p className="hint">Here&apos;s what you can do from your dashboard.</p>

        <div className="quick-links">
          <Link to="/complaints/new" className="quick-link-card">
            <span className="quick-link-icon" aria-hidden="true">
              📝
            </span>
            <span className="quick-link-title">Raise a complaint</span>
            <span className="quick-link-desc">Report a maintenance issue with photos.</span>
          </Link>
          <Link to="/complaints" className="quick-link-card">
            <span className="quick-link-icon" aria-hidden="true">
              📋
            </span>
            <span className="quick-link-title">My complaints</span>
            <span className="quick-link-desc">Track status and full history.</span>
          </Link>
          <Link to="/notices" className="quick-link-card">
            <span className="quick-link-icon" aria-hidden="true">
              📣
            </span>
            <span className="quick-link-title">Notice board</span>
            <span className="quick-link-desc">See announcements from your admin.</span>
          </Link>
        </div>
      </div>
    </>
  );
}

export default ResidentDashboard;
