import React from 'react';

const Login = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">PulseCore</h1>
          <p className="text-on-surface-variant">Sign in to your account</p>
        </div>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
            <input type="email" className="w-full bg-surface-container-high border border-outline-variant rounded-lg p-3 text-on-surface focus:border-primary focus:outline-none" defaultValue="staff@hospital.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Password</label>
            <input type="password" className="w-full bg-surface-container-high border border-outline-variant rounded-lg p-3 text-on-surface focus:border-primary focus:outline-none" defaultValue="replace-with-local-demo-password" />
          </div>
          <button type="button" onClick={() => window.location.href = '/'} className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg mt-6 hover:opacity-90 transition-opacity">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
