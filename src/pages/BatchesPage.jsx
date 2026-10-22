import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.js';
import { Link } from 'react-router-dom';
import AdminNav from '../components/AdminNav.jsx';

const initialForm = { companyId: '', role: '', quantityNeeded: '', ageMin: 18, ageMax: 30, applicationType: 'job', feeAmount: '' };

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    const [batchesRes, companiesRes] = await Promise.all([apiFetch('/api/batches'), apiFetch('/api/companies')]);
    const batchesData = await batchesRes.json();
    const companiesData = await companiesRes.json();
    setBatches(batchesData.batches || []);
    setCompanies(companiesData.companies || []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function openCreateModal() {
    setForm(initialForm);
    setEditingId(null);
    setError(null);
    setIsModalOpen(true);
  }

  function startEdit(batch) {
    setEditingId(batch.id);
    setForm({
      companyId: batch.company_id,
      role: batch.role,
      quantityNeeded: batch.quantity_needed,
      ageMin: batch.age_min,
      ageMax: batch.age_max,
      applicationType: batch.application_type,
      feeAmount: batch.fee_amount,
    });
    setError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.companyId || !form.role.trim() || !form.quantityNeeded) {
      setError('Company, role, and quantity are all required.');
      return;
    }

    const res = editingId
      ? await apiFetch(`/api/batches/${editingId}`, { method: 'PATCH', body: JSON.stringify(form) })
      : await apiFetch('/api/batches', { method: 'POST', body: JSON.stringify(form) });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || `Failed to ${editingId ? 'update' : 'create'} batch.`);
      return;
    }
    
    closeModal();
    loadData();
  }

  async function handleStatusChange(batch, newStatus) {
    setUpdatingStatusId(batch.id);
    const res = await apiFetch(`/api/batches/${batch.id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to update status.');
    }
    await loadData();
    setUpdatingStatusId(null);
  }

  async function handleDelete(batch) {
    if (!window.confirm(`Delete the "${batch.role}" batch at ${batch.company_name}? This cannot be undone.`)) return;

    const res = await apiFetch(`/api/batches/${batch.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to delete batch.');
      return;
    }
    loadData();
  }

  return (
    <main className="admin-wrap">
      <AdminNav />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>Batches</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>Each batch is one specific hiring request from a company.</p>
        </div>
        <button className="button" onClick={openCreateModal}>+ Create Batch</button>
      </div>

      {loading ? <p>Loading…</p> : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Type</th><th>Company</th><th>Role</th><th>Fee</th><th>Progress</th><th>Ages</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <td><span className="badge">{b.application_type}</span></td>
                  <Link to={`/admin/batches/${b.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: 500 }}>
                    {b.company_name}
                  </Link>
                  <td>{b.role}</td>
                  <td>{Number(b.fee_amount) > 0 ? `KES ${Number(b.fee_amount).toLocaleString()}` : '—'}</td>
                  <td>{b.filled_count} of {b.quantity_needed}</td>
                  <td>{b.age_min}–{b.age_max}</td>
                  <td>
                    <select
                      value={b.status}
                      disabled={updatingStatusId === b.id}
                      onChange={(e) => handleStatusChange(b, e.target.value)}
                      style={{ fontSize: 12, padding: '3px 6px' }}
                    >
                      <option value="open">open</option>
                      <option value="filled">filled</option>
                      <option value="closed">closed</option>
                    </select>
                  </td>
                  <td>
                    <button className="button button-secondary" style={{ fontSize: 12, padding: '4px 10px', marginRight: 6 }} onClick={() => startEdit(b)}>Edit</button>
                    <button className="button button-secondary" style={{ fontSize: 12, padding: '4px 10px', color: '#991b1b' }} onClick={() => handleDelete(b)}>Delete</button>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>No batches yet.</td></tr>
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
          <div className="card" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', margin: 0 }}>
            <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit batch' : 'Create a batch'}</h3>
            {error && <div className="banner-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Application type</label>
                <select value={form.applicationType} onChange={(e) => setForm({ ...form, applicationType: e.target.value })}>
                  <option value="trainee">Trainee (training at Straightex)</option>
                  <option value="job">Job (hiring company)</option>
                </select>
              </div>

              <div className="field">
                <label>Company</label>
                <select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
                  <option value="">Select a company…</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {companies.length === 0 && <p style={{ fontSize: 12, color: '#888' }}>Add a company first on the Companies page.</p>}
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
                <input type="number" min="0" step="1" value={form.feeAmount} onChange={(e) => setForm({ ...form, feeAmount: e.target.value })} placeholder="0 for no fee" />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="submit" className="button" style={{ flex: 1 }}>{editingId ? 'Save changes' : 'Create batch'}</button>
                <button type="button" className="button button-secondary" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}