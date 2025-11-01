import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  FileText, 
  FolderKanban, 
  Megaphone, 
  Trophy,
  User,
  Menu,
  X,
  LogOut,
  Bell
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  
  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = userData.name || userData.username || 'User';

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: CalendarCheck, label: 'Attendance', path: '/dashboard/attendance' },
    { icon: FileText, label: 'Submissions', path: '/dashboard/submissions' },
    { icon: FolderKanban, label: 'Projects', path: '/dashboard/projects' },
    { icon: Megaphone, label: 'Announcements', path: '/dashboard/announcements' },
    { icon: Trophy, label: 'Leaderboard', path: '/dashboard/leaderboard' },
    { icon: User, label: 'Profile', path: '/dashboard/profile' },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-zocc-blue-900 via-zocc-blue-800 to-zocc-blue-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-zocc-blue-900/80 backdrop-blur-lg border-r border-zocc-blue-700/30 transition-all duration-300 flex flex-col`}>
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-between border-b border-zocc-blue-700/30">
          <h1 className={`text-2xl font-bold bg-gradient-to-r from-white to-zocc-blue-400 bg-clip-text text-transparent transition-all duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'
          }`}>
            ZeroOne ERP
          </h1>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-zocc-blue-800 transition-colors text-zocc-blue-300 hover:text-white"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-zocc-blue-200 hover:text-white hover:bg-zocc-blue-800/50 transition-all duration-200 group"
              >
                <Icon size={20} className="group-hover:scale-110 transition-transform" />
                <span className={`transition-all duration-300 ${
                  sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-zocc-blue-700/30">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all duration-200 w-full group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            <span className={`transition-all duration-300 ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'
            }`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-zocc-blue-900/50 backdrop-blur-lg border-b border-zocc-blue-700/30 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Welcome back, {userName} 👋</h2>
            <p className="text-sm text-zocc-blue-300">Ready to code and innovate!</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-zocc-blue-800 transition-colors text-zocc-blue-300 hover:text-white">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zocc-blue-500 to-zocc-blue-700 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              <span className="text-white font-semibold">{userName.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

