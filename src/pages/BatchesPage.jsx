import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.js';
import AdminNav from '../components/AdminNav.jsx';

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ companyId: '', role: '', quantityNeeded: '', ageMin: 18, ageMax: 30 });
  const [error, setError] = useState(null);

  async function loadData() {
    setLoading(true);
    const [batchesRes, companiesRes] = await Promise.all([
      apiFetch('/api/batches'),
      apiFetch('/api/companies'),
    ]);
    const batchesData = await batchesRes.json();
    const companiesData = await companiesRes.json();
    setBatches(batchesData.batches || []);
    setCompanies(companiesData.companies || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.companyId || !form.role.trim() || !form.quantityNeeded) {
      setError('Company, role, and quantity are all required.');
      return;
    }

    const res = await apiFetch('/api/batches', {
      method: 'POST',
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to create batch.');
      return;
    }

    setForm({ companyId: '', role: '', quantityNeeded: '', ageMin: 18, ageMax: 30 });
    loadData();
  }

  return (
    <main className="admin-wrap">
      <AdminNav />
      <h1>Batches</h1>
      <p style={{ color: '#666', marginTop: -8 }}>
        Each batch is one specific hiring request from a company.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 480, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Create a batch</h3>
        {error && <div className="banner-error">{error}</div>}

        <div className="field">
          <label>Company</label>
          <select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
            <option value="">Select a company…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {companies.length === 0 && (
            <p style={{ fontSize: 12, color: '#888' }}>Add a company first on the Companies page.</p>
          )}
        </div>

        <div className="field">
          <label>Role</label>
          <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Tailoring Trainee" />
        </div>

        <div className="field">
          <label>Number needed</label>
          <input type="number" min="1" value={form.quantityNeeded} onChange={(e) => setForm({ ...form, quantityNeeded: e.target.value })} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Min age</label>
            <input type="number" value={form.ageMin} onChange={(e) => setForm({ ...form, ageMin: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Max age</label>
            <input type="number" value={form.ageMax} onChange={(e) => setForm({ ...form, ageMax: e.target.value })} />
          </div>
        </div>

        <button type="submit" className="button">Create batch</button>
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table>
          <thead>
            <tr><th>Company</th><th>Role</th><th>Progress</th><th>Ages</th><th>Status</th></tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id}>
                <td>{b.company_name}</td>
                <td>{b.role}</td>
                <td>{b.filled_count} of {b.quantity_needed}</td>
                <td>{b.age_min}–{b.age_max}</td>
                <td><span className="badge">{b.status}</span></td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>No batches yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}
