import React from 'react';
import { UserPlus, FlaskConical, Calendar, Activity, TestTube2, AlertTriangle, CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
  return (
    <div>
      <div className="flex flex-wrap justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-bold text-on-surface mb-2">Staff Dashboard</h2>
          <p className="text-on-surface-variant">Welcome back, Dr. Sarah. Here is your overview for today.</p>
        </div>
        <div className="flex gap-3">
          <button className="glass-panel text-on-surface hover:text-primary px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all hover:scale-105">
            <UserPlus size={20} />
            New Patient
          </button>
          <button className="glass-panel text-on-surface hover:text-primary px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all hover:scale-105">
            <FlaskConical size={20} />
            Order Labs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Calendar} title="Today's Appointments" value="12" subtitle="+2 from yesterday" />
        <StatCard icon={Activity} title="Active Visits" value="4" subtitle="Currently in progress" />
        <StatCard icon={TestTube2} title="Pending Lab Orders" value="8" subtitle="3 critical" alert />
        <StatCard icon={AlertTriangle} title="Low Stock Items" value="5" subtitle="Requires attention" alert />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Today's Schedule</h3>
          <div className="space-y-4">
            <ScheduleItem time="09:00 AM" patient="John Doe" reason="Annual Checkup" status="checked_in" />
            <ScheduleItem time="09:30 AM" patient="Jane Smith" reason="Follow-up" status="scheduled" />
            <ScheduleItem time="10:00 AM" patient="Robert Johnson" reason="Blood Pressure Monitor" status="completed" />
          </div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Recent Notifications</h3>
          <div className="space-y-4">
            <NotificationItem text="Lab results ready for John Doe" time="10 min ago" />
            <NotificationItem text="New appointment booked by Jane Smith" time="1 hour ago" />
            <NotificationItem text="Low stock alert: Amoxicillin" time="2 hours ago" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, subtitle, alert }) => (
  <div className="glass-panel rounded-xl p-6 transition-all duration-200 hover:scale-[1.02]">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${alert ? 'bg-error/20 text-error' : 'bg-primary/20 text-primary'}`}>
        <Icon size={20} />
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
        {subtitle}
      </span>
    </div>
    <div>
      <div className="text-4xl font-bold text-on-surface mb-1">{value}</div>
      <div className="text-sm text-on-surface-variant">{title}</div>
    </div>
  </div>
);

const ScheduleItem = ({ time, patient, reason, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'checked_in': return 'text-secondary bg-secondary/10 border-secondary';
      case 'scheduled': return 'text-primary bg-primary/10 border-primary';
      case 'completed': return 'text-green-400 bg-green-400/10 border-green-400';
      default: return 'text-on-surface-variant';
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
      <div className="text-primary font-bold min-w-[80px]">{time}</div>
      <div className="flex-1">
        <div className="font-bold text-on-surface">{patient}</div>
        <div className="text-sm text-on-surface-variant">{reason}</div>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor()} capitalize`}>
        {status.replace('_', ' ')}
      </div>
    </div>
  );
};

const NotificationItem = ({ text, time }) => (
  <div className="flex gap-3 items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
    <div className="mt-1"><CheckCircle2 size={16} className="text-primary" /></div>
    <div>
      <p className="text-sm text-on-surface">{text}</p>
      <p className="text-xs text-on-surface-variant mt-1">{time}</p>
    </div>
  </div>
);

export default Dashboard;
