import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createComplaint } from '../api/client';
import { getAuth } from '../utils/auth';
import { CATEGORIES } from '../constants/categories';

const MAX_DESCRIPTION_LENGTH = 2000;

function NewComplaint() {
  const auth = getAuth();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);

    try {
      await createComplaint({ category, description, photo }, auth?.token);
      setSuccess(true);
      setDescription('');
      setPhoto(null);
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-page">
      <h1>Raise a complaint</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={5}
            required
          />
        </label>
        <label>
          Photo (optional)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPhoto(e.target.files[0] || null)}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">Complaint raised successfully.</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit complaint'}
        </button>
      </form>
      <p>
        <Link to="/resident">Back to dashboard</Link>
      </p>
    </div>
  );
}

export default NewComplaint;
