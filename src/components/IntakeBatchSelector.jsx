import React, { useEffect, useState } from 'react';

export default function IntakeBatchSelector({ selectedIntake, onSelectIntake }) {
  const [intakes, setIntakes] = useState([]);

  useEffect(() => {
    fetch('/api/intakes')
      .then((res) => res.json())
      .then((data) => setIntakes(data))
      .catch((err) => console.error('Error fetching intakes:', err));
  }, []);

  return (
    <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Active Recruitment Drives</h2>
        <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-400/30">
          Target: 18–26 Years Old
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {intakes.map((intake) => {
          const count = intake.trainees_count || 0;
          const capacity = intake.target_capacity || 60;
          const percentage = Math.min(Math.round((count / capacity) * 100), 100);
          const isSelected = selectedIntake === intake.id;

          return (
            <div
              key={intake.id}
              onClick={() => onSelectIntake(intake.id)}
              className={`cursor-pointer p-4 rounded-lg border transition-all ${
                isSelected
                  ? 'border-blue-500 bg-slate-800 ring-2 ring-blue-500/50'
                  : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
              }`}
            >
              <div className="flex justify-between text-sm mb-1 font-medium">
                <span>{intake.name}</span>
                <span className="text-blue-400">{count} / {capacity} Enrolled</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}