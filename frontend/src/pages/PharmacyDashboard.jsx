import React, { useCallback, useEffect, useState } from 'react';
import { Pill, RefreshCw, Send } from 'lucide-react';
import api from '../api/config';
import { hasRole } from '../auth/roles';
import { buildPatientNameMap, resolvePatientName } from '../utils/identity';

const PharmacyDashboard = () => {
  const canPrescribe = hasRole('DOCTOR', 'ADMIN');
  const canDispense = hasRole('STAFF', 'ADMIN');
  const [inventory, setInventory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({ patientId: '', medicineId: '', dosage: '1 tablet', frequency: 'Twice daily', durationDays: 5, notes: '' });
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '' });
  const patientNames = buildPatientNameMap(patients);

  const loadData = useCallback(async () => {
    setStatus((current) => ({ ...current, loading: true, error: '' }));
    try {
      const [inventoryRes, prescriptionsRes, patientsRes] = await Promise.all([
        api.get('/pharmacy/inventory'),
        api.get('/pharmacy/prescriptions'),
        api.get('/patients')
      ]);
      const nextInventory = inventoryRes.data || [];
      const nextPatients = patientsRes.data || [];
      setInventory(nextInventory);
      setPrescriptions(prescriptionsRes.data || []);
      setPatients(nextPatients);
      setFormData((current) => ({
        ...current,
        patientId: current.patientId || nextPatients[0]?.userId || '',
        medicineId: current.medicineId || nextInventory[0]?.id || ''
      }));
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.response?.data?.message || 'Unable to load pharmacy data' }));
    } finally {
      setStatus((current) => ({ ...current, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createPrescription = async (event) => {
    event.preventDefault();
    setStatus((current) => ({ ...current, saving: true, error: '', success: '' }));
    try {
      await api.post('/pharmacy/prescriptions', {
        patientId: formData.patientId,
        notes: formData.notes,
        medications: [{
          medicineId: formData.medicineId,
          dosage: formData.dosage,
          frequency: formData.frequency,
          durationDays: Number(formData.durationDays)
        }]
      });
      setStatus((current) => ({ ...current, success: 'Prescription created' }));
      await loadData();
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.response?.data?.message || 'Unable to create prescription' }));
    } finally {
      setStatus((current) => ({ ...current, saving: false }));
    }
  };

  const dispense = async (prescription) => {
    setStatus((current) => ({ ...current, error: '', success: '' }));
    try {
      await api.put(`/pharmacy/prescriptions/${prescription.id}/dispense`);
      setStatus((current) => ({ ...current, success: 'Prescription dispensed and inventory updated' }));
      await loadData();
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.response?.data?.message || 'Unable to dispense prescription' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Pharmacy Dashboard</h2>
          <p className="text-on-surface-variant">Track stock, prescribe medication, and dispense orders.</p>
        </div>
        <button onClick={loadData} className="glass-panel px-4 py-2 rounded-lg flex items-center gap-2"><RefreshCw size={18} /> Refresh</button>
      </div>

      {(status.error || status.success) && (
        <div className={`rounded-lg border p-4 ${status.error ? 'border-error bg-error/10 text-error' : 'border-green-400 bg-green-400/10 text-green-300'}`}>{status.error || status.success}</div>
      )}

      <div className={`grid grid-cols-1 ${canPrescribe ? 'xl:grid-cols-[420px_1fr]' : ''} gap-6`}>
        {canPrescribe && <form onSubmit={createPrescription} className="glass-panel rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2"><Pill size={20} /> New Prescription</h3>
          <Select label="Patient" value={formData.patientId} onChange={(value) => setFormData({ ...formData, patientId: value })} options={patients.map((patient) => ({ value: patient.userId, label: `${patient.firstName} ${patient.lastName}` }))} />
          <Select label="Medicine" value={formData.medicineId} onChange={(value) => setFormData({ ...formData, medicineId: value })} options={inventory.map((item) => ({ value: item.id, label: `${item.medicineName} (${item.stockQuantity} in stock)` }))} />
          <Input label="Dosage" value={formData.dosage} onChange={(value) => setFormData({ ...formData, dosage: value })} />
          <Input label="Frequency" value={formData.frequency} onChange={(value) => setFormData({ ...formData, frequency: value })} />
          <Input type="number" label="Duration Days" value={formData.durationDays} onChange={(value) => setFormData({ ...formData, durationDays: value })} />
          <Input label="Notes" value={formData.notes} onChange={(value) => setFormData({ ...formData, notes: value })} />
          <button disabled={status.saving} className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Send size={18} /> Prescribe</button>
        </form>}

        <div className="space-y-6">
          <div className="glass-panel rounded-xl overflow-hidden">
            <h3 className="text-xl font-bold p-5 border-b border-white/10">Inventory</h3>
            {status.loading ? <p className="p-5 text-on-surface-variant">Loading inventory...</p> : inventory.length === 0 ? <p className="p-5 text-on-surface-variant">No inventory items found.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
                {inventory.map((item) => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="font-bold">{item.medicineName}</p>
                    <p className={`text-2xl font-bold mt-3 ${item.stockQuantity < 20 ? 'text-error' : 'text-primary'}`}>{item.stockQuantity}</p>
                    <p className="text-sm text-on-surface-variant">${item.unitPrice.toFixed(2)} - {item.supplier || 'No supplier'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel rounded-xl overflow-hidden">
            <h3 className="text-xl font-bold p-5 border-b border-white/10">Prescriptions</h3>
            {prescriptions.length === 0 ? <p className="p-5 text-on-surface-variant">No prescriptions yet.</p> : (
              <div className="divide-y divide-white/10">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-bold">{resolvePatientName(patientNames, prescription.patientId)}</p>
                      <p className="text-sm text-on-surface-variant">{prescription.medications.map((med) => med.inventory?.medicineName).join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">{prescription.status?.name}</span>
                      {canDispense && prescription.status?.name !== 'DISPENSED' && <button onClick={() => dispense(prescription)} className="glass-panel rounded-lg px-3 py-2">Dispense</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, type = 'text' }) => (
  <label className="block">
    <span className="block text-sm text-on-surface-variant mb-2">{label}</span>
    <input type={type} required value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-3" />
  </label>
);

const Select = ({ label, value, onChange, options }) => (
  <label className="block">
    <span className="block text-sm text-on-surface-variant mb-2">{label}</span>
    <select required value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-surface border border-white/10 rounded-lg px-3 py-3">
      <option value="" disabled>Select {label.toLowerCase()}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>
);

export default PharmacyDashboard;
