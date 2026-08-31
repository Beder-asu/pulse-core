import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, RefreshCw } from 'lucide-react';
import api from '../api/config';
import { hasRole } from '../auth/roles';
import { buildDoctorNameMap, buildPatientNameMap, resolveDoctorName, resolvePatientName } from '../utils/identity';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [patientNames, setPatientNames] = useState(new Map());
  const [doctorNames, setDoctorNames] = useState(new Map());
  const [status, setStatus] = useState({ loading: true, error: '' });

  const loadAppointments = async () => {
    setStatus({ loading: true, error: '' });
    try {
      const [appointmentsRes, patientsRes, doctorsRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/patients'),
        api.get('/doctors')
      ]);
      setAppointments(appointmentsRes.data || []);
      setPatientNames(buildPatientNameMap(patientsRes.data));
      setDoctorNames(buildDoctorNameMap(doctorsRes.data));
    } catch (error) {
      setStatus({ loading: false, error: error.response?.data?.message || 'Unable to load appointments' });
      return;
    }
    setStatus({ loading: false, error: '' });
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Appointments</h2>
          <p className="text-on-surface-variant">Live appointment schedule from the appointments service.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadAppointments} className="glass-panel px-4 py-2 rounded-lg flex items-center gap-2"><RefreshCw size={18} /> Refresh</button>
          {hasRole('PATIENT', 'STAFF', 'ADMIN') && <Link to="/appointments/book" className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold flex items-center gap-2"><CalendarPlus size={18} /> Book</Link>}
        </div>
      </div>

      {status.error && <div className="rounded-lg border border-error bg-error/10 p-4 text-error">{status.error}</div>}

      <div className="glass-panel rounded-xl overflow-hidden">
        {status.loading ? (
          <p className="p-6 text-on-surface-variant">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p className="p-6 text-on-surface-variant">No appointments have been booked yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-sm text-on-surface-variant">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Time</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Doctor</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="table-row-hover">
                    <td className="p-4">{new Date(appointment.date).toLocaleDateString()}</td>
                    <td className="p-4">{appointment.timeSlot}</td>
                    <td className="p-4">{resolvePatientName(patientNames, appointment.patientId)}</td>
                    <td className="p-4">{resolveDoctorName(doctorNames, appointment.doctorId)}</td>
                    <td className="p-4">{appointment.reasonForVisit}</td>
                    <td className="p-4"><span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">{appointment.status?.name || 'SCHEDULED'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
