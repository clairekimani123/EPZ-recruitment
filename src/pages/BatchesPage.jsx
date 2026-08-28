import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.js';
import AdminNav from '../components/AdminNav.jsx';
import Modal from '../components/Modal.jsx';

const initialForm = { companyId: '', role: '', quantityNeeded: '', ageMin: 18, ageMax: 30, applicationType: 'job', feeAmount: '' };

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
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

  function openModal() {
    setForm(initialForm);
    setError(null);
    setIsModalOpen(true);
  }

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

    setIsModalOpen(false);
    loadData();
  }

  return (
    <main className="admin-wrap">
      <AdminNav />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>Batches</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
            Each batch is one specific hiring request from a company.
          </p>
        </div>
        <button className="button" onClick={openModal}>+ Create batch</button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table>
          <thead>
            <tr><th>Type</th><th>Company</th><th>Role</th><th>Fee</th><th>Progress</th><th>Ages</th><th>Status</th></tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id}>
                <td><span className="badge">{b.application_type}</span></td>
                <td>{b.company_name}</td>
                <td>{b.role}</td>
                <td>{Number(b.fee_amount) > 0 ? `KES ${Number(b.fee_amount).toLocaleString()}` : '—'}</td>
                <td>{b.filled_count} of {b.quantity_needed}</td>
                <td>{b.age_min}–{b.age_max}</td>
                <td><span className="badge">{b.status}</span></td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>No batches yet.</td></tr>
            )}
          </tbody>
        </table>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a batch">
        <form onSubmit={handleSubmit}>
          {error && <div className="banner-error">{error}</div>}

          <div className="field">
            <label>Application type</label>
            <select value={form.applicationType} onChange={(e) => setForm({ ...form, applicationType: e.target.value })}>
              <option value="trainee">Trainee (training at Straightex)</option>
              <option value="job">Job (hiring company)</option>
            </select>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              Trainee batches should always use the Straightex company. Job batches
              are for whichever company is hiring right now.
            </p>
          </div>

          <div className="field">
            <label>Company</label>
            <select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
              <option value="">Select a company…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {companies.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Add a company first on the Companies page.</p>
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

          <div className="field">
            <label>Training/registration fee (KES)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.feeAmount}
              onChange={(e) => setForm({ ...form, feeAmount: e.target.value })}
              placeholder="0 for no fee"
            />
          </div>

          <button type="submit" className="button" style={{ width: '100%' }}>Create batch</button>
        </form>
      </Modal>
    </main>
  );
}