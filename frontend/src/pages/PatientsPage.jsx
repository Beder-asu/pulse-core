import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, UserRound } from 'lucide-react';
import api from '../api/config';

const initialForm = {
  userId: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  contactNumber: '',
  address: '',
  bloodGroup: '',
};

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '' });

  const loadPatients = async () => {
    setStatus((current) => ({ ...current, loading: true, error: '' }));
    try {
      const { data } = await api.get('/patients');
      setPatients(data || []);
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.response?.data?.message || 'Unable to load patients' }));
    } finally {
      setStatus((current) => ({ ...current, loading: false }));
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus((current) => ({ ...current, saving: true, error: '', success: '' }));
    try {
      await api.post('/patients/profile', formData);
      setFormData(initialForm);
      setStatus((current) => ({ ...current, success: 'Patient profile created' }));
      await loadPatients();
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.response?.data?.message || 'Unable to create patient' }));
    } finally {
      setStatus((current) => ({ ...current, saving: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Patients</h2>
          <p className="text-on-surface-variant">Manage patient profiles backed by the patients service.</p>
        </div>
        <button onClick={loadPatients} className="glass-panel px-4 py-2 rounded-lg flex items-center gap-2">
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {(status.error || status.success) && (
        <div className={`rounded-lg border p-4 ${status.error ? 'border-error bg-error/10 text-error' : 'border-green-400 bg-green-400/10 text-green-300'}`}>
          {status.error || status.success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2"><Plus size={20} /> New Patient</h3>
          <Input label="Patient User ID" value={formData.userId} onChange={(value) => setFormData({ ...formData, userId: value })} placeholder="PAT-456" required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" value={formData.firstName} onChange={(value) => setFormData({ ...formData, firstName: value })} required />
            <Input label="Last Name" value={formData.lastName} onChange={(value) => setFormData({ ...formData, lastName: value })} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input type="date" label="Date of Birth" value={formData.dateOfBirth} onChange={(value) => setFormData({ ...formData, dateOfBirth: value })} />
            <Input label="Blood Group" value={formData.bloodGroup} onChange={(value) => setFormData({ ...formData, bloodGroup: value })} placeholder="O+" />
          </div>
          <Input label="Contact Number" value={formData.contactNumber} onChange={(value) => setFormData({ ...formData, contactNumber: value })} />
          <Input label="Address" value={formData.address} onChange={(value) => setFormData({ ...formData, address: value })} />
          <button disabled={status.saving} className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg disabled:opacity-50">
            {status.saving ? 'Creating...' : 'Create Patient'}
          </button>
        </form>

        <div className="glass-panel rounded-xl overflow-hidden">
          {status.loading ? (
            <p className="p-6 text-on-surface-variant">Loading patients...</p>
          ) : patients.length === 0 ? (
            <p className="p-6 text-on-surface-variant">No patient profiles have been created yet.</p>
          ) : (
            <div className="divide-y divide-white/10">
              {patients.map((patient) => (
                <div key={patient.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center"><UserRound size={20} /></div>
                    <div>
                      <p className="font-bold">{patient.firstName} {patient.lastName}</p>
                      <p className="text-sm text-on-surface-variant">{patient.userId} - {patient.bloodGroup || 'Blood group not set'}</p>
                    </div>
                  </div>
                  <Link className="text-primary font-semibold" to={`/patients/${patient.userId}/history`}>View history</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, type = 'text', required = false, placeholder = '' }) => (
  <label className="block">
    <span className="block text-sm text-on-surface-variant mb-2">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-on-surface focus:outline-none focus:border-primary"
    />
  </label>
);

export default PatientsPage;
