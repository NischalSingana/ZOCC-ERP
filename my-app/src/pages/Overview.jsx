import { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  FileText, 
  FolderKanban, 
  TrendingUp,
  Calendar,
  Bell
} from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import { API_URL } from '../utils/apiUrl';

const Overview = () => {
  const [stats, setStats] = useState({
    sessionsAttended: 0,
    submissionsMade: 0,
    projectsJoined: 0,
    leaderboardRank: null
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Fetch attendance data
      const attendanceRes = await fetch(`${API_URL}/api/attendance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const attendanceData = attendanceRes.ok ? await attendanceRes.json() : { attendance: [] };
      const presentCount = attendanceData.attendance?.filter(a => a.status?.toLowerCase() === 'present').length || 0;
      
      // Fetch submissions data
      const submissionsRes = await fetch(`${API_URL}/api/submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const submissionsData = submissionsRes.ok ? await submissionsRes.json() : { submissions: [] };
      const submissionsCount = submissionsData.submissions?.length || 0;
      
      // Fetch sessions data
      const sessionsRes = await fetch(`${API_URL}/api/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const sessionsData = sessionsRes.ok ? await sessionsRes.json() : { sessions: [] };
      const allSessions = sessionsData.sessions || [];
      
      // Get upcoming sessions (future dates)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = allSessions
        .filter(session => {
          const sessionDate = new Date(session.date);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate >= today;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3)
        .map(session => ({
          title: session.title,
          date: session.date,
          time: session.time || 'TBA',
          trainer: session.trainer || 'TBA',
          type: 'Session'
        }));
      
      // Fetch announcements if endpoint exists
      try {
        const announcementsRes = await fetch(`${API_URL}/api/announcements`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (announcementsRes.ok) {
          const announcementsData = await announcementsRes.json();
          setAnnouncements(announcementsData.announcements || announcementsData.data || []);
        }
      } catch (error) {
        console.log('Announcements endpoint not available');
        setAnnouncements([]);
      }
      
      setStats({
        sessionsAttended: presentCount,
        submissionsMade: submissionsCount,
        projectsJoined: 0, // Projects feature not implemented yet
        leaderboardRank: null // Leaderboard feature not implemented yet
      });
      
      setUpcomingSessions(upcoming);
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      title: 'Sessions Attended',
      value: stats.sessionsAttended.toString(),
      change: '',
      icon: CalendarCheck,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Submissions Made',
      value: stats.submissionsMade.toString(),
      change: '',
      icon: FileText,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Projects Joined',
      value: stats.projectsJoined.toString(),
      change: '',
      icon: FolderKanban,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Leaderboard Rank',
      value: stats.leaderboardRank ? `#${stats.leaderboardRank}` : 'N/A',
      change: '',
      icon: TrendingUp,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-zocc-blue-300">Loading overview data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="dashboard-card glow-effect">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`${stat.color}`} size={24} />
                </div>
                {stat.change && (
                  <span className="text-green-400 text-sm font-medium">{stat.change}</span>
                )}
              </div>
              <h3 className="text-sm text-primary-400 mb-1">{stat.title}</h3>
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
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8 text-zocc-blue-300">
              No upcoming sessions scheduled.
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session, idx) => (
                <div 
                  key={idx} 
                  className="bg-primary-800/50 rounded-lg p-4 border border-primary-700 hover:border-zocc-blue-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-medium">{session.title}</h3>
                    <span className="text-xs px-2 py-1 bg-zocc-blue-900/50 text-zocc-blue-300 rounded font-medium">
                      {session.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-primary-300">
                    <span>{session.date ? new Date(session.date).toLocaleDateString() : 'TBA'}</span>
                    <span>•</span>
                    <span>{session.time}</span>
                  </div>
                  <p className="text-sm text-primary-400 mt-2">
                    Trainer: {session.trainer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Announcements */}
        <div className="dashboard-card">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="text-zocc-blue-400" size={24} />
            <h2 className="text-xl font-semibold text-white">Latest Announcements</h2>
          </div>
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-zocc-blue-300">
              No announcements available.
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.slice(0, 3).map((announcement, idx) => {
                const priority = announcement.priority || 'medium';
                const priorityColors = {
                  high: 'border-l-red-500 bg-red-500/10',
                  medium: 'border-l-yellow-500 bg-yellow-500/10',
                  low: 'border-l-blue-500 bg-blue-500/10'
                };
                return (
                  <div 
                    key={idx} 
                    className={`border-l-4 rounded-lg p-4 ${priorityColors[priority]} hover:bg-opacity-20 transition-all cursor-pointer`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-medium">{announcement.title || announcement.message}</h3>
                      <span className="text-xs px-2 py-1 bg-primary-800 text-primary-300 rounded uppercase font-medium">
                        {priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary-400">
                      <span>{announcement.author || announcement.createdBy || 'Admin'}</span>
                      <span>•</span>
                      <span>
                        {announcement.createdAt 
                          ? new Date(announcement.createdAt).toLocaleDateString()
                          : announcement.date || 'Recently'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
