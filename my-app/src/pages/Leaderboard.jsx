import { Trophy, Award, Medal, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Leaderboard = () => {
  const leaderboardData = [
    { rank: 1, name: 'Alex Chen', points: 1250, attendance: 50, submissions: 30, trend: 'up' },
    { rank: 2, name: 'Priya Sharma', points: 1180, attendance: 48, submissions: 28, trend: 'up' },
    { rank: 3, name: 'John Martinez', points: 1120, attendance: 46, submissions: 26, trend: 'stable' },
    { rank: 4, name: 'Emma Wilson', points: 1080, attendance: 45, submissions: 25, trend: 'down' },
    { rank: 5, name: 'Michael Liu', points: 1050, attendance: 44, submissions: 24, trend: 'up' },
    { rank: 6, name: 'Sarah Johnson', points: 980, attendance: 42, submissions: 22, trend: 'down' },
    { rank: 7, name: 'David Kim', points: 920, attendance: 41, submissions: 20, trend: 'stable' },
    { rank: 8, name: 'Lisa Thompson', points: 880, attendance: 40, submissions: 19, trend: 'up' },
  ];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-400" size={24} />;
      case 2:
        return <Medal className="text-gray-300" size={24} />;
      case 3:
        return <Award className="text-amber-600" size={24} />;
      default:
        return <span className="text-zocc-blue-400 font-bold text-lg">#{rank}</span>;
    }
  };

  const chartData = leaderboardData.map((entry, idx) => ({
    name: entry.name.split(' ')[0],
    points: entry.points,
  }));

  return (
    <div className="space-y-6">
      {/* Top 3 Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {leaderboardData.slice(0, 3).map((user, idx) => (
          <div
            key={user.rank}
            className={`dashboard-card relative overflow-hidden ${
              idx === 0 ? 'border-2 border-yellow-400' : idx === 1 ? 'border-2 border-gray-300' : 'border-2 border-amber-600'
            }`}
          >
            <div className="absolute top-4 right-4">
              {getRankIcon(user.rank)}
            </div>
            <div className="text-center pt-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zocc-blue-600 to-zocc-blue-700 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{user.name.charAt(0)}</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">{user.name}</h3>
              <p className="text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  {user.points}
                </span>
              </p>
              <p className="text-zocc-blue-300 text-sm">
                {user.attendance} sessions • {user.submissions} submissions
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="dashboard-card">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-zocc-blue-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Performance Overview</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="name" stroke="#93c5fd" />
            <YAxis stroke="#93c5fd" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0b2447', 
                border: '1px solid #1e4d8b',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Bar dataKey="points" fill="#4f9cff" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Full Leaderboard Table */}
      <div className="dashboard-card">
        <h2 className="text-xl font-semibold text-white mb-6">Full Leaderboard</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zocc-blue-700/30">
                <th className="text-left py-3 px-4 text-sm font-semibold text-zocc-blue-300">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-zocc-blue-300">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-zocc-blue-300">Points</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-zocc-blue-300">Attendance</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-zocc-blue-300">Submissions</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-zocc-blue-300">Trend</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((user, idx) => (
                <tr key={idx} className="border-b border-zocc-blue-700/10 hover:bg-zocc-blue-800/20 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-start">
                      {user.rank <= 3 ? (
                        getRankIcon(user.rank)
                      ) : (
                        <span className="text-zocc-blue-400 font-bold">#{user.rank}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zocc-blue-600 to-zocc-blue-700 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">{user.name.charAt(0)}</span>
                      </div>
                      <span className="text-white font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white font-semibold">{user.points}</td>
                  <td className="py-4 px-4 text-zocc-blue-300">{user.attendance}</td>
                  <td className="py-4 px-4 text-zocc-blue-300">{user.submissions}</td>
                  <td className="py-4 px-4">
                    {user.trend === 'up' && (
                      <span className="inline-flex items-center gap-1 text-green-400">
                        <TrendingUp size={16} />
                        Up
                      </span>
                    )}
                    {user.trend === 'down' && (
                      <span className="inline-flex items-center gap-1 text-red-400">
                        <TrendingUp size={16} className="rotate-180" />
                        Down
                      </span>
                    )}
                    {user.trend === 'stable' && (
                      <span className="text-zocc-blue-400">Stable</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

