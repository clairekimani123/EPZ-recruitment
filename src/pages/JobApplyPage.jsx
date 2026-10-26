import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../lib/api.js';
import SignaturePad from '../components/SignaturePad.jsx';

const initialForm = {
  batchId: '',
  fullName: '', gender: '', idNumber: '', phoneNumber: '', email: '',
  postalAddress: '', currentResidence: '', countyOfResidence: '',
  age: '', dateOfBirth: '', placeOfBirth: '', religion: '', nationality: '', referringAgent: '',
  academicQualification: '', institutionName: '', yearOfCompletion: '', grade: '',
  guardianFullName: '', guardianRelationship: '', guardianPhone: '', guardianResidence: '', guardianOccupation: '',
  nokFullName: '', nokRelationship: '', nokIdNumber: '', nokPhone: '', nokEmail: '',
  emergencyName: '', emergencyRelationship: '', emergencyPhone: '', emergencyEmail: '', emergencyResidence: '',
  hasExperience: 'no', experienceDetails: '',
  declarationAccepted: false, declarationName: '', declarationIdNumber: '', declarationDate: '',
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
  const signaturePadRef = useRef(null);
  const navigate = useNavigate();

  // Job openings vary by company, unlike the single standing Straightex
  // training programme - so this page (unlike TraineeApplyPage) needs a
  // company/role dropdown.
  useEffect(() => {
    fetch(`${API_URL}/api/batches/open?type=job`)
      .then((res) => res.json())
      .then((data) => setBatches(data.batches || []))
      .catch(() => setErrors({ general: 'Could not load available jobs. Refresh and try again.' }))
      .finally(() => setBatchesLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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

  // Same pattern as TraineeApplyPage - the drawn signature is converted to
  // a PNG image blob and uploaded through the exact same document-upload
  // endpoint used for ID copies and photos, tagged doc_type='signature'.
  function uploadSignature(applicantId) {
    return new Promise((resolve) => {
      signaturePadRef.current.toBlob(async (blob) => {
        if (!blob) return resolve(false);
        const body = new FormData();
        body.append('docType', 'signature');
        body.append('file', blob, 'signature.png');
        const res = await fetch(`${API_URL}/api/applicants/${applicantId}/documents`, { method: 'POST', body });
        resolve(res.ok);
      });
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});

    const clientErrors = {};
    if (!form.batchId) clientErrors.batchId = 'Please select which job you are applying for.';
    if (!files.id_copy) clientErrors.id_copy = 'ID copy is required.';
    if (!files.passport_photo) clientErrors.passport_photo = 'Passport photo is required.';
    if (!files.personal_accident_cover) clientErrors.personal_accident_cover = 'Personal accident cover is required.';
    if (!form.declarationAccepted) clientErrors.declaration = 'You must accept the declaration to continue.';
    if (!form.declarationIdNumber.trim()) {
      clientErrors.declarationIdNumber = 'Please enter your ID number.';
    } else if (form.declarationIdNumber.trim() !== form.idNumber.trim()) {
      clientErrors.declarationIdNumber = 'This must match the ID number you entered in your Bio Data above.';
    }
    if (signaturePadRef.current?.isEmpty()) clientErrors.signature = 'Please sign in the box above.';

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/applicants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          hasExperience: form.hasExperience === 'yes',
          location: form.countyOfResidence || form.currentResidence, // reused by admin search/filter
        }),
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
      await uploadSignature(newReferenceId);

      // ✅ THE FIX: Just set the reference ID. 
      // The `if (referenceId)` statement below will automatically swap 
      // the form out for the Success screen.
      setReferenceId(newReferenceId);


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
          <p style={{ fontSize: 32, fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)' }}>#{referenceId}</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Save this number. Our team will call you about next steps.</p>
          <Link to="/" className="button button-secondary" style={{ display: 'inline-block', marginTop: 12 }}>
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-center" style={{ alignItems: 'flex-start', paddingTop: 40 }}>
      <form className="card" style={{ maxWidth: 900 }} onSubmit={handleSubmit}>
        <h1 style={{ marginTop: 0 }}>Job Application</h1>
        {errors.general && <div className="banner-error">{errors.general}</div>}

        <div className="form-grid">
          <div className="form-section-title">Position</div>
          <div className="field field-full">
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

          <div className="form-section-title">1. Personal Details / Bio Data</div>
          <div className="field"><label>Full name</label><input name="fullName" value={form.fullName} onChange={handleChange} />{errors.fullName && <div className="error">{errors.fullName}</div>}</div>
          <div className="field"><label>Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="">Select…</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </select>
          </div>
          <div className="field"><label>ID number</label><input name="idNumber" value={form.idNumber} onChange={handleChange} />{errors.idNumber && <div className="error">{errors.idNumber}</div>}</div>
          <div className="field"><label>Phone number</label><input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="07XXXXXXXX" />{errors.phoneNumber && <div className="error">{errors.phoneNumber}</div>}</div>
          <div className="field"><label>Email address</label><input type="email" name="email" value={form.email} onChange={handleChange} /></div>
          <div className="field"><label>Postal address</label><input name="postalAddress" value={form.postalAddress} onChange={handleChange} /></div>
          <div className="field"><label>Current residence</label><input name="currentResidence" value={form.currentResidence} onChange={handleChange} /></div>
          <div className="field"><label>County of residence</label><input name="countyOfResidence" value={form.countyOfResidence} onChange={handleChange} /></div>
          <div className="field"><label>Age</label><input type="number" min="18" max="30" name="age" value={form.age} onChange={handleChange} />{errors.age && <div className="error">{errors.age}</div>}</div>
          <div className="field"><label>Date of birth</label><input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} /></div>
          <div className="field"><label>Place of birth</label><input name="placeOfBirth" value={form.placeOfBirth} onChange={handleChange} /></div>
          <div className="field"><label>Religion</label><input name="religion" value={form.religion} onChange={handleChange} /></div>
          <div className="field"><label>Nationality</label><input name="nationality" value={form.nationality} onChange={handleChange} /></div>
          <div className="field"><label>Referring agent (optional)</label><input name="referringAgent" value={form.referringAgent} onChange={handleChange} /></div>

          <div className="form-section-title">2. Academic Details</div>
          <div className="field"><label>Academic qualification</label><input name="academicQualification" value={form.academicQualification} onChange={handleChange} /></div>
          <div className="field"><label>Institution</label><input name="institutionName" value={form.institutionName} onChange={handleChange} /></div>
          <div className="field"><label>Year of completion</label><input name="yearOfCompletion" value={form.yearOfCompletion} onChange={handleChange} /></div>
          <div className="field"><label>Grade</label><input name="grade" value={form.grade} onChange={handleChange} /></div>

          <div className="form-section-title">3. Parent / Guardian Details</div>
          <div className="field"><label>Full name</label><input name="guardianFullName" value={form.guardianFullName} onChange={handleChange} /></div>
          <div className="field"><label>Relationship</label><input name="guardianRelationship" value={form.guardianRelationship} onChange={handleChange} /></div>
          <div className="field"><label>Phone number</label><input name="guardianPhone" value={form.guardianPhone} onChange={handleChange} /></div>
          <div className="field"><label>Place of residence</label><input name="guardianResidence" value={form.guardianResidence} onChange={handleChange} /></div>
          <div className="field"><label>Occupation</label><input name="guardianOccupation" value={form.guardianOccupation} onChange={handleChange} /></div>

          <div className="form-section-title">4. Next of Kin Details</div>
          <div className="field"><label>Full name</label><input name="nokFullName" value={form.nokFullName} onChange={handleChange} /></div>
          <div className="field"><label>Relationship</label><input name="nokRelationship" value={form.nokRelationship} onChange={handleChange} /></div>
          <div className="field"><label>ID number</label><input name="nokIdNumber" value={form.nokIdNumber} onChange={handleChange} /></div>
          <div className="field"><label>Phone number</label><input name="nokPhone" value={form.nokPhone} onChange={handleChange} /></div>
          <div className="field"><label>Email address</label><input type="email" name="nokEmail" value={form.nokEmail} onChange={handleChange} /></div>

          <div className="form-section-title">5. Emergency Contact</div>
          <div className="field"><label>Name</label><input name="emergencyName" value={form.emergencyName} onChange={handleChange} /></div>
          <div className="field"><label>Relationship</label><input name="emergencyRelationship" value={form.emergencyRelationship} onChange={handleChange} /></div>
          <div className="field"><label>Phone number</label><input name="emergencyPhone" value={form.emergencyPhone} onChange={handleChange} /></div>
          <div className="field"><label>Email address</label><input type="email" name="emergencyEmail" value={form.emergencyEmail} onChange={handleChange} /></div>
          <div className="field"><label>Place of residence</label><input name="emergencyResidence" value={form.emergencyResidence} onChange={handleChange} /></div>

          <div className="form-section-title">6. Work Experience</div>
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
              {errors[key] && <div className="error">{errors[key]}</div>}
            </div>
          ))}

          <div className="form-section-title">Declaration</div>
          <div className="field field-full">
            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontWeight: 400 }}>
              <input type="checkbox" name="declarationAccepted" checked={form.declarationAccepted} onChange={handleChange} style={{ width: 'auto', marginTop: 3 }} />
              <span>
                I, the undersigned, hereby declare that the information I have provided in this application is
                true, correct and complete to the best of my knowledge. I understand that any false information
                or withholding of important facts may lead to rejection of my application.
              </span>
            </label>
            {errors.declaration && <div className="error">{errors.declaration}</div>}
          </div>
          <div className="field"><label>Name</label><input name="declarationName" value={form.declarationName} onChange={handleChange} /></div>
          <div className="field"><label>ID number</label><input name="declarationIdNumber" value={form.declarationIdNumber} onChange={handleChange} />{errors.declarationIdNumber && <div className="error">{errors.declarationIdNumber}</div>}</div>
          <div className="field"><label>Date</label><input type="date" name="declarationDate" value={form.declarationDate} onChange={handleChange} /></div>
          <div className="field field-full">
            <label>Signature</label>
            <SignaturePad ref={signaturePadRef} />
            {errors.signature && <div className="error">{errors.signature}</div>}
          </div>
        </div>

        <button type="submit" className="button" style={{ width: '100%', marginTop: 20 }} disabled={isSubmitting || batchesLoading}>
          {isSubmitting ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </main>
  );
}