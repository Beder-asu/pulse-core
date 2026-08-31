const getDoctorLabel = (doctorName) => {
  const normalizedName = doctorName?.trim().replace(/^dr\.?\s+/i, '');
  return normalizedName ? `Dr. ${normalizedName}` : 'your doctor';
};

const formatAppointmentMessage = ({ patientName, doctorName, date, timeSlot }) => (
  `Appointment for ${patientName?.trim() || 'the patient'} with ${getDoctorLabel(doctorName)} on ${date} at ${timeSlot} is confirmed.`
);

module.exports = { getDoctorLabel, formatAppointmentMessage };
