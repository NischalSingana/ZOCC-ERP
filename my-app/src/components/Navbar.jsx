import { useState, useEffect, useRef } from 'react';
import { Bell, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../utils/apiUrl';

const Navbar = ({ onMenuClick, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  const userName = user?.studentFullName || user?.email || 'User';

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  // Fetch real notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setNotificationsLoading(true);
        const token = localStorage.getItem('authToken');

        // Fetch recent announcements, sessions, and tasks in parallel
        const [announcementsRes, sessionsRes, tasksRes] = await Promise.all([
          fetch(`${API_URL}/api/announcements`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/sessions`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const notificationsList = [];

        // Process announcements
        if (announcementsRes.ok) {
          const data = await announcementsRes.json();
          const recentAnnouncements = (data.announcements || []).slice(0, 3);
          recentAnnouncements.forEach(announcement => {
            const createdDate = new Date(announcement.createdAt);
            const now = new Date();
            const diffHours = Math.floor((now - createdDate) / (1000 * 60 * 60));

            notificationsList.push({
              id: `announcement-${announcement._id}`,
              title: 'New Announcement',
              message: announcement.title,
              time: diffHours < 24 ? `${diffHours} hours ago` : `${Math.floor(diffHours / 24)} days ago`,
              read: false,
              type: 'announcement'
            });
          });
        }

        // Process upcoming sessions
        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          const upcomingSessions = (data.sessions || [])
            .filter(session => new Date(session.date) > new Date())
            .slice(0, 2);

          upcomingSessions.forEach(session => {
            const sessionDate = new Date(session.date);
            const now = new Date();
            const diffDays = Math.ceil((sessionDate - now) / (1000 * 60 * 60 * 24));

            notificationsList.push({
              id: `session-${session._id}`,
              title: 'Upcoming Session',
              message: `${session.title} - ${diffDays} day${diffDays > 1 ? 's' : ''} away`,
              time: `Scheduled for ${sessionDate.toLocaleDateString()}`,
              read: false,
              type: 'session'
            });
          });
        }

        // Process pending tasks
        if (tasksRes.ok) {
          const data = await tasksRes.json();
          const pendingTasks = (data.tasks || [])
            .filter(task => task.status !== 'completed')
            .slice(0, 2);

          pendingTasks.forEach(task => {
            const dueDate = new Date(task.dueDate);
            const now = new Date();
            const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

            notificationsList.push({
              id: `task-${task._id}`,
              title: 'Pending Task',
              message: task.title,
              time: diffDays > 0 ? `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}` : 'Overdue',
              read: false,
              type: 'task'
            });
          });
        }

        // Sort by most recent
        setNotifications(notificationsList.slice(0, 5));
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    };

    if (user) {
      fetchNotifications();
      // Refresh notifications every 5 minutes
      const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification) => {
    // Navigate based on notification type
    if (notification.type === 'announcement') {
      navigate('/dashboard/announcements');
    } else if (notification.type === 'submission') {
      navigate('/dashboard/submissions');
    } else if (notification.type === 'session') {
      navigate('/dashboard/sessions');
    } else if (notification.type === 'task') {
      navigate('/dashboard/tasks');
    }
    setShowNotifications(false);
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  return (
    <header className="bg-primary-900 border-b border-primary-800 shadow-sm p-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-primary-800 transition-colors text-primary-300 hover:text-white flex-shrink-0"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg md:text-xl font-semibold text-white truncate">
            Welcome back, {userName.split(' ')[0]} 👋
          </h2>
          <p className="text-xs md:text-sm text-primary-400 hidden sm:block">Ready to code and innovate!</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-primary-800 transition-colors text-primary-300 hover:text-white"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-primary-900 rounded-lg shadow-xl border border-primary-800 overflow-hidden z-50">
              <div className="p-4 border-b border-primary-800">
                <h3 className="text-white font-semibold flex items-center justify-between">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-primary-400">
                    <Bell size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 border-b border-primary-800 cursor-pointer hover:bg-primary-800 transition-colors ${!notification.read ? 'bg-zocc-blue-900/30' : ''
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-primary-300 text-xs mb-2">
                            {notification.message}
                          </p>
                          <p className="text-primary-400 text-xs">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-zocc-blue-400 rounded-full mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && unreadCount > 0 && (
                <div className="p-3 border-t border-primary-800 text-center">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-zocc-blue-400 hover:text-zocc-blue-300 transition-colors"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-primary-800 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zocc-blue-500 to-zocc-blue-600 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              {user?.photo ? (
                <img
                  src={user.photo}
                  alt={userName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <ChevronDown
              size={16}
              className={`text-primary-300 transition-transform ${showProfileMenu ? 'rotate-180' : ''
                }`}
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-primary-900 rounded-lg shadow-xl border border-primary-800 overflow-hidden z-50">
              <div className="p-4 border-b border-primary-800">
                <p className="text-white font-semibold">{userName}</p>
                <p className="text-primary-400 text-sm truncate">{user?.email}</p>
                {user?.role && (
                  <span className="inline-block mt-2 px-2 py-1 bg-zocc-blue-900/50 text-zocc-blue-300 rounded text-xs font-medium">
                    {user.role}
                  </span>
                )}
              </div>
              <div className="py-2">
                <button
                  onClick={() => {
                    navigate('/dashboard/profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left text-primary-200 hover:bg-primary-800 transition-colors"
                >
                  <User size={18} />
                  <span>Profile</span>
                </button>
              </div>
              <div className="border-t border-primary-800 py-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

