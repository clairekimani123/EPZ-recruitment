import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.js';
import AdminNav from '../components/AdminNav.jsx';

const emptyForm = { name: '', contactPerson: '', contactPhone: '' };

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  // Tracks which company is currently being edited - null means the form
  // is in "add new" mode. The SAME form is reused for both, just with
  // different submit behavior (see handleSubmit).
  const [editingId, setEditingId] = useState(null);

  async function loadCompanies() {
    setLoading(true);
    const res = await apiFetch('/api/companies');
    const data = await res.json();
    setCompanies(data.companies || []);
    setLoading(false);
  }

  useEffect(() => { loadCompanies(); }, []);

  function startEdit(company) {
    setEditingId(company.id);
    setForm({ name: company.name, contactPerson: company.contact_person || '', contactPhone: company.contact_phone || '' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) { setError('Company name is required.'); return; }

    const res = editingId
      ? await apiFetch(`/api/companies/${editingId}`, { method: 'PATCH', body: JSON.stringify(form) })
      : await apiFetch('/api/companies', { method: 'POST', body: JSON.stringify(form) });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || `Failed to ${editingId ? 'update' : 'add'} company.`);
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    loadCompanies();
  }

  async function handleDelete(company) {
    if (!window.confirm(`Delete "${company.name}"? This cannot be undone.`)) return;

    const res = await apiFetch(`/api/companies/${company.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to delete company.');
      return;
    }
    loadCompanies();
  }

  return (
    <main className="admin-wrap">
      <AdminNav />
      <h1>Companies</h1>
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 480, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit company' : 'Add a company'}</h3>
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
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="button">{editingId ? 'Save changes' : 'Add company'}</button>
          {editingId && (
            <button type="button" className="button button-secondary" onClick={cancelEdit}>Cancel</button>
          )}
        </div>
      </form>

      {loading ? <p>Loading…</p> : (
        <div className="table-scroll">
          <table>
            <thead><tr><th>Name</th><th>Contact person</th><th>Contact phone</th><th>Actions</th></tr></thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.contact_person || '—'}</td>
                  <td>{c.contact_phone || '—'}</td>
                  <td>
                    <button className="button button-secondary" style={{ fontSize: 12, padding: '4px 10px', marginRight: 6 }} onClick={() => startEdit(c)}>Edit</button>
                    <button className="button button-secondary" style={{ fontSize: 12, padding: '4px 10px', color: '#991b1b' }} onClick={() => handleDelete(c)}>Delete</button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>No companies yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}