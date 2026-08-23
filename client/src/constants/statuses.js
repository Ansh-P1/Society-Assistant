// Keep in sync with server/src/constants/statuses.js and the
// VALID_TRANSITIONS map in server/src/controllers/adminComplaintController.js.
export const STATUSES = ['Open', 'In Progress', 'Resolved'];
export const PRIORITIES = ['Low', 'Medium', 'High'];

export const VALID_STATUS_TRANSITIONS = {
  Open: ['In Progress', 'Resolved'],
  'In Progress': ['Resolved'],
  Resolved: [],
};
