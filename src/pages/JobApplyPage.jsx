import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../lib/api.js';

const initialForm = {
  batchId: '',
  fullName: '',
  phoneNumber: '',
  age: '',
  idNumber: '',
  location: '',
  hasExperience: 'no',
  experienceDetails: '',
};

const DOC_FIELDS = [
  { key: 'id_copy', label: 'National ID (copy)' },
  { key: 'passport_photo', label: 'Passport-size photo' },
  { key: 'personal_accident_cover', label: 'Personal accident cover' },
];

export default function JobApplyPage() {
  const [form, setForm] = useState(initialForm);
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState(null);
  const navigate = useNavigate();

  // Job openings vary by company, unlike the single standing Straightex
  // training programme - so this page (unlike TraineeApplyPage) does need
  // a company/role dropdown.
  useEffect(() => {
    fetch(`${API_URL}/api/batches/open?type=job`)
      .then((res) => res.json())
      .then((data) => setBatches(data.batches || []))
      .catch(() => setErrors({ general: 'Could not load available jobs. Refresh and try again.' }))
      .finally(() => setBatchesLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(docType, file) {
    setFiles((prev) => ({ ...prev, [docType]: file }));
  }

  async function uploadDocument(applicantId, docType, file) {
    const body = new FormData();
    body.append('docType', docType);
    body.append('file', file);
    const res = await fetch(`${API_URL}/api/applicants/${applicantId}/documents`, { method: 'POST', body });
    return res.ok;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch(`${API_URL}/api/applicants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, hasExperience: form.hasExperience === 'yes' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || { general: 'Something went wrong. Please try again.' });
        return;
      }

      const newReferenceId = data.referenceId;
      for (const { key } of DOC_FIELDS) {
        const file = files[key];
        if (!file) continue;
        await uploadDocument(newReferenceId, key, file);
      }

      const selectedBatch = batches.find((b) => String(b.id) === String(form.batchId));
      const fee = Number(selectedBatch?.fee_amount || 0);

      if (fee > 0) {
        navigate('/pay', {
          state: {
            referenceId: newReferenceId,
            applicationToken: data.applicationToken,
            feeAmount: fee,
            fullName: form.fullName,
            phoneNumber: form.phoneNumber,
          },
        });
      } else {
        setReferenceId(newReferenceId);
      }
    } catch (err) {
      setErrors({ general: 'Could not reach the server. Is it running?' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (referenceId) {
    return (
      <main className="page-center">
        <div className="card narrow" style={{ textAlign: 'center' }}>
          <h1>Application received</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Your reference number is:</p>
          <p style={{ fontSize: 32, fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
            #{referenceId}
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Save this number. Our team will call you about next steps.
          </p>
          <Link to="/" className="button button-secondary" style={{ display: 'inline-block', marginTop: 12 }}>
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-center">
      <form className="card" onSubmit={handleSubmit}>
        <h1 style={{ marginTop: 0 }}>Job Application</h1>
        {errors.general && <div className="banner-error">{errors.general}</div>}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="batchId">Company / role</label>
            {batchesLoading ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading available jobs…</p>
            ) : (
              <select id="batchId" name="batchId" value={form.batchId} onChange={handleChange}>
                <option value="">Select…</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.company_name} — {b.role} ({b.spots_remaining} spots left)
                  </option>
                ))}
              </select>
            )}
            {errors.batchId && <div className="error">{errors.batchId}</div>}
          </div>

          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Jane Wanjiku" />
            {errors.fullName && <div className="error">{errors.fullName}</div>}
          </div>

          <div className="field">
            <label htmlFor="phoneNumber">Phone number</label>
            <input id="phoneNumber" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="07XXXXXXXX" />
            {errors.phoneNumber && <div className="error">{errors.phoneNumber}</div>}
          </div>

          <div className="field">
            <label htmlFor="age">Age</label>
            <input id="age" name="age" type="number" min="18" max="30" value={form.age} onChange={handleChange} />
            {errors.age && <div className="error">{errors.age}</div>}
          </div>

          <div className="field">
            <label htmlFor="idNumber">National ID number</label>
            <input id="idNumber" name="idNumber" value={form.idNumber} onChange={handleChange} />
            {errors.idNumber && <div className="error">{errors.idNumber}</div>}
          </div>

          <div className="field">
            <label htmlFor="location">Location (town/county)</label>
            <input id="location" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Kisumu" />
            {errors.location && <div className="error">{errors.location}</div>}
          </div>

          <div className="field">
            <label>Do you have prior work experience?</label>
            <div style={{ display: 'flex', gap: 16, fontSize: 14, marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="radio" name="hasExperience" value="yes" checked={form.hasExperience === 'yes'} onChange={handleChange} />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="radio" name="hasExperience" value="no" checked={form.hasExperience === 'no'} onChange={handleChange} />
                No
              </label>
            </div>
          </div>

          <div className="field field-full">
            <label htmlFor="experienceDetails">If yes, describe briefly (optional)</label>
            <textarea id="experienceDetails" name="experienceDetails" rows={3} value={form.experienceDetails} onChange={handleChange} />
          </div>

          <div className="form-section-title">Documents</div>
          {DOC_FIELDS.map(({ key, label }) => (
            <div className="field" key={key}>
              <label htmlFor={key}>{label}</label>
              <input id={key} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileChange(key, e.target.files[0])} />
            </div>
          ))}
        </div>

        <button type="submit" className="button" style={{ width: '100%', marginTop: 20 }} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </main>
  );
}