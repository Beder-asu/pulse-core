import React, { useEffect, useState } from 'react';
import { CreditCard, FilePlus, RefreshCw } from 'lucide-react';
import api from '../api/config';
import { buildPatientNameMap, resolvePatientName } from '../utils/identity';

const BillingPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({ patientId: '', description: 'Consultation fee', amount: '150' });
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '' });
  const patientNames = buildPatientNameMap(patients);

  const loadData = async () => {
    setStatus((current) => ({ ...current, loading: true, error: '' }));
    try {
      const [invoicesRes, patientsRes] = await Promise.all([api.get('/billing/invoices'), api.get('/patients')]);
      const nextPatients = patientsRes.data || [];
      setInvoices(invoicesRes.data || []);
      setPatients(nextPatients);
      setFormData((current) => ({ ...current, patientId: current.patientId || nextPatients[0]?.userId || '' }));
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.response?.data?.message || 'Unable to load billing data' }));
    } finally {
      setStatus((current) => ({ ...current, loading: false }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createInvoice = async (event) => {
    event.preventDefault();
    setStatus((current) => ({ ...current, saving: true, error: '', success: '' }));
    try {
      await api.post('/billing/invoices', {
        patientId: formData.patientId,
        items: [{ description: formData.description, amount: Number(formData.amount), sourceType: 'MANUAL' }]
      });
      setStatus((current) => ({ ...current, success: 'Invoice issued' }));
      await loadData();
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.response?.data?.message || 'Unable to create invoice' }));
    } finally {
      setStatus((current) => ({ ...current, saving: false }));
    }
  };

  const payInvoice = async (invoice) => {
    setStatus((current) => ({ ...current, error: '', success: '' }));
    try {
      await api.put(`/billing/invoices/${invoice.id}/pay`);
      setStatus((current) => ({ ...current, success: 'Invoice paid' }));
      await loadData();
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.response?.data?.message || 'Unable to pay invoice' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Billing & Invoices</h2>
          <p className="text-on-surface-variant">Issue invoices and record payments.</p>
        </div>
        <button onClick={loadData} className="glass-panel px-4 py-2 rounded-lg flex items-center gap-2"><RefreshCw size={18} /> Refresh</button>
      </div>

      {(status.error || status.success) && (
        <div className={`rounded-lg border p-4 ${status.error ? 'border-error bg-error/10 text-error' : 'border-green-400 bg-green-400/10 text-green-300'}`}>{status.error || status.success}</div>
      )}

      <form onSubmit={createInvoice} className="glass-panel rounded-xl p-6 grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr_auto] gap-4 items-end">
        <label>
          <span className="block text-sm text-on-surface-variant mb-2">Patient</span>
          <select required value={formData.patientId} onChange={(event) => setFormData({ ...formData, patientId: event.target.value })} className="w-full bg-surface border border-white/10 rounded-lg px-3 py-3">
            <option value="" disabled>Select patient</option>
            {patients.map((patient) => <option key={patient.id} value={patient.userId}>{patient.firstName} {patient.lastName}</option>)}
          </select>
        </label>
        <label>
          <span className="block text-sm text-on-surface-variant mb-2">Description</span>
          <input required value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-3" />
        </label>
        <label>
          <span className="block text-sm text-on-surface-variant mb-2">Amount</span>
          <input required type="number" min="1" value={formData.amount} onChange={(event) => setFormData({ ...formData, amount: event.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-3" />
        </label>
        <button disabled={status.saving} className="bg-primary text-on-primary px-5 py-3 rounded-lg font-bold flex items-center gap-2 justify-center"><FilePlus size={18} /> Issue</button>
      </form>

      <div className="glass-panel rounded-xl overflow-hidden">
        {status.loading ? <p className="p-6 text-on-surface-variant">Loading invoices...</p> : invoices.length === 0 ? <p className="p-6 text-on-surface-variant">No invoices have been issued yet.</p> : (
          <div className="divide-y divide-white/10">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-bold">{resolvePatientName(patientNames, invoice.patientId)} - ${invoice.totalAmount.toFixed(2)}</p>
                  <p className="text-sm text-on-surface-variant">{invoice.items.map((item) => item.description).join(', ')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">{invoice.status?.name}</span>
                  {invoice.status?.name !== 'PAID' && <button onClick={() => payInvoice(invoice)} className="glass-panel px-3 py-2 rounded-lg flex items-center gap-2"><CreditCard size={16} /> Pay</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPage;
