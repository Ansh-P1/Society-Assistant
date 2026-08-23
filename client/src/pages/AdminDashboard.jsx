import { useNavigate, Link } from 'react-router-dom';
import { getAuth, clearAuth } from '../utils/auth';

function AdminDashboard() {
  const navigate = useNavigate();
  const auth = getAuth();

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <div>
      <h1>Admin dashboard</h1>
      <p>Welcome, {auth?.user?.name}.</p>
      <p>
        <Link to="/admin/complaints">All complaints</Link> ·{' '}
        <Link to="/admin/settings">Settings</Link> ·{' '}
        <Link to="/notices">Notice board</Link> ·{' '}
        <Link to="/admin/notices/new">Post a notice</Link>
      </p>
      <p>Reporting is coming in a future update.</p>
      <button onClick={handleLogout}>Log out</button>
    </div>
  );
}

export default AdminDashboard;
