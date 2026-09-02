import { useEffect, useState, Fragment } from 'react';
import { Search, RotateCcw, Download } from 'lucide-react';
import { apiFetch } from '../lib/api.js';
import AdminNav from '../components/AdminNav.jsx';

const STATUS_LABELS = {
  applied: 'Applied', shortlisted: 'Shortlisted', contract_signed: 'Contract signed',
  in_training: 'In training', employed: 'Employed', rejected: 'Rejected',
};
const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

const PAYMENT_LABELS = { pending: 'Pending', completed: 'Completed', failed: 'Failed' };
const PAYMENT_OPTIONS = Object.keys(PAYMENT_LABELS);

const JOB_TYPES = ['Single needle', 'Flatlock', 'Overlock', 'Top stitch', 'Machine operator'];
const PAGE_SIZE_OPTIONS = [20, 40, 60, 100];

function getStatusStyle(status) {
  const map = {
    applied: { background: '#e2e8f0', color: '#334155' },
    shortlisted: { background: '#dbeafe', color: '#1e40af' },
    contract_signed: { background: '#ede9fe', color: '#5b21b6' },
    in_training: { background: '#fef3c7', color: '#92400e' },
    employed: { background: '#dcfce7', color: '#166534' },
    rejected: { background: '#fee2e2', color: '#991b1b' },
  };
  return map[status] || map.applied;
}
function getPaymentStyle(paymentStatus) {
  const map = {
    pending: { background: '#fef3c7', color: '#92400e' },
    completed: { background: '#dcfce7', color: '#166534' },
    failed: { background: '#fee2e2', color: '#991b1b' },
  };
  return map[paymentStatus] || map.pending;
}

const initialFilters = { dateFrom: '', dateTo: '', location: '', phone: '', jobType: '' };

// Groups of fields to show when an admin expands the "Full application"
// panel - matches the 5 sections of the admission form 1:1, so what staff
// see mirrors exactly what the applicant filled in.
const DETAIL_SECTIONS = [
  { title: 'Personal Details', fields: [
    ['Gender', 'gender'], ['Email', 'email'], ['Postal address', 'postal_address'],
    ['Current residence', 'current_residence'], ['County', 'county_of_residence'],
    ['Date of birth', 'date_of_birth'], ['Place of birth', 'place_of_birth'],
    ['Religion', 'religion'], ['Nationality', 'nationality'], ['Referring agent', 'referring_agent'],
  ]},
  { title: 'Academic Details', fields: [
    ['Qualification', 'academic_qualification'], ['Institution', 'institution_name'],
    ['Year of completion', 'year_of_completion'], ['Grade', 'grade'],
  ]},
  { title: 'Parent / Guardian', fields: [
    ['Full name', 'guardian_full_name'], ['Relationship', 'guardian_relationship'],
    ['Phone', 'guardian_phone'], ['Residence', 'guardian_residence'], ['Occupation', 'guardian_occupation'],
  ]},
  { title: 'Next of Kin', fields: [
    ['Full name', 'nok_full_name'], ['Relationship', 'nok_relationship'],
    ['ID number', 'nok_id_number'], ['Phone', 'nok_phone'], ['Email', 'nok_email'],
  ]},
  { title: 'Emergency Contact', fields: [
    ['Name', 'emergency_name'], ['Relationship', 'emergency_relationship'],
    ['Phone', 'emergency_phone'], ['Email', 'emergency_email'], ['Residence', 'emergency_residence'],
  ]},
  { title: 'Payer (if not self)', fields: [
    ['Relationship', 'payer_relationship'], ['Name', 'payer_name'], ['Phone', 'payer_phone'],
  ]},
];

