import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.js';
import AdminNav from '../components/AdminNav.jsx';
import Modal from '../components/Modal.jsx';

const initialForm = { name: '', contactPerson: '', contactPhone: '' };

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
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

  function openModal() {
    setForm(initialForm);
    setError(null);
    setIsModalOpen(true);
  }

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

    setIsModalOpen(false);
    loadCompanies(); // refresh the list to include the new one
  }

  return (
    <main className="admin-wrap">
      <AdminNav />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>Companies</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>{companies.length} total</p>
        </div>
        <button className="button" onClick={openModal}>+ Add company</button>
      </div>

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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add a company">
        <form onSubmit={handleSubmit}>
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
          <button type="submit" className="button" style={{ width: '100%' }}>Add company</button>
        </form>
      </Modal>
    </main>
  );
}