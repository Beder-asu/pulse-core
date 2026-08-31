const parseUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const getCurrentUser = () => parseUser();
const hasRole = (...roles) => roles.includes(getCurrentUser()?.role);

export { getCurrentUser, hasRole };
