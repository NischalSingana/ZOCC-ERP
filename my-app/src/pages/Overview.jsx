import { 
  CalendarCheck, 
  FileText, 
  FolderKanban, 
  TrendingUp,
  Calendar,
  Bell
} from 'lucide-react';

const Overview = () => {
  // Mock data - replace with real data from API
  const stats = [
    {
      title: 'Sessions Attended',
      value: '45',
      change: '+12%',
      icon: CalendarCheck,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Submissions Made',
      value: '28',
      change: '+8%',
      icon: FileText,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Projects Joined',
      value: '5',
      change: '+2',
      icon: FolderKanban,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Leaderboard Rank',
      value: '#7',
      change: '↑ 2',
      icon: TrendingUp,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
  ];

  const upcomingSessions = [
    {
      title: 'React Advanced Patterns',
      date: '2024-01-15',
      time: '10:00 AM',
      trainer: 'John Doe',
      type: 'Workshop'
    },
    {
      title: 'Data Structures Bootcamp',
      date: '2024-01-17',
      time: '2:00 PM',
      trainer: 'Jane Smith',
      type: 'Session'
    },
    {
      title: 'Git Workflow Mastery',
      date: '2024-01-20',
      time: '11:00 AM',
      trainer: 'Mike Johnson',
      type: 'Webinar'
    },
  ];

  const announcements = [
    {
      title: 'New Project Proposals Open',
      date: '2 hours ago',
      author: 'Club Admin',
      priority: 'high'
    },
    {
      title: 'Hackathon Registration Starts',
      date: '1 day ago',
      author: 'Event Team',
      priority: 'medium'
    },
    {
      title: 'Weekly Meetup Reminder',
      date: '3 days ago',
      author: 'Coordinator',
      priority: 'low'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="dashboard-card glow-effect">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`${stat.color}`} size={24} />
                </div>
                <span className="text-green-400 text-sm font-medium">{stat.change}</span>
              </div>
              <h3 className="text-sm text-zocc-blue-300 mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Upcoming Sessions & Announcements Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="dashboard-card">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="text-zocc-blue-400" size={24} />
            <h2 className="text-xl font-semibold text-white">Upcoming Sessions</h2>
          </div>
          <div className="space-y-4">
            {upcomingSessions.map((session, idx) => (
              <div 
                key={idx} 
                className="bg-zocc-blue-800/30 rounded-lg p-4 border border-zocc-blue-700/30 hover:border-zocc-blue-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-medium">{session.title}</h3>
                  <span className="text-xs px-2 py-1 bg-zocc-blue-600/50 rounded text-zocc-blue-200">
                    {session.type}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-zocc-blue-300">
                  <span>{session.date}</span>
                  <span>•</span>
                  <span>{session.time}</span>
                </div>
                <p className="text-sm text-zocc-blue-400 mt-2">
                  Trainer: {session.trainer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Announcements */}
        <div className="dashboard-card">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="text-zocc-blue-400" size={24} />
            <h2 className="text-xl font-semibold text-white">Latest Announcements</h2>
          </div>
          <div className="space-y-4">
            {announcements.map((announcement, idx) => {
              const priorityColors = {
                high: 'border-l-red-500 bg-red-500/10',
                medium: 'border-l-yellow-500 bg-yellow-500/10',
                low: 'border-l-blue-500 bg-blue-500/10'
              };
              return (
                <div 
                  key={idx} 
                  className={`border-l-4 rounded-lg p-4 ${priorityColors[announcement.priority]} bg-zocc-blue-800/30 hover:bg-zocc-blue-800/50 transition-all cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-medium">{announcement.title}</h3>
                    <span className="text-xs px-2 py-1 bg-zocc-blue-600/50 rounded text-zocc-blue-200 uppercase">
                      {announcement.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zocc-blue-300">
                    <span>{announcement.author}</span>
                    <span>•</span>
                    <span>{announcement.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;

