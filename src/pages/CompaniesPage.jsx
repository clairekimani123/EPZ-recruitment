import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.js';
import AdminNav from '../components/AdminNav.jsx';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', contactPerson: '', contactPhone: '' });
  const [error, setError] = useState(null);

  async function loadCompanies() {
    setLoading(true);
    const res = await apiFetch('/api/companies');
    const data = await res.json();
    setCompanies(data.companies || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Company name is required.');
      return;
    }

    const res = await apiFetch('/api/companies', {
      method: 'POST',
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to add company.');
      return;
    }

    setForm({ name: '', contactPerson: '', contactPhone: '' });
    loadCompanies(); // refresh the list to include the new one
  }

  return (
    <main className="admin-wrap">
      <AdminNav />
      <h1>Companies</h1>

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 480, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Add a company</h3>
        {error && <div className="banner-error">{error}</div>}
        <div className="field">
          <label>Company name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Contact person (optional)</label>
          <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
        </div>
        <div className="field">
          <label>Contact phone (optional)</label>
          <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
        </div>
        <button type="submit" className="button">Add company</button>
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table>
          <thead>
            <tr><th>Name</th><th>Contact person</th><th>Contact phone</th></tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.contact_person || '—'}</td>
                <td>{c.contact_phone || '—'}</td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>No companies yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}
