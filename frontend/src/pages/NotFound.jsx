import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="glass-panel p-12 rounded-2xl max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-error/50 via-error to-error/50"></div>

        <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6 text-error shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <AlertTriangle size={40} />
        </div>

        <h1 className="text-6xl font-bold text-on-surface mb-2 font-mono">404</h1>
        <h2 className="text-2xl font-bold text-error mb-4">Page Not Found</h2>

        <p className="text-on-surface-variant mb-8">
          The module or resource you are looking for does not exist or has been moved.
        </p>

        <button
          onClick={() => navigate('/')}
          className="bg-primary hover:bg-primary-hover text-on-primary font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2 w-full"
        >
          <Home size={20} />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;
