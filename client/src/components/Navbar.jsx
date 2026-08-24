import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, LayoutDashboard, ClipboardList, Megaphone, Settings, LogOut,
} from 'lucide-react';
import { getAuth, clearAuth } from '../utils/auth';

const RESIDENT_LINKS = [
  { to: '/resident', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/complaints', label: 'My Complaints', icon: ClipboardList },
  { to: '/notices', label: 'Notice Board', icon: Megaphone },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/complaints', label: 'Complaints', icon: ClipboardList },
  { to: '/notices', label: 'Notices', icon: Megaphone },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
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
            <Building2 size={22} strokeWidth={2.4} />
          </span>
          Society Tracker
        </Link>

        <nav className="navbar-links" aria-label="Main">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === homeLink}
                className={({ isActive }) => `navbar-link${isActive ? ' navbar-link-active' : ''}`}
              >
                <Icon size={16} strokeWidth={2.4} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="navbar-user">
          <span className="navbar-user-name">{auth?.user?.name}</span>
          <motion.button
            type="button"
            className="navbar-logout"
            onClick={handleLogout}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <LogOut size={15} strokeWidth={2.4} />
            Log out
          </motion.button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
