import axios from 'axios';

// The API Gateway sits at http://localhost (port 80)
// We proxy everything through the /api/ prefix
const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

let refreshRequest = null;

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * A single shared refresh promise prevents concurrent 401 responses from
 * rotating the one-time refresh cookie more than once. The original request is
 * retried exactly once with the replacement access token.
 */
api.interceptors.response.use((response) => response, async (error) => {
  const request = error.config;
  const isAuthLifecycleRequest = request?.url?.startsWith('/auth/');
  if (error.response?.status !== 401 || request?._retry || isAuthLifecycleRequest) {
    return Promise.reject(error);
  }

  request._retry = true;
  try {
    refreshRequest ||= axios.post('/api/auth/refresh', {}, { withCredentials: true, timeout: 5000 });
    const { data } = await refreshRequest;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ id: data.id, email: data.email, role: data.role }));
    request.headers.Authorization = `Bearer ${data.token}`;
    return api(request);
  } catch (refreshError) {
    clearSession();
    if (window.location.pathname !== '/login') window.location.href = '/login';
    return Promise.reject(refreshError);
  } finally {
    refreshRequest = null;
  }
});

export default api;
export { clearSession };
