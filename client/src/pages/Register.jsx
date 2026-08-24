import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/client';
import { saveAuth } from '../utils/auth';

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await register({ name, email, password });
      saveAuth(data);
      navigate('/resident');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-hero">
        <div className="auth-hero-copy">
          <span className="auth-hero-icon" aria-hidden="true">
            🏢
          </span>
          <h2>Society Maintenance Tracker</h2>
          <p>Raise it, track it, get it fixed — one place for your whole building.</p>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-panel-inner">
          <h1>Register</h1>
          <p className="hint">Resident accounts only — admin accounts are set up separately.</p>
          <form onSubmit={handleSubmit}>
            <label>
              Name
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Register'}
            </button>
          </form>
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