export default function AdminPage() {
  const [applicants, setApplicants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [requestingPaymentId, setRequestingPaymentId] = useState(null);

  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [expandedId, setExpandedId] = useState(null);
  const [expandedTab, setExpandedTab] = useState('documents'); // 'documents' | 'details'
  const [documentsByApplicant, setDocumentsByApplicant] = useState({});
  const [detailsByApplicant, setDetailsByApplicant] = useState({});
  const [panelLoading, setPanelLoading] = useState(false);

  async function loadApplicants() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, pageSize });
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.location) params.set('location', filters.location);
      if (filters.phone) params.set('phone', filters.phone);
      if (filters.jobType) params.set('jobType', filters.jobType);

      const res = await apiFetch(`/api/applicants?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch applicants');
      const data = await res.json();
      setApplicants(data.applicants);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadApplicants(); }, [page, pageSize]);

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }
  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadApplicants();
  }
  function handleClearFilters() {
    setFilters(initialFilters);
    setPage(1);
    setTimeout(loadApplicants, 0);
  }

  // Downloads a CSV of everything matching the CURRENT filters (not just
  // the current page - export deliberately ignores pagination, since the
  // whole point is "give me everything I'm looking at, not just page 2").
  // Same blob-download pattern as document downloads: an authenticated
  // GET can't just be a plain <a href> link, since a normal browser
  // navigation wouldn't carry the Authorization header.
  async function handleExportCsv() {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.location) params.set('location', filters.location);
    if (filters.phone) params.set('phone', filters.phone);
    if (filters.jobType) params.set('jobType', filters.jobType);

    const res = await apiFetch(`/api/applicants/export?${params.toString()}`);
    if (!res.ok) {
      alert('Failed to export applicants.');
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `applicants-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleStatusChange(applicantId, newStatus) {
    setUpdatingId(applicantId);
    try {
      const res = await apiFetch(`/api/applicants/${applicantId}/status`, {
        method: 'PATCH', body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setApplicants((prev) => prev.map((a) => (a.id === applicantId ? { ...a, status: newStatus } : a)));
    } catch {
      alert('Could not update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handlePaymentStatusChange(applicantId, newPaymentStatus) {
    setUpdatingId(applicantId);
    try {
      const res = await apiFetch(`/api/applicants/${applicantId}/payment-status`, {
        method: 'PATCH', body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });
      if (!res.ok) throw new Error();
      loadApplicants();
    } catch {
      alert('Could not update payment status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRequestPayment(applicantId) {
    setRequestingPaymentId(applicantId);
    try {
      const res = await apiFetch(`/api/applicants/${applicantId}/request-payment`, { method: 'POST' });
      let data = null;
      try { data = await res.json(); } catch {
        alert(`Server responded with status ${res.status} but not valid JSON - the route likely isn't mounted. Check index.js and restart the server.`);
        return;
      }
      if (!res.ok) { alert(data.error || `Request failed (status ${res.status}).`); return; }
      alert("Payment request sent - the applicant/payer should see a PIN prompt shortly.");
    } catch {
      alert('Could not reach the server at all - confirm it is running.');
    } finally {
      setRequestingPaymentId(null);
    }
  }

  async function togglePanel(applicantId, tab) {
    if (expandedId === applicantId && expandedTab === tab) {
      setExpandedId(null);
      return;
    }
    setExpandedId(applicantId);
    setExpandedTab(tab);

    if (tab === 'documents' && !documentsByApplicant[applicantId]) {
      setPanelLoading(true);
      const res = await apiFetch(`/api/applicants/${applicantId}/documents`);
      const data = await res.json();
      setDocumentsByApplicant((prev) => ({ ...prev, [applicantId]: data.documents }));
      setPanelLoading(false);
    }
    if (tab === 'details' && !detailsByApplicant[applicantId]) {
      setPanelLoading(true);
      const res = await apiFetch(`/api/applicants/${applicantId}/full`);
      const data = await res.json();
      setDetailsByApplicant((prev) => ({ ...prev, [applicantId]: data.applicant }));
      setPanelLoading(false);
    }
  }

  async function downloadDocument(applicantId, documentId, filename) {
    const res = await apiFetch(`/api/applicants/${applicantId}/documents/${documentId}/download`);
    if (!res.ok) { alert('Failed to download document.'); return; }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (loading && applicants.length === 0) return <main className="admin-wrap"><AdminNav />Loading…</main>;
  if (error) return <main className="admin-wrap"><AdminNav /><div className="banner-error">{error}</div></main>;

  return (
    <main className="admin-wrap">
      <AdminNav />
      <h1 style={{ marginBottom: 0 }}>Applicants</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>{total} total</p>

      <form onSubmit={handleSearch} className="filter-bar">
        <div className="filter-field">
          <label>Registered from</label>
          <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
        </div>
        <div className="filter-field">
          <label>Registered to</label>
          <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} />
        </div>
        <div className="filter-field">
          <label>Location</label>
          <input name="location" value={filters.location} onChange={handleFilterChange} placeholder="e.g. Kisumu" />
        </div>
        <div className="filter-field">
          <label>Phone number</label>
          <input name="phone" value={filters.phone} onChange={handleFilterChange} placeholder="07..." />
        </div>
        <div className="filter-field">
          <label>Job type</label>
          <select name="jobType" value={filters.jobType} onChange={handleFilterChange}>
            <option value="">All</option>
            {JOB_TYPES.map((jt) => <option key={jt} value={jt}>{jt}</option>)}
          </select>
        </div>
        <div className="filter-actions">
          <button type="submit" className="icon-btn icon-btn-search" title="Search"><Search size={16} /></button>
          <button type="button" className="icon-btn icon-btn-reset" title="Clear filters" onClick={handleClearFilters}><RotateCcw size={16} /></button>
          <button type="button" className="icon-btn icon-btn-export" title="Export CSV" onClick={handleExportCsv}><Download size={16} /></button>
        </div>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 14 }}>
          <label style={{ marginRight: 8 }}>Show</label>
          <select className="page-size-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span style={{ marginLeft: 6 }}>entries</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="button button-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span style={{ fontSize: 14 }}>Page {page} of {totalPages}</span>
          <button className="button button-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>

      <div>
        <table>
          <thead>
            <tr>
              <th>Ref #</th><th>Name</th><th>Phone</th><th>Age</th><th>Location</th>
              <th>Type</th><th>Company / Role</th><th>Status</th><th>Payment</th><th>Applied</th><th>Panel</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((a) => (
              <Fragment key={a.id}>
                <tr>
                  <td style={{ fontFamily: 'monospace' }}>#{a.id}</td>
                  <td>{a.full_name}</td>
                  <td>{a.phone_number}</td>
                  <td>{a.age}</td>
                  <td>{a.location || '—'}</td>
                  <td>{a.application_type ? <span className="badge">{a.application_type}</span> : '—'}</td>
                  <td>{a.company_name ? `${a.company_name} — ${a.batch_role}` : '—'}</td>
                  <td>
                    <select className="pill-select" style={getStatusStyle(a.status)} value={a.status} disabled={updatingId === a.id} onChange={(e) => handleStatusChange(a.id, e.target.value)}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="pill-select" style={getPaymentStyle(a.payment_status)} value={a.payment_status} disabled={updatingId === a.id} onChange={(e) => handlePaymentStatusChange(a.id, e.target.value)}>
                      {PAYMENT_OPTIONS.map((p) => <option key={p} value={p}>{PAYMENT_LABELS[p]}</option>)}
                    </select>
                    {a.payment_date && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{new Date(a.payment_date).toLocaleDateString()}</div>}
                    {a.payment_status !== 'completed' && (
                      <button className="button button-secondary" style={{ padding: '3px 8px', fontSize: 11, marginTop: 4, display: 'block' }} disabled={requestingPaymentId === a.id} onClick={() => handleRequestPayment(a.id)}>
                        {requestingPaymentId === a.id ? 'Sending…' : 'Request payment'}
                      </button>
                    )}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="button button-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => togglePanel(a.id, 'documents')}>Docs</button>
                      <button className="button button-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => togglePanel(a.id, 'details')}>Details</button>
                    </div>
                  </td>
                </tr>
                {expandedId === a.id && (
                  <tr>
                    <td colSpan={11} style={{ background: '#f8faff', padding: 16 }}>
                      {panelLoading ? (
                        <p style={{ margin: 0, fontSize: 13 }}>Loading…</p>
                      ) : expandedTab === 'documents' ? (
                        (documentsByApplicant[a.id] || []).length === 0 ? (
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>No documents uploaded.</p>
                        ) : (
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {documentsByApplicant[a.id].map((doc) => (
                              <button key={doc.id} className="button button-secondary" style={{ fontSize: 12 }} onClick={() => downloadDocument(a.id, doc.id, doc.original_filename)}>
                                {doc.doc_type.replace(/_/g, ' ')} — download
                              </button>
                            ))}
                          </div>
                        )
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                          {DETAIL_SECTIONS.map((section) => (
                            <div key={section.title}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 6 }}>{section.title}</div>
                              {section.fields.map(([label, key]) => (
                                <div key={key} style={{ fontSize: 12, marginBottom: 2 }}>
                                  <span style={{ color: 'var(--color-text-muted)' }}>{label}: </span>
                                  <span>{detailsByApplicant[a.id]?.[key] || '—'}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {applicants.length === 0 && (
              <tr><td colSpan={11} style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>No applicants match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}