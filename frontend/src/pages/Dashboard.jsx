import React, { useState, useEffect } from 'react';
import { UserPlus, FlaskConical, Calendar, Activity, TestTube2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/config';
import { getCurrentUser, hasRole } from '../auth/roles';
import { buildPatientNameMap, resolvePatientName } from '../utils/identity';

// Threshold for low stock warnings
const LOW_STOCK_THRESHOLD = 20;

const Dashboard = () => {
  const role = getCurrentUser()?.role || 'USER';
  const [appointments, setAppointments] = useState([]);
  const [patientNames, setPatientNames] = useState(new Map());
  const [notifications, setNotifications] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [pendingLabCount, setPendingLabCount] = useState(0);
  const [activeVisitCount, setActiveVisitCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [appointmentsRes, notificationsRes, inventoryRes, labRes, patientsRes] = await Promise.all([
          api.get('/appointments'),
          api.get('/notifications').catch(() => ({ data: [] })),
          hasRole('DOCTOR', 'STAFF', 'ADMIN') ? api.get('/pharmacy/inventory') : Promise.resolve({ data: [] }),
          api.get('/lab/orders').catch(() => ({ data: [] })),
          api.get('/patients').catch(() => ({ data: [] }))
        ]);

        const allAppointments = appointmentsRes.data || [];

        // Filter appointments for today
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysAppointments = allAppointments.filter(app => {
          if (!app.date) return false;
          // Handle both ISO strings and local strings
          return app.date.startsWith(todayStr) || new Date(app.date).toDateString() === new Date().toDateString();
        });

        setAppointments(todaysAppointments);
        setPatientNames(buildPatientNameMap(patientsRes.data));
        setActiveVisitCount(todaysAppointments.filter(app => ['SCHEDULED', 'CHECKED_IN'].includes(app.status?.name)).length);

        // Notifications might have 'content' or 'message' field depending on prisma schema
        setNotifications((notificationsRes.data || []).slice(0, 5));

        // Calculate low stock items
        const inventory = inventoryRes.data || [];
        const lowStock = inventory.filter(item => item.stockQuantity < (item.reorderLevel || LOW_STOCK_THRESHOLD));
        setLowStockCount(lowStock.length);
        setPendingLabCount((labRes.data || []).filter(order => order.status?.name === 'PENDING').length);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(error.response?.data?.message || 'Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const navigate = useNavigate();

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-bold text-on-surface mb-2">{role.charAt(0) + role.slice(1).toLowerCase()} Dashboard</h2>
          <p className="text-on-surface-variant">Your role-scoped overview for today.</p>
        </div>
        <div className="flex gap-3">
          {hasRole('STAFF', 'ADMIN') && <button
            onClick={() => navigate('/patients')}
            className="glass-panel text-on-surface hover:text-primary px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all hover:scale-105"
          >
            <UserPlus size={20} />
            New Patient
          </button>}
          {hasRole('DOCTOR', 'ADMIN') && <button
            onClick={() => navigate('/lab')}
            className="glass-panel text-on-surface hover:text-primary px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all hover:scale-105"
          >
            <FlaskConical size={20} />
            Order Labs
          </button>}
        </div>
      </div>

      {error && <div className="mb-6 rounded-lg border border-error bg-error/10 p-4 text-error">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Calendar} title="Today's Appointments" value={appointments.length.toString()} subtitle="Live from DB" />
        <StatCard icon={Activity} title="Active Visits" value={activeVisitCount.toString()} subtitle="Today" />
        <StatCard icon={TestTube2} title="Pending Lab Orders" value={pendingLabCount.toString()} subtitle="Live from DB" alert={pendingLabCount > 0} />
        {hasRole('DOCTOR', 'STAFF', 'ADMIN') && <StatCard icon={AlertTriangle} title="Low Stock Items" value={lowStockCount.toString()} subtitle={lowStockCount > 0 ? "Requires attention" : "Stock healthy"} alert={lowStockCount > 0} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Today's Schedule</h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-on-surface-variant">Loading appointments from backend...</p>
            ) : appointments.length > 0 ? (
              appointments.map(app => (
                <ScheduleItem
                  key={app.id}
                  time={app.timeSlot}
                  patient={resolvePatientName(patientNames, app.patientId)}
                  reason={app.reasonForVisit}
                  status={app.status?.name?.toLowerCase() || 'scheduled'}
                />
              ))
            ) : (
              <p className="text-on-surface-variant">No appointments scheduled for today.</p>
            )}
          </div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Recent Notifications</h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-on-surface-variant">Loading...</p>
            ) : notifications.length > 0 ? (
              notifications.map((notif, idx) => (
                <NotificationItem
                  key={notif.id || idx}
                  text={notif.content || notif.message || 'Notification received'}
                  time={new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                />
              ))
            ) : (
              <p className="text-on-surface-variant">No new notifications.</p>
            )}
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
