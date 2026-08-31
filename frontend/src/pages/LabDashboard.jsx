import React, { useCallback, useEffect, useState } from 'react';
import { FlaskConical, RefreshCw, Save } from 'lucide-react';
import api from '../api/config';
import { hasRole } from '../auth/roles';
import { buildPatientNameMap, resolvePatientName } from '../utils/identity';

const LabDashboard = () => {
  const canCreate = hasRole('DOCTOR', 'ADMIN');
  const canComplete = hasRole('STAFF', 'ADMIN');
  const [orders, setOrders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({ patientId: '', testName: '', notes: '' });
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '' });
  const patientNames = buildPatientNameMap(patients);

  const loadData = useCallback(async () => {
    setStatus((current) => ({ ...current, loading: true, error: '' }));
    try {
      const [ordersRes, patientsRes] = await Promise.all([
        api.get('/lab/orders'),
        api.get('/patients')
      ]);
      const nextPatients = patientsRes.data || [];
      setOrders(ordersRes.data || []);
      setPatients(nextPatients);
      setFormData((current) => ({ ...current, patientId: current.patientId || nextPatients[0]?.userId || '' }));
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.response?.data?.message || 'Unable to load lab data' }));
    } finally {
      setStatus((current) => ({ ...current, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createOrder = async (event) => {
    event.preventDefault();
    setStatus((current) => ({ ...current, saving: true, error: '', success: '' }));
    try {
      await api.post('/lab/orders', formData);
      setFormData((current) => ({ ...current, testName: '', notes: '' }));
      setStatus((current) => ({ ...current, success: 'Lab order created' }));
      await loadData();
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.response?.data?.message || 'Unable to create lab order' }));
    } finally {
      setStatus((current) => ({ ...current, saving: false }));
    }
  };

  const completeOrder = async (order) => {
    const result = window.prompt('Enter the lab result');
    if (!result) return;
    await api.put(`/lab/orders/${order.id}/result`, { result });
    await loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Laboratory Dashboard</h2>
          <p className="text-on-surface-variant">Create orders, view status, and record results.</p>
        </div>
        <button onClick={loadData} className="glass-panel px-4 py-2 rounded-lg flex items-center gap-2"><RefreshCw size={18} /> Refresh</button>
      </div>

      {(status.error || status.success) && (
        <div className={`rounded-lg border p-4 ${status.error ? 'border-error bg-error/10 text-error' : 'border-green-400 bg-green-400/10 text-green-300'}`}>{status.error || status.success}</div>
      )}

      {canCreate && <form onSubmit={createOrder} className="glass-panel p-6 rounded-xl grid grid-cols-1 lg:grid-cols-[1fr_1fr_2fr_auto] gap-4 items-end">
        <label>
          <span className="block text-sm text-on-surface-variant mb-2">Patient</span>
          <select value={formData.patientId} onChange={(event) => setFormData({ ...formData, patientId: event.target.value })} className="w-full bg-surface border border-white/10 rounded-lg px-3 py-3">
            {patients.map((patient) => <option key={patient.id} value={patient.userId}>{patient.firstName} {patient.lastName}</option>)}
          </select>
        </label>
        <label>
          <span className="block text-sm text-on-surface-variant mb-2">Test Name</span>
          <input required value={formData.testName} onChange={(event) => setFormData({ ...formData, testName: event.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-3" placeholder="CBC" />
        </label>
        <label>
          <span className="block text-sm text-on-surface-variant mb-2">Notes</span>
          <input value={formData.notes} onChange={(event) => setFormData({ ...formData, notes: event.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-3" />
        </label>
        <button disabled={status.saving} className="bg-primary text-on-primary font-bold px-5 py-3 rounded-lg flex items-center gap-2 justify-center"><FlaskConical size={18} /> Order</button>
      </form>}

      <div className="glass-panel rounded-xl overflow-hidden">
        {status.loading ? <p className="p-6 text-on-surface-variant">Loading lab orders...</p> : orders.length === 0 ? <p className="p-6 text-on-surface-variant">No lab orders yet.</p> : (
          <div className="divide-y divide-white/10">
            {orders.map((order) => (
              <div key={order.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-bold">{order.testName}</p>
                  <p className="text-sm text-on-surface-variant">{resolvePatientName(patientNames, order.patientId)} - {order.priority?.name} - {new Date(order.createdAt).toLocaleString()}</p>
                  {order.result && <p className="text-sm text-green-300 mt-2">{order.result}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">{order.status?.name}</span>
                  {canComplete && order.status?.name !== 'COMPLETED' && <button onClick={() => completeOrder(order)} className="glass-panel px-3 py-2 rounded-lg flex items-center gap-2"><Save size={16} /> Result</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LabDashboard;
