import { useState } from 'react';
import { createNotice } from '../api/client';
import { getAuth } from '../utils/auth';
import Navbar from '../components/Navbar';

const MAX_TITLE_LENGTH = 255;
const MAX_BODY_LENGTH = 2000;

function AdminPostNotice() {
  const auth = getAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);
    try {
      await createNotice({ title, body, isImportant }, auth?.token);
      setTitle('');
      setBody('');
      setIsImportant(false);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-content form-page">
        <h1>Post a notice</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              required
            />
          </label>
          <label>
            Body
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={MAX_BODY_LENGTH}
              rows={5}
              required
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
            />
            Mark as important (pins to top of notice board)
          </label>
          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">Notice posted.</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post notice'}
          </button>
        </form>
      </div>
    </>
  );
}

export default AdminPostNotice;
