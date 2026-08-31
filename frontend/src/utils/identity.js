const compactName = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim();

const buildNameMap = (records, formatName) => {
  const names = new Map();

  for (const record of records || []) {
    const name = formatName(record);
    if (!name) continue;
    if (record.id) names.set(record.id, name);
    if (record.userId) names.set(record.userId, name);
  }

  return names;
};

const buildPatientNameMap = (patients) => buildNameMap(patients, compactName);

const buildDoctorNameMap = (doctors) => buildNameMap(doctors, (doctor) => {
  const name = compactName(doctor);
  return name ? `Dr. ${name}` : '';
});

const resolvePatientName = (names, identifier) => names.get(identifier) || 'Unknown patient';
const resolveDoctorName = (names, identifier) => names.get(identifier) || 'Unknown doctor';

export {
  buildPatientNameMap,
  buildDoctorNameMap,
  resolvePatientName,
  resolveDoctorName
};
