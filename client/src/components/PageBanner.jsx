import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

function PageBanner({ icon, title, subtitle = null }) {
  return (
    <div className="page-banner">
      <motion.div
        className="page-banner-content"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <span className="page-banner-icon" aria-hidden="true">
          {icon}
        </span>
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </motion.div>
    </div>
  );
}

PageBanner.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
};

export default PageBanner;
