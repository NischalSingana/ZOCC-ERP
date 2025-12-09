import { useState, useEffect } from 'react';
import {
  CalendarCheck,
  FileText,
  FolderKanban,
  TrendingUp,
  Calendar,
  Bell
} from 'lucide-react';
import { API_URL } from '../utils/apiUrl';

const Overview = () => {
  const [stats, setStats] = useState({
    sessionsAttended: 0,
    submissionsMade: 0,
    tasksCompleted: 0,
    attendancePercentage: 0
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
      const allAttendance = attendanceData.attendance || [];
      const presentCount = allAttendance.filter(a => a.status?.toLowerCase() === 'present').length || 0;
      const totalSessions = allAttendance.length || 0;
      const attendancePercentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

      // Fetch submissions data
      const submissionsRes = await fetch(`${API_URL}/api/submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const submissionsData = submissionsRes.ok ? await submissionsRes.json() : { submissions: [] };
      const submissionsCount = submissionsData.submissions?.length || 0;

      // Fetch tasks data
      let tasksCompletedCount = 0;
      try {
        const tasksRes = await fetch(`${API_URL}/api/tasks`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const allTasks = tasksData.tasks || tasksData.data || [];
          tasksCompletedCount = allTasks.filter(task => task.status?.toLowerCase() === 'completed').length || 0;
        }
      } catch (error) {
        console.log('Tasks endpoint not available');
      }

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
          if (!session.date) return false;
          const sessionDate = new Date(session.date);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate >= today;
        })
        .sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          return dateA - dateB;
        })
        .slice(0, 3)
        .map(session => {
          const startTime = session.startTime
            ? new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : null;
          const endTime = session.endTime
            ? new Date(session.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : null;
          const timeDisplay = startTime && endTime
            ? `${startTime} - ${endTime}`
            : startTime
              ? startTime
              : 'TBA';

          return {
            title: session.title || 'Untitled Session',
            date: session.date,
            time: timeDisplay,
            trainer: session.trainer || 'TBA',
            type: 'Session'
          };
        });

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
      } catch {
        console.log('Announcements endpoint not available');
        setAnnouncements([]);
      }

      setStats({
        sessionsAttended: presentCount,
        submissionsMade: submissionsCount,
        tasksCompleted: tasksCompletedCount,
        attendancePercentage: attendancePercentage
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
      title: 'Tasks Completed',
      value: stats.tasksCompleted.toString(),
      change: '',
      icon: FolderKanban,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Attendance',
      value: `${stats.attendancePercentage}%`,
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
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8 text-zocc-blue-300">
              No upcoming sessions scheduled.
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session, idx) => (
                <div
                  key={idx}
                  className="bg-zocc-blue-800/50 rounded-lg p-4 border border-zocc-blue-700 hover:border-zocc-blue-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-medium">{session.title}</h3>
                    <span className="text-xs px-2 py-1 bg-zocc-blue-900/50 text-zocc-blue-300 rounded font-medium">
                      {session.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-zocc-blue-300">
                    <span>{session.date ? new Date(session.date).toLocaleDateString() : 'TBA'}</span>
                    <span>•</span>
                    <span>{session.time}</span>
                  </div>
                  <p className="text-sm text-zocc-blue-400 mt-2">
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
                // Extract createdBy name safely
                const createdBy = announcement.createdBy;
                let authorName = 'Admin';
                if (createdBy) {
                  if (typeof createdBy === 'string') {
                    authorName = createdBy;
                  } else if (typeof createdBy === 'object') {
                    authorName = createdBy.studentFullName || createdBy.name || createdBy.email || 'Admin';
                  }
                }

                return (
                  <div
                    key={announcement.id || announcement._id || idx}
                    className="border-l-4 border-l-zocc-blue-500 bg-zocc-blue-500/10 rounded-lg p-4 hover:bg-zocc-blue-500/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-medium">{announcement.title || 'Announcement'}</h3>
                      {announcement.published && (
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded uppercase font-medium">
                          Published
                        </span>
                      )}
                    </div>
                    <p className="text-zocc-blue-300 text-sm mb-2 line-clamp-2">
                      {announcement.content || announcement.message || ''}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-zocc-blue-400">
                      <span>{authorName}</span>
                      <span>•</span>
                      <span>
                        {announcement.createdAt || announcement.publishedAt
                          ? new Date(announcement.createdAt || announcement.publishedAt).toLocaleDateString()
                          : 'Recently'}
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
