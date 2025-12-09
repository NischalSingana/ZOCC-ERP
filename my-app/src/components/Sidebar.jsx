import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  FileText,
  CheckSquare,
  Megaphone,
  BookOpen,
  User,
  LogOut,
  Users,
  UserCircle,
  Settings,
  MessageSquare,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { logout, isAdmin } = useAuth();

  const studentMenuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: BookOpen, label: 'Sessions', path: '/dashboard/sessions' },
    { icon: CalendarCheck, label: 'Attendance', path: '/dashboard/attendance' },
    { icon: FileText, label: 'Submissions', path: '/dashboard/submissions' },
    { icon: CheckSquare, label: 'Tasks', path: '/dashboard/tasks' },
    { icon: Megaphone, label: 'Announcements', path: '/dashboard/announcements' },
    { icon: MessageSquare, label: 'Queries', path: '/dashboard/queries' },
    { icon: User, label: 'Profile', path: '/dashboard/profile' },
    { icon: HelpCircle, label: 'Contact', path: '/dashboard/contact' },
  ];

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: Clock, label: 'Account Approvals', path: '/dashboard/admin/account-approvals' },
    { icon: Users, label: 'Registered Students', path: '/dashboard/admin/students' },
    { icon: UserCircle, label: 'Student Details', path: '/dashboard/admin/student-details' },
    { icon: CalendarCheck, label: 'Attendance Marking', path: '/dashboard/admin/attendance' },
    { icon: BookOpen, label: 'Session Management', path: '/dashboard/admin/sessions' },
    { icon: FileText, label: 'Submissions Approval', path: '/dashboard/admin/submissions' },
    { icon: Megaphone, label: 'Announcements', path: '/dashboard/admin/announcements' },
    { icon: MessageSquare, label: 'Queries', path: '/dashboard/admin/queries' },
    { icon: CheckSquare, label: 'Task Management', path: '/dashboard/admin/tasks' },
    { icon: User, label: 'Profile', path: '/dashboard/profile' },
    { icon: HelpCircle, label: 'Contact', path: '/dashboard/contact' },
  ];

  const menuItems = isAdmin ? adminMenuItems : studentMenuItems;

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`${isOpen ? 'w-64' : 'w-20'
        } bg-primary-900 border-r border-primary-800 shadow-sm transition-all duration-300 flex flex-col fixed left-0 top-0 h-full z-40 lg:z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
    >
      {/* Logo Section */}
      <div className="p-6 flex items-center justify-between border-b border-primary-800">
        <h1
          className={`text-2xl font-bold text-zocc-blue-400 transition-all duration-300 whitespace-nowrap overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0 w-0'
            }`}
        >
          ZeroOne ERP
        </h1>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-primary-800 transition-colors text-primary-400 hover:text-white"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={idx}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${active
                ? 'text-zocc-blue-400 bg-zocc-blue-900/30 font-medium border-l-2 border-zocc-blue-400'
                : 'text-primary-300 hover:text-zocc-blue-400 hover:bg-primary-800'
                }`}
            >
              <Icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
              <span
                className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0 w-0'
                  }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-primary-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all duration-200 w-full group"
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
          <span
            className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0 w-0'
              }`}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

