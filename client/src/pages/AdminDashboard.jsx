import { useNavigate } from 'react-router-dom';
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
      <p>Complaint management and reporting are coming in a future update.</p>
      <button onClick={handleLogout}>Log out</button>
    </div>
  );
}

export default AdminDashboard;
