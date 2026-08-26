import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/config';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: 'admin@hospital.com', password: 'replace-with-local-demo-password' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ id: data.id, email: data.email, role: data.role }));
      setLoading(false);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex-1 bg-background flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">PulseCore</h1>
          <p className="text-on-surface-variant">Sign in to your account</p>
        </div>
        <form className="space-y-4" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-lg border border-error bg-error/10 p-3 text-sm text-error">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
            <input type="email" required className="w-full bg-surface-container-high border border-outline-variant rounded-lg p-3 text-on-surface focus:border-primary focus:outline-none" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Password</label>
            <input type="password" required className="w-full bg-surface-container-high border border-outline-variant rounded-lg p-3 text-on-surface focus:border-primary focus:outline-none" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg mt-6 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
