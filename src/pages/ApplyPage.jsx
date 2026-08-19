import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const initialForm = {
  fullName: '',
  phoneNumber: '',
  age: '',
  idNumber: '',
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
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({});

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

    const res = await fetch(`${API_URL}/api/applicants/${applicantId}/documents`, {
      method: 'POST',
      body,
    });

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
      <main className="page-center">
        <div className="card" style={{ textAlign: 'center' }}>
          <h1>Application received</h1>
          <p style={{ color: '#666' }}>Your reference number is:</p>
          <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'monospace' }}>#{referenceId}</p>
          {anyUploadFailed && (
            <div className="banner-error" style={{ textAlign: 'left' }}>
              One or more documents failed to upload. Please bring physical
              copies when you come in, or contact our office quoting your
              reference number above.
            </div>
          )}
          <p style={{ fontSize: 13, color: '#888' }}>
            Save this number. Our team will call you about next steps.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-center">
      <form className="card" onSubmit={handleSubmit}>
        <h1 style={{ marginTop: 0 }}>Traineeship Application</h1>

        {errors.general && <div className="banner-error">{errors.general}</div>}

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
          <label>Do you have prior work experience?</label>
          <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
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

        <div className="field">
          <label htmlFor="experienceDetails">If yes, describe briefly (optional)</label>
          <textarea
            id="experienceDetails"
            name="experienceDetails"
            rows={3}
            value={form.experienceDetails}
            onChange={handleChange}
            placeholder="e.g. 6 months tailoring at ABC Textiles"
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />
        <p style={{ fontSize: 13, color: '#666', marginTop: 0 }}>
          Upload clear photos or scans (JPG, PNG, or PDF, max 5MB each).
        </p>

        {DOC_FIELDS.map(({ key, label }) => (
          <div className="field" key={key}>
            <label htmlFor={key}>{label}</label>
            <input
              id={key}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => handleFileChange(key, e.target.files[0])}
            />
          </div>
        ))}

        <button type="submit" className="button" style={{ width: '100%' }} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </main>
  );
}