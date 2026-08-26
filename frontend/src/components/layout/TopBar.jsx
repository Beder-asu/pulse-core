import React from 'react';
import { Search, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopBar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (user.email || 'User').slice(0, 2).toUpperCase();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="h-[64px] border-b border-outline-variant bg-surface/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
          <input
            type="text"
            placeholder="Search patients, doctors, or ID..."
            className="w-full bg-surface-container-high border border-outline-variant rounded-full py-2 pl-10 pr-4 text-on-surface focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors" aria-label="Notifications">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
          <div className="text-right hidden sm:block">
            <p className="font-title-md text-title-md text-on-surface">{user.email || 'Signed in user'}</p>
            <p className="font-label-md text-label-md text-primary">{user.role || 'Signed in'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container font-bold">
            {initials}
          </div>
          <button onClick={logout} className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors" aria-label="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
