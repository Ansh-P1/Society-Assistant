import { useNavigate } from 'react-router-dom';
import { getAuth, clearAuth } from '../utils/auth';

function ResidentDashboard() {
  const navigate = useNavigate();
  const auth = getAuth();

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <div>
      <h1>Resident dashboard</h1>
      <p>Welcome, {auth?.user?.name}.</p>
      <p>Complaint raising and tracking are coming in a future update.</p>
      <button onClick={handleLogout}>Log out</button>
    </div>
  );
}

export default ResidentDashboard;
