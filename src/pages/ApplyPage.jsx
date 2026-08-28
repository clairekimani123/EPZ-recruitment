import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const initialForm = {
  applicationType: '',
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

export default function ApplyPage() {
  const [form, setForm] = useState(initialForm);
  const [batches, setBatches] = useState([]); // batches for whichever type is currently selected
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({});

  // --------------------------------------------------------------------
  // Two-step selection: pick a TYPE first (trainee vs job), which then
  // determines which companies/roles show up in the second dropdown. We
  // re-fetch from the server every time the type changes, using the
  // ?type= filter the backend already supports - this way an applicant
  // never sees a company that doesn't actually match what they're
  // applying for, and the filtering logic lives in one place (the
  // server), not duplicated in the browser.
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!form.applicationType) {
      setBatches([]);
      return;
    }

    setBatchesLoading(true);
    setForm((prev) => ({ ...prev, batchId: '' })); // reset company choice when type changes

    fetch(`${API_URL}/api/batches/open?type=${form.applicationType}`)
      .then((res) => res.json())
      .then((data) => setBatches(data.batches))
      .catch(() => setErrors({ general: 'Could not load available positions. Refresh and try again.' }))
      .finally(() => setBatchesLoading(false));
  }, [form.applicationType]);

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
        body: JSON.stringify({
          ...form,
          // Trainees never fill in experience fields - force clean values
          // regardless of whatever leftover state might exist, so we
          // never send stale data for a section the user couldn't see.
          hasExperience: form.applicationType === 'job' && form.hasExperience === 'yes',
          experienceDetails: form.applicationType === 'job' ? form.experienceDetails : null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || { general: 'Something went wrong. Please try again.' });
        return;
      }

      const newReferenceId = data.referenceId;
      const statusUpdates = {};
      for (const { key } of DOC_FIELDS) {
        const file = files[key];
        if (!file) continue;
        const success = await uploadDocument(newReferenceId, key, file);
        statusUpdates[key] = success ? 'done' : 'error';
      }
      setUploadStatus(statusUpdates);
      setReferenceId(newReferenceId);
    } catch (err) {
      setErrors({ general: 'Could not reach the server. Is it running?' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (referenceId) {
    const anyUploadFailed = Object.values(uploadStatus).includes('error');
    return (
      <main className="page-center centered-vertically">
        <div className="card narrow" style={{ textAlign: 'center' }}>
          <h1>Application received</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Your reference number is:</p>
          <p style={{ fontSize: 32, fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
            #{referenceId}
          </p>
          {anyUploadFailed && (
            <div className="banner-error" style={{ textAlign: 'left' }}>
              One or more documents failed to upload. Please bring physical copies when you come in.
            </div>
          )}
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Save this number. Our team will call you about next steps.
          </p>
        </div>
      </main>
    );
  }

  const isJob = form.applicationType === 'job';

  return (
    <main className="page-center">
      <form className="card" onSubmit={handleSubmit}>
        <h1 style={{ marginTop: 0 }}>Traineeship &amp; Job Application</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: -8, marginBottom: 24 }}>
          Tell us a bit about yourself and what you're applying for.
        </p>

        {errors.general && <div className="banner-error">{errors.general}</div>}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="applicationType">Are you applying for a traineeship or a job?</label>
            <select id="applicationType" name="applicationType" value={form.applicationType} onChange={handleChange}>
              <option value="">Select one…</option>
              <option value="trainee">Trainee (training at Straightex)</option>
              <option value="job">Job (with a hiring company)</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="batchId">
              {form.applicationType === 'trainee' ? 'Training program' : form.applicationType === 'job' ? 'Company / role' : 'Position'}
            </label>
            {!form.applicationType ? (
              <select disabled><option>Select a type first…</option></select>
            ) : batchesLoading ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading available positions…</p>
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
            {form.applicationType && !batchesLoading && batches.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                No open positions of this type right now. Please check back later.
              </p>
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
            <input id="age" name="age" type="number" min="18" max="30" value={form.age} onChange={handleChange} placeholder="Between 18 and 30" />
            {errors.age && <div className="error">{errors.age}</div>}
          </div>

          <div className="field">
            <label htmlFor="idNumber">National ID number</label>
            <input id="idNumber" name="idNumber" value={form.idNumber} onChange={handleChange} placeholder="ID number" />
            {errors.idNumber && <div className="error">{errors.idNumber}</div>}
          </div>

          <div className="field">
            <label htmlFor="location">Location (town/county)</label>
            <input id="location" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Kisumu" />
            {errors.location && <div className="error">{errors.location}</div>}
          </div>

          {/* Experience fields only make sense for job applicants - a
              trainee is by definition here to learn from scratch, so we
              don't even ask. Both fields live inside `isJob &&` so they're
              not rendered at all (not just hidden with CSS) when a
              trainee is filling out the form. */}
          {isJob && (
            <>
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
                <textarea id="experienceDetails" name="experienceDetails" rows={3} value={form.experienceDetails} onChange={handleChange} placeholder="e.g. 6 months tailoring at ABC Textiles" />
              </div>
            </>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '24px 0' }} />
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 0 }}>
          Upload clear photos or scans (JPG, PNG, or PDF, max 5MB each).
        </p>

        <div className="form-grid">
          {DOC_FIELDS.map(({ key, label }) => (
            <div className="field" key={key}>
              <label htmlFor={key}>{label}</label>
              <input id={key} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileChange(key, e.target.files[0])} />
            </div>
          ))}
        </div>

        <button type="submit" className="button" style={{ width: '100%' }} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </main>
  );
}