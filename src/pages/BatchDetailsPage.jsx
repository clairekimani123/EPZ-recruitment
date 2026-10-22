import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api.js';
import AdminNav from '../components/AdminNav.jsx';

export default function BatchDetailsPage() {
  const { id } = useParams();
  const batchId = Number(id); // Force it to a number
  
  const [batch, setBatch] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [batchRes, appRes] = await Promise.all([
          apiFetch(`/api/batches/${batchId}`),
          apiFetch(`/api/batches/${batchId}/applicants`)
        ]);

        const batchData = await batchRes.json();
        const appData = await appRes.json();

        // Log this to your browser console to see what the backend is actually sending!
        console.log("Batch Data:", batchData);
        console.log("Applicants Data:", appData);

        if (!batchRes.ok) throw new Error(batchData.error || 'Batch not found');
        if (!appRes.ok) throw new Error(appData.error || 'Failed to load applicants');

        setBatch(batchData.batch);
        setApplicants(appData.applicants || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [batchId]);

  // ... rest of the component stays exactly the same

  // --- CSV EXPORT LOGIC ---
  function handleDownloadCSV() {
    if (applicants.length === 0) return;

    // Define columns - adjust these to match your actual applicant data structure
    const headers = ['Reference ID', 'Full Name', 'Phone Number', 'Email', 'Payment Status', 'Date Applied'];
    
    const csvRows = applicants.map(app => [
      `REF${app.id}`,
      `"${app.full_name || ''}"`,
      `"${app.phone_number || ''}"`,
      `"${app.email || ''}"`,
      `"${app.payment_status || 'Pending'}"`,
      `"${new Date(app.created_at).toLocaleDateString()}"`
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Batch_${id}_Applicants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) return <main className="admin-wrap"><AdminNav /><p>Loading…</p></main>;
  if (!batch) return <main className="admin-wrap"><AdminNav /><p>Batch not found.</p></main>;

  return (
    <main className="admin-wrap">
      <AdminNav />
      
      <div style={{ marginBottom: 20 }}>
        <Link to="/admin/batches" style={{ fontSize: 14, textDecoration: 'underline' }}>← Back to Batches</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
          <div>
            <h1 style={{ margin: 0 }}>{batch.company_name} - {batch.role}</h1>
            <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Application Type: <strong style={{ textTransform: 'capitalize' }}>{batch.application_type}</strong> | 
              Progress: <strong>{applicants.length} of {batch.quantity_needed}</strong> registered
            </p>
          </div>
          <button className="button" onClick={handleDownloadCSV} disabled={applicants.length === 0}>
            Download CSV
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Ref ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Payment Status</th>
              <th>Date Applied</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((app) => (
              <tr key={app.id}>
                <td>REF{app.id}</td>
                <td>{app.full_name}</td>
                <td>{app.phone_number}</td>
                <td>
                  <span className={`badge ${app.payment_status === 'completed' ? 'badge-success' : ''}`}>
                    {app.payment_status || 'Pending'}
                  </span>
                </td>
                <td>{app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {applicants.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>No applicants for this batch yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}