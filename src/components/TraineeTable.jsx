import React, { useEffect, useState } from 'react';

export default function TraineeTable({ selectedIntake }) {
  const [trainees, setTrainees] = useState([]);
  const [search, setSearch] = useState('');

  const fetchTrainees = () => {
    let url = `/api/trainees?search=${search}`;
    if (selectedIntake) url += `&intake_id=${selectedIntake}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => setTrainees(data))
      .catch((err) => console.error('Error fetching trainees:', err));
  };

  useEffect(() => {
    fetchTrainees();
  }, [search, selectedIntake]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Trainee Directory</h3>
        <input
          type="text"
          placeholder="🔍 Search name, phone, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm w-72 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 uppercase text-xs">
              <th className="p-3 border-b">Name & Phone</th>
              <th className="p-3 border-b">Age / ID</th>
              <th className="p-3 border-b">Experience</th>
              <th className="p-3 border-b">Documents</th>
              <th className="p-3 border-b">Join Date</th>
              <th className="p-3 border-b">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {trainees.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-slate-400">
                  No candidate records found.
                </td>
              </tr>
            ) : (
              trainees.map((t) => {
                const docsCount = [
                  t.has_original_id_and_copies,
                  t.has_passport_photos,
                  t.has_insurance_cover,
                ].filter(Boolean).length;

                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{t.full_name}</div>
                      <div className="text-xs text-slate-500">{t.phone_number}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-700">{t.age} yrs</div>
                      <div className="text-xs text-slate-400">ID: {t.id_number}</div>
                    </td>
                    <td className="p-3">
                      {t.has_tailoring_experience ? (
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                          {t.previous_company || 'Experienced'}
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">None</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        docsCount === 3 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {docsCount}/3 Provided
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{t.join_date || 'N/A'}</td>
                    <td className="p-3">
                      <span className="capitalize text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-600">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}