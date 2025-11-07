import { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { API_URL } from '../utils/apiUrl';

const Attendance = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [attendanceData, setAttendanceData] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/attendance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentSessions(data.attendance || []);
        
        // Process attendance data for charts
        const processedData = processAttendanceData(data.attendance || []);
        setAttendanceData(processedData);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAttendanceData = (sessions) => {
    // Group by month
    const monthlyData = {};
    sessions.forEach(session => {
      const month = session.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { date: month, present: 0, absent: 0 };
      }
      if (session.status === 'present') {
        monthlyData[month].present++;
      } else {
        monthlyData[month].absent++;
      }
    });
    
    return Object.values(monthlyData).sort((a, b) => a.date.localeCompare(b.date));
  };

  const totalSessions = recentSessions.length;
  const presentCount = recentSessions.filter(s => s.status === 'present').length;
  const attendanceRate = totalSessions > 0 ? ((presentCount / totalSessions) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zocc-blue-300">Loading attendance data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="dashboard-card">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <span className="text-green-400 text-sm font-medium">+5%</span>
          </div>
          <h3 className="text-sm text-zocc-blue-300 mb-1">Total Present</h3>
          <p className="text-3xl font-bold text-white">{presentCount}</p>
        </div>

        <div className="dashboard-card">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-red-500/10">
              <XCircle className="text-red-400" size={24} />
            </div>
            <span className="text-red-400 text-sm font-medium">-12%</span>
          </div>
          <h3 className="text-sm text-zocc-blue-300 mb-1">Total Absent</h3>
          <p className="text-3xl font-bold text-white">{totalSessions - presentCount}</p>
        </div>

        <div className="dashboard-card">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <TrendingUp className="text-blue-400" size={24} />
            </div>
            <span className="text-green-400 text-sm font-medium">+8%</span>
          </div>
          <h3 className="text-sm text-zocc-blue-300 mb-1">Attendance Rate</h3>
          <p className="text-3xl font-bold text-white">{attendanceRate}%</p>
        </div>
      </div>

      {/* Chart */}
      {attendanceData.length > 0 && (
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CalendarCheck className="text-zocc-blue-400" size={24} />
              <h2 className="text-xl font-semibold text-white">Attendance Trend</h2>
            </div>
            <div className="flex gap-2">
              {['week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === period
                      ? 'bg-zocc-blue-600 text-white'
                      : 'bg-zocc-blue-800/30 text-zocc-blue-300 hover:bg-zocc-blue-800/50'
                  }`}
                >
                  {period.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="date" stroke="#93c5fd" />
              <YAxis stroke="#93c5fd" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0b2447', 
                  border: '1px solid #1e4d8b',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="Present" />
              <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} name="Absent" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Sessions Table */}
      <div className="dashboard-card">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="text-zocc-blue-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Recent Sessions</h2>
        </div>
        {recentSessions.length === 0 ? (
          <div className="text-center py-8 text-zocc-blue-300">
            No attendance records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zocc-blue-700/30">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zocc-blue-300">Session</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zocc-blue-300">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zocc-blue-300">Trainer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zocc-blue-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.slice(0, 10).map((session, idx) => (
                  <tr key={session.sessionId || idx} className="border-b border-zocc-blue-700/10 hover:bg-zocc-blue-800/20 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{session.title}</td>
                    <td className="py-3 px-4 text-zocc-blue-300">
                      {session.date ? new Date(session.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-zocc-blue-300">{session.trainer || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        session.status === 'present'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : session.status === 'late'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : session.status === 'excused'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {session.status === 'present' ? (
                          <CheckCircle size={14} />
                        ) : (
                          <XCircle size={14} />
                        )}
                        {session.status?.toUpperCase() || 'ABSENT'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
