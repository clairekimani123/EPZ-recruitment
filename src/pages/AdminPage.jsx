import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, clearToken } from '../lib/auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const STATUS_LABELS = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  contract_signed: 'Contract signed',
  in_training: 'In training',
  employed: 'Employed',
  rejected: 'Rejected',
};

export default function AdminPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/applicants`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((res) => {
        if (res.status === 401) {
          clearToken();
          navigate('/login');
          throw new Error('Session expired.');
        }
        if (!res.ok) throw new Error('Failed to fetch applicants');
        return res.json();
      })
      .then((data) => setApplicants(data.applicants))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  function handleLogout() {
    clearToken();
    navigate('/login');
  }

  if (loading) return <main className="admin-wrap">Loading…</main>;
  if (error) return <main className="admin-wrap"><div className="banner-error">{error}</div></main>;

  return (
    <main className="admin-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>Applicants</h1>
          <p style={{ color: '#666', marginTop: 4 }}>{applicants.length} total</p>
        </div>
        <button className="button" onClick={handleLogout}>Log out</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Ref #</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Age</th>
            <th>Experience</th>
            <th>Status</th>
            <th>Applied</th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((a) => (
            <tr key={a.id}>
              <td style={{ fontFamily: 'monospace' }}>#{a.id}</td>
              <td>{a.full_name}</td>
              <td>{a.phone_number}</td>
              <td>{a.age}</td>
              <td>{a.has_experience ? 'Yes' : 'No'}</td>
              <td><span className="badge">{STATUS_LABELS[a.status] ?? a.status}</span></td>
              <td style={{ color: '#888' }}>{new Date(a.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {applicants.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>
                No applications yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}