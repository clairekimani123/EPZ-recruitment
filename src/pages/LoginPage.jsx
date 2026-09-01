import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveToken } from '../lib/auth.js';
import { API_URL } from '../lib/api.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed.'); return; }
      saveToken(data.token);
      navigate('/admin');
    } catch (err) {
      setError('Could not reach the server. Is it running?');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-center">
      <form className="card narrow" onSubmit={handleSubmit}>
        <h1 style={{ marginTop: 0 }}>Staff login</h1>
        {error && <div className="banner-error">{error}</div>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="button" style={{ width: '100%' }} disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </main>
  );
}