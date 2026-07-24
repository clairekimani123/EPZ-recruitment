import React, { useState } from 'react';

export default function TraineeForm({ intakeId, onTraineeAdded, onClose }) {
  const [formData, setFormData] = useState({
    intake_id: intakeId || 1,
    full_name: '',
    phone_number: '',
    age: '',
    id_number: '',
    has_tailoring_experience: false,
    previous_company: '',
    has_original_id_and_copies: false,
    has_passport_photos: false,
    has_insurance_cover: false,
    join_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'registered',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/trainees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Trainee registered successfully!');
        if (onTraineeAdded) onTraineeAdded(result.data);
      } else {
        alert(result.message || 'Error registering trainee.');
      }
    } catch (err) {
      console.error('API Error:', err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto">
      <div className="flex justify-between items-center border-b pb-3 mb-4">
        <h3 className="text-lg font-bold text-slate-800">Register New Candidate</h3>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Personal Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Full Name</label>
            <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Phone Number</label>
            <input type="text" name="phone_number" required value={formData.phone_number} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Age (18–26)</label>
            <input type="number" name="age" min="18" max="35" required value={formData.age} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">National ID Number</label>
            <input type="text" name="id_number" required value={formData.id_number} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        {/* Tailoring Experience */}
        <div className="bg-slate-50 p-3 rounded-lg border">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" name="has_tailoring_experience" checked={formData.has_tailoring_experience} onChange={handleChange} className="rounded text-blue-600" />
            <span className="text-sm font-medium text-slate-700">Has Prior Tailoring / Machine Experience?</span>
          </label>

          {formData.has_tailoring_experience && (
            <div className="mt-3">
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Previous Company / Employer</label>
              <input type="text" name="previous_company" value={formData.previous_company} onChange={handleChange} placeholder="e.g. Apex Garments Ltd" className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          )}
        </div>

        {/* Training Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Join Date</label>
            <input type="date" name="join_date" required value={formData.join_date} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">End Date</label>
            <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm" />
          </div>
        </div>

        {/* Document Checklist */}
        <div className="border-t pt-3">
          <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Physical Documents Provided:</p>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="has_original_id_and_copies" checked={formData.has_original_id_and_copies} onChange={handleChange} className="rounded text-blue-600" />
              <span className="text-sm text-slate-600">Original ID + 2 Clear Copies</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="has_passport_photos" checked={formData.has_passport_photos} onChange={handleChange} className="rounded text-blue-600" />
              <span className="text-sm text-slate-600">2 Passport Size Photos</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="has_insurance_cover" checked={formData.has_insurance_cover} onChange={handleChange} className="rounded text-blue-600" />
              <span className="text-sm text-slate-600">Personal Insurance Cover (2 Copies)</span>
            </label>
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow transition-all">
          Save Record & Assign to Batch
        </button>
      </form>
    </div>
  );
}