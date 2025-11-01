import { useState } from 'react';
import { User, Mail, GraduationCap, Camera, Save, CheckCircle, Trophy, Award, Edit2 } from 'lucide-react';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john.doe@student.kluniversity.in',
    regNo: '20BQ1A05XX',
    role: 'Student',
    mobile: '+91 9876543210',
    joinedDate: '2023-08-15',
  });

  const stats = [
    { label: 'Sessions Attended', value: '45' },
    { label: 'Submissions', value: '28' },
    { label: 'Projects Joined', value: '5' },
    { label: 'Current Rank', value: '#7' },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="dashboard-card">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Profile Picture */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-zocc-blue-600 to-zocc-blue-700 flex items-center justify-center text-5xl font-bold text-white overflow-hidden ring-4 ring-zocc-blue-500/30">
              {profileData.name.charAt(0)}
            </div>
            <label className="absolute bottom-0 right-0 p-3 bg-zocc-blue-600 rounded-full cursor-pointer hover:bg-zocc-blue-500 transition-colors shadow-lg">
              <Camera className="text-white" size={20} />
              <input type="file" className="hidden" accept="image/*" />
            </label>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white mb-2">{profileData.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <span className="px-3 py-1 bg-zocc-blue-600/50 rounded-full text-sm text-white border border-zocc-blue-500/30">
                {profileData.role}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-zocc-blue-300">
                <Mail size={16} />
                <span>{profileData.email}</span>
              </div>
              <div className="flex items-center gap-2 text-zocc-blue-300">
                <GraduationCap size={16} />
                <span>{profileData.regNo}</span>
              </div>
              <div className="flex items-center gap-2 text-zocc-blue-300">
                <User size={16} />
                <span>Joined: {profileData.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all shadow-lg"
          >
            {isEditing ? (
              <>
                <Save size={20} />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 size={20} />
                Edit Profile
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="dashboard-card text-center">
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-sm text-zocc-blue-300">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Profile Details */}
      <div className="dashboard-card">
        <h2 className="text-xl font-semibold text-white mb-6">Profile Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
              />
            ) : (
              <p className="text-white">{profileData.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
              Email
            </label>
            <p className="text-white">{profileData.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
              Registration Number
            </label>
            <p className="text-white">{profileData.regNo}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
              Mobile Number
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.mobile}
                onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
              />
            ) : (
              <p className="text-white">{profileData.mobile}</p>
            )}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="dashboard-card">
        <h2 className="text-xl font-semibold text-white mb-6">Recent Achievements</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-zocc-blue-800/30 rounded-lg border border-zocc-blue-700/30">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Trophy className="text-yellow-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">Top 10 Leaderboard</h3>
              <p className="text-sm text-zocc-blue-300">Achieved in last month</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-zocc-blue-800/30 rounded-lg border border-zocc-blue-700/30">
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">100% Attendance</h3>
              <p className="text-sm text-zocc-blue-300">Perfect attendance this semester</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-zocc-blue-800/30 rounded-lg border border-zocc-blue-700/30">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Award className="text-blue-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">Project Completed</h3>
              <p className="text-sm text-zocc-blue-300">Successfully completed 2 major projects</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

