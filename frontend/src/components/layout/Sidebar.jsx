import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, TestTube2, Pill, FileText, Activity } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Patients', path: '/patients' },
    { icon: Calendar, label: 'Appointments', path: '/appointments' },
    { icon: TestTube2, label: 'Laboratory', path: '/lab' },
    { icon: Pill, label: 'Pharmacy', path: '/pharmacy' },
    { icon: FileText, label: 'Billing', path: '/billing' },
    { icon: Activity, label: 'Clinical', path: '/clinical' },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-[280px] border-r border-outline-variant bg-surface/60 backdrop-blur-xl flex flex-col z-50">
      <div className="p-6 flex items-center gap-4 border-b border-outline-variant/50">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Activity className="text-primary" size={20} />
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary truncate">PulseCore</h1>
          <p className="font-label-md text-label-md text-on-surface-variant truncate">Medical System</p>
        </div>
      </div>
      
      <div className="px-4 py-6">
        <button className="w-full bg-primary text-on-primary py-3 px-4 rounded-lg font-title-md text-title-md hover:scale-[1.02] transition-transform duration-200 flex items-center justify-center gap-2">
          <span>+ New Admission</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                isActive
                  ? 'bg-secondary-container/10 text-secondary border-l-4 border-secondary'
                  : 'text-on-surface-variant hover:bg-white/5 hover:scale-[0.98]'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Sidebar;
