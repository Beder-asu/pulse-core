import React, { useEffect, useState } from 'react';
import { Calendar, Clock, User, FileText, CheckCircle2 } from 'lucide-react';
import api from '../api/config';

const BookAppointment = () => {
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    timeSlot: '',
    reasonForVisit: ''
  });
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: null, success: false, notificationQueued: false });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/doctors')
        ]);
        const nextPatients = patientsRes.data || [];
        const nextDoctors = doctorsRes.data || [];
        setPatients(nextPatients);
        setDoctors(nextDoctors);
        setFormData((current) => ({
          ...current,
          patientId: current.patientId || nextPatients[0]?.userId || '',
          doctorId: current.doctorId || nextDoctors[0]?.userId || ''
        }));
      } catch (error) {
        setStatus({ loading: false, error: error.response?.data?.message || 'Unable to load patients and doctors', success: false, notificationQueued: false });
      }
    };

    loadOptions();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false, notificationQueued: false });

    try {
      const { data } = await api.post('/appointments', formData);
      setStatus({ loading: false, error: null, success: true, notificationQueued: data.notificationQueued === true });
      // Reset form on success
      setFormData({ ...formData, date: '', timeSlot: '', reasonForVisit: '' });
    } catch (error) {
      console.error("Booking error:", error);
      setStatus({
        loading: false,
        error: error.response?.data?.message || 'Failed to book appointment',
        success: false,
        notificationQueued: false
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Book New Appointment</h2>

      {status.success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-center gap-3 text-green-400">
          <CheckCircle2 size={24} />
          <div>
            <p className="font-bold">Appointment Confirmed!</p>
            <p className="text-sm">
              {status.notificationQueued
                ? 'The notification event has been queued.'
                : 'The appointment was saved, but its notification could not be queued.'}
            </p>
          </div>
        </div>
      )}

      {status.error && (
        <div className="mb-6 p-4 bg-error/20 border border-error rounded-lg text-error">
          <p className="font-bold">Booking Failed</p>
          <p className="text-sm">{status.error}</p>
        </div>
      )}

      <div className="glass-panel p-8 rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Patient</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary">
                  <User size={20} />
                </div>
                <select
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleChange}
                  required
                  className="w-full bg-surface border border-white/10 rounded-lg pl-10 pr-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="" disabled>Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.userId}>{patient.firstName} {patient.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Doctor</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary">
                  <User size={20} />
                </div>
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  required
                  className="w-full bg-surface border border-white/10 rounded-lg pl-10 pr-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="" disabled>Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.userId}>Dr. {doctor.firstName} {doctor.lastName} ({doctor.specialization?.name || 'General'})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary">
                  <Calendar size={20} />
                </div>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Time Slot</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary">
                  <Clock size={20} />
                </div>
                <select
                  name="timeSlot"
                  value={formData.timeSlot}
                  onChange={handleChange}
                  required
                  className="w-full bg-surface border border-white/10 rounded-lg pl-10 pr-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none"
                >
                  <option value="" disabled>Select a time slot</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="01:30 PM">01:30 PM</option>
                  <option value="02:00 PM">02:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">Reason for Visit</label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none text-primary">
                <FileText size={20} />
              </div>
              <textarea
                name="reasonForVisit"
                value={formData.reasonForVisit}
                onChange={handleChange}
                required
                rows="4"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="Please describe symptoms or reason for visit..."
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            disabled={status.loading}
            className="w-full bg-primary hover:bg-primary-hover text-on-primary font-bold py-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2"
          >
            {status.loading ? 'Booking...' : 'Confirm Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;
