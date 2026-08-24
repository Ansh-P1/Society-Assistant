import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getAuth, clearAuth } from '../utils/auth';

const RESIDENT_LINKS = [
  { to: '/resident', label: 'Dashboard' },
  { to: '/complaints', label: 'My Complaints' },
  { to: '/notices', label: 'Notice Board' },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/complaints', label: 'Complaints' },
  { to: '/notices', label: 'Notices' },
  { to: '/admin/settings', label: 'Settings' },
];

function Navbar() {
  const navigate = useNavigate();
  const auth = getAuth();
  const isAdmin = auth?.user?.role === 'admin';
  const links = isAdmin ? ADMIN_LINKS : RESIDENT_LINKS;
  const homeLink = isAdmin ? '/admin' : '/resident';

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to={homeLink} className="navbar-brand">
          <span className="navbar-brand-icon" aria-hidden="true">
            🏢
          </span>
          Society Tracker
        </Link>

        <nav className="navbar-links" aria-label="Main">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === homeLink}
              className={({ isActive }) => `navbar-link${isActive ? ' navbar-link-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-user">
          <span className="navbar-user-name">{auth?.user?.name}</span>
          <button type="button" className="navbar-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
