import React, { useState } from 'react';
import IntakeBatchSelector from '../components/IntakeBatchSelector';
import TraineeForm from '../components/TraineeForm';
import TraineeTable from '../components/TraineeTable';


export default function Dashboard() {
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Recruitment & Intake Platform</h1>
            <p className="text-sm text-slate-500">Track industrial trainees, quotas, and document checks.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow"
          >
            + New Intake Registration
          </button>
        </div>

        {/* Batch Selector Banner */}
        <IntakeBatchSelector
          selectedIntake={selectedIntake}
          onSelectIntake={setSelectedIntake}
        />

        {/* Modal for Registration */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <TraineeForm
              intakeId={selectedIntake}
              onClose={() => setShowModal(false)}
              onTraineeAdded={() => setShowModal(false)}
            />
          </div>
        )}

        {/* Trainee Directory Table */}
        <TraineeTable selectedIntake={selectedIntake} />

      </div>
    </div>
  );
}