import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/config';

const PatientHistory = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    const loadHistory = async () => {
      setStatus({ loading: true, error: '' });
      try {
        const [profileRes, appointmentsRes, labsRes, prescriptionsRes, invoicesRes] = await Promise.all([
          api.get(`/patients/${id}`),
          api.get('/appointments', { params: { patientId: id } }),
          api.get('/lab/orders', { params: { patientId: id } }),
          api.get('/pharmacy/prescriptions', { params: { patientId: id } }),
          api.get('/billing/invoices', { params: { patientId: id } })
        ]);

        setProfile(profileRes.data);
        const timeline = [
          ...(appointmentsRes.data || []).map((item) => ({ id: item.id, type: 'Appointment', title: item.reasonForVisit, date: item.date, meta: `${item.timeSlot} - ${item.status?.name}` })),
          ...(labsRes.data || []).map((item) => ({ id: item.id, type: 'Lab', title: item.testName, date: item.createdAt, meta: `${item.status?.name}${item.result ? ` - ${item.result}` : ''}` })),
          ...(prescriptionsRes.data || []).map((item) => ({ id: item.id, type: 'Prescription', title: item.medications?.map((med) => med.inventory?.medicineName).join(', ') || 'Medication', date: item.createdAt, meta: item.status?.name })),
          ...(invoicesRes.data || []).map((item) => ({ id: item.id, type: 'Invoice', title: `$${item.totalAmount.toFixed(2)}`, date: item.createdAt, meta: item.status?.name })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date));
        setEvents(timeline);
      } catch (error) {
        setStatus({ loading: false, error: error.response?.data?.message || 'Unable to load patient history' });
        return;
      }
      setStatus({ loading: false, error: '' });
    };

    loadHistory();
  }, [id]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Patient Medical History</h2>
        <p className="text-on-surface-variant">{profile ? `${profile.firstName} ${profile.lastName} - ${profile.userId}` : id}</p>
      </div>

      {status.error && <div className="rounded-lg border border-error bg-error/10 p-4 text-error">{status.error}</div>}

      <div className="glass-panel rounded-xl overflow-hidden">
        {status.loading ? <p className="p-6 text-on-surface-variant">Loading patient history...</p> : events.length === 0 ? <p className="p-6 text-on-surface-variant">No clinical, pharmacy, appointment, or billing events found.</p> : (
          <div className="divide-y divide-white/10">
            {events.map((event) => (
              <div key={`${event.type}-${event.id}`} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-bold">{event.type}: {event.title}</p>
                  <span className="text-sm text-on-surface-variant">{new Date(event.date).toLocaleString()}</span>
                </div>
                <p className="text-sm text-on-surface-variant mt-1">{event.meta}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientHistory;
