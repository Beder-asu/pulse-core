import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, TestTube2 } from 'lucide-react';
import api from '../api/config';

const ClinicalPrecision = () => {
  const [summary, setSummary] = useState({ completedLabs: 0, pendingLabs: 0, lowStock: 0, unpaidInvoices: 0 });
  const [status, setStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [labsRes, inventoryRes, invoicesRes] = await Promise.all([
          api.get('/lab/orders'),
          api.get('/pharmacy/inventory'),
          api.get('/billing/invoices')
        ]);
        const labs = labsRes.data || [];
        const inventory = inventoryRes.data || [];
        const invoices = invoicesRes.data || [];
        setSummary({
          completedLabs: labs.filter((item) => item.status?.name === 'COMPLETED').length,
          pendingLabs: labs.filter((item) => item.status?.name === 'PENDING').length,
          lowStock: inventory.filter((item) => item.stockQuantity < 20).length,
          unpaidInvoices: invoices.filter((item) => item.status?.name !== 'PAID').length,
        });
      } catch (error) {
        setStatus({ loading: false, error: error.response?.data?.message || 'Unable to load clinical summary' });
        return;
      }
      setStatus({ loading: false, error: '' });
    };

    loadSummary();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Clinical Precision</h2>
        <p className="text-on-surface-variant">Operational signals assembled from live service data.</p>
      </div>
      {status.error && <div className="rounded-lg border border-error bg-error/10 p-4 text-error">{status.error}</div>}
      {status.loading ? <p className="glass-panel rounded-xl p-6 text-on-surface-variant">Loading clinical summary...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Metric icon={TestTube2} label="Pending Labs" value={summary.pendingLabs} />
          <Metric icon={CheckCircle2} label="Completed Labs" value={summary.completedLabs} />
          <Metric icon={AlertTriangle} label="Low Stock Alerts" value={summary.lowStock} alert={summary.lowStock > 0} />
          <Metric icon={Activity} label="Unpaid Invoices" value={summary.unpaidInvoices} alert={summary.unpaidInvoices > 0} />
        </div>
      )}
    </div>
  );
};

const Metric = ({ icon: Icon, label, value, alert }) => (
  <div className="glass-panel rounded-xl p-6">
    <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-4 ${alert ? 'bg-error/20 text-error' : 'bg-primary/20 text-primary'}`}>
      <Icon size={20} />
    </div>
    <p className="text-4xl font-bold">{value}</p>
    <p className="text-sm text-on-surface-variant">{label}</p>
  </div>
);

export default ClinicalPrecision;
