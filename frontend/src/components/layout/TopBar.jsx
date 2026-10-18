import React, { useEffect, useRef, useState } from 'react';
import { Search, Bell, LogOut, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { clearSession } from '../../api/config';

const TopBar = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const notificationsRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (user.email || 'User').slice(0, 2).toUpperCase();
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data || []);
      setNotificationsError('');
    } catch (error) {
      setNotificationsError(error.response?.data?.message || 'Unable to load notifications');
    }
  };

  useEffect(() => {
    loadNotifications();
    const refreshTimer = setInterval(loadNotifications, 30000);
    return () => clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const { data } = await api.put(`/notifications/${notificationId}/read`);
      setNotifications((current) => current.map((notification) => (
        notification.id === notificationId ? data : notification
      )));
    } catch (error) {
      setNotificationsError(error.response?.data?.message || 'Unable to update notification');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearSession();
      navigate('/login');
    }
  };

  return (
    <header className="h-[64px] border-b border-outline-variant bg-surface/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
          <input
            type="text"
            placeholder="Search patients or doctors..."
            className="w-full bg-surface-container-high border border-outline-variant rounded-full py-2 pl-10 pr-4 text-on-surface focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden lg:inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Synthetic demo data
        </span>
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              loadNotifications();
            }}
            className="relative p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={notificationsOpen}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-[min(24rem,calc(100vw-2rem))] max-h-[28rem] overflow-y-auto bg-surface-container-high border border-outline-variant rounded-lg shadow-2xl z-50">
              <div className="sticky top-0 bg-surface-container-high border-b border-outline-variant px-4 py-3">
                <h2 className="font-bold text-on-surface">Notifications</h2>
                <p className="text-xs text-on-surface-variant">{unreadCount} unread</p>
              </div>
              {notificationsError ? (
                <p className="p-4 text-sm text-error">{notificationsError}</p>
              ) : notifications.length === 0 ? (
                <p className="p-6 text-sm text-center text-on-surface-variant">No notifications yet.</p>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className={`p-4 border-b border-outline-variant/50 last:border-0 ${notification.isRead ? '' : 'bg-primary/5'}`}>
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-on-surface">{notification.title}</p>
                        <p className="mt-1 text-sm text-on-surface-variant">{notification.message}</p>
                        <p className="mt-2 text-xs text-on-surface-variant">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notification.id)}
                          className="shrink-0 p-2 text-primary hover:bg-primary/10 rounded-full"
                          aria-label="Mark notification as read"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

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
