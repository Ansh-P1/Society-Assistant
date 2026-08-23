import PropTypes from 'prop-types';

function describeChange(entry) {
  return entry.from_status ? `${entry.from_status} → ${entry.to_status}` : `Raised as ${entry.to_status}`;
}

function StatusTimeline({ history }) {
  return (
    <ul className="timeline">
      {history.map((entry) => (
        <li key={entry.id}>
          <span className="timeline-date">{new Date(entry.changed_at).toLocaleString()}</span>
          <span className="timeline-change">{describeChange(entry)}</span>
          {entry.actor_name && <span className="timeline-actor">by {entry.actor_name}</span>}
          {entry.note && <p className="timeline-note">{entry.note}</p>}
        </li>
      ))}
    </ul>
  );
}

StatusTimeline.propTypes = {
  history: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      from_status: PropTypes.string,
      to_status: PropTypes.string.isRequired,
      actor_name: PropTypes.string,
      note: PropTypes.string,
      changed_at: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default StatusTimeline;
