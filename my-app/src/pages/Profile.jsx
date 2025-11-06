import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileForm from '../components/ProfileForm';
import { User, Mail, GraduationCap, Trophy, Award, CheckCircle, Edit2 } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Profile Picture */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-zocc-blue-600 to-zocc-blue-700 flex items-center justify-center text-5xl font-bold text-white overflow-hidden ring-4 ring-zocc-blue-500/30">
              {user.photo ? (
                <img src={user.photo} alt={user.studentFullName} className="w-full h-full object-cover" />
              ) : (
                (user.studentFullName || user.email || 'U').charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white mb-2">
              {user.studentFullName || user.email}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <span className="px-3 py-1 bg-zocc-blue-600/50 rounded-full text-sm text-white border border-zocc-blue-500/30">
                {user.role}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-zocc-blue-300">
                <Mail size={16} />
                <span>{user.email}</span>
              </div>
              {user.idNumber && (
                <div className="flex items-center gap-2 text-zocc-blue-300">
                  <GraduationCap size={16} />
                  <span>{user.idNumber}</span>
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-2 text-zocc-blue-300">
                  <User size={16} />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all shadow-lg"
          >
            <Edit2 size={20} />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Profile Form */}
      {isEditing && (
        <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
          <ProfileForm
            user={user}
            onUpdate={(updatedUser) => {
              setIsEditing(false);
            }}
          />
        </div>
      )}

      {/* Achievements/Stats */}
      <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
        <h2 className="text-xl font-semibold text-white mb-6">Achievements</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-zocc-blue-900/30 rounded-lg border border-zocc-blue-700/30">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Trophy className="text-yellow-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">Active Member</h3>
              <p className="text-sm text-zocc-blue-300">Part of ZeroOne Coding Club</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-zocc-blue-900/30 rounded-lg border border-zocc-blue-700/30">
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">Profile Complete</h3>
              <p className="text-sm text-zocc-blue-300">Keep your profile updated</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
