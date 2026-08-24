import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, FilePlus2, ClipboardList, Megaphone } from 'lucide-react';
import { getAuth } from '../utils/auth';
import Navbar from '../components/Navbar';
import PageBanner from '../components/PageBanner';

const QUICK_LINKS = [
  {
    to: '/complaints/new',
    icon: FilePlus2,
    title: 'Raise a complaint',
    desc: 'Report a maintenance issue with photos.',
  },
  {
    to: '/complaints',
    icon: ClipboardList,
    title: 'My complaints',
    desc: 'Track status and full history.',
  },
  {
    to: '/notices',
    icon: Megaphone,
    title: 'Notice board',
    desc: 'See announcements from your admin.',
  },
];

function ResidentDashboard() {
  const auth = getAuth();

  return (
    <>
      <Navbar />
      <PageBanner
        icon={<LayoutDashboard size={26} strokeWidth={2.2} />}
        title={`Welcome back, ${auth?.user?.name ?? ''}`}
        subtitle="Here's what you can do from your dashboard."
      />
      <div className="page-content">
        <div className="quick-links">
          {QUICK_LINKS.map(({ to, icon: Icon, title, desc }, index) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.07 }}
              whileHover={{ y: -4 }}
            >
              <Link to={to} className="quick-link-card">
                <span className="quick-link-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={2.2} />
                </span>
                <span className="quick-link-title">{title}</span>
                <span className="quick-link-desc">{desc}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}

export default ResidentDashboard;
