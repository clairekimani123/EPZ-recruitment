import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.js';
import AdminNav from '../components/AdminNav.jsx';

const emptyForm = { name: '', contactPerson: '', contactPhone: '' };

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function loadCompanies() {
    setLoading(true);
    const res = await apiFetch('/api/companies');
    const data = await res.json();
    setCompanies(data.companies || []);
    setLoading(false);
  }

  useEffect(() => { loadCompanies(); }, []);

  function openCreateModal() {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setIsModalOpen(true);
  }

  function startEdit(company) {
    setEditingId(company.id);
    setForm({ name: company.name, contactPerson: company.contact_person || '', contactPhone: company.contact_phone || '' });
    setError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
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

    closeModal();
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
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>Companies</h1>
        </div>
        <button className="button" onClick={openCreateModal}>+ Add Company</button>
      </div>

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

      {/* MODAL OVERLAY */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          zIndex: 1000, padding: 20
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, margin: 0 }}>
            <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit company' : 'Add a company'}</h3>
            {error && <div className="banner-error">{error}</div>}
            
            <form onSubmit={handleSubmit}>
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
              
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="submit" className="button" style={{ flex: 1 }}>{editingId ? 'Save changes' : 'Add company'}</button>
                <button type="button" className="button button-secondary" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}