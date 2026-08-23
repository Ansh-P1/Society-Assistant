import { Navigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';

function ProtectedRoute({ role, children }) {
  const auth = getAuth();

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  if (role && auth.user.role !== role) {
    return <Navigate to={auth.user.role === 'admin' ? '/admin' : '/resident'} replace />;
  }

  return children;
}

export default ProtectedRoute;
