import PropTypes from 'prop-types';

function EmptyState({ icon, title, description = null }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">
        {icon}
      </span>
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-desc">{description}</p>}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
};

export default EmptyState;
