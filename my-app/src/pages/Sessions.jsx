import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, BookOpen, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getUpcomingSessions = () => {
    const now = new Date();
    return sessions.filter(session => {
      const sessionDate = new Date(`${session.date}T${session.time}`);
      return sessionDate > now;
    }).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA - dateB;
    });
  };

  const getPastSessions = () => {
    const now = new Date();
    return sessions.filter(session => {
      const sessionDate = new Date(`${session.date}T${session.time}`);
      return sessionDate <= now;
    }).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB - dateA;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zocc-blue-300">Loading sessions...</div>
      </div>
    );
  }

  const upcomingSessions = getUpcomingSessions();
  const pastSessions = getPastSessions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Sessions</h1>
        <p className="text-zocc-blue-300">View and manage coding club sessions</p>
      </div>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="text-zocc-blue-400" size={24} />
            Upcoming Sessions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingSessions.map((session) => (
              <div key={session._id} className="dashboard-card group cursor-pointer hover:border-zocc-blue-500/50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-zocc-blue-600 to-zocc-blue-700">
                    <BookOpen className="text-white" size={24} />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    Upcoming
                  </span>
                </div>

                <h3 className="text-white font-semibold text-lg mb-3 group-hover:text-zocc-blue-300 transition-colors">
                  {session.title}
                </h3>

                <p className="text-sm text-zocc-blue-300 mb-4 line-clamp-2">
                  {session.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-zocc-blue-400">
                    <Calendar size={16} />
                    <span>{formatDate(session.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zocc-blue-400">
                    <Clock size={16} />
                    <span>{formatTime(session.time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zocc-blue-400">
                    <MapPin size={16} />
                    <span>{session.venue}</span>
                  </div>
                  {session.trainer && (
                    <div className="flex items-center gap-2 text-sm text-zocc-blue-400">
                      <Users size={16} />
                      <span>Trainer: {session.trainer}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-zocc-blue-400 text-sm group-hover:text-zocc-blue-300 transition-colors">
                  <span>View Details</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="text-zocc-blue-400" size={24} />
            Past Sessions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastSessions.map((session) => (
              <div key={session._id} className="dashboard-card group cursor-pointer hover:border-zocc-blue-500/50 transition-all opacity-75">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-zocc-blue-800/50">
                    <BookOpen className="text-zocc-blue-300" size={24} />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                    Completed
                  </span>
                </div>

                <h3 className="text-white font-semibold text-lg mb-3 group-hover:text-zocc-blue-300 transition-colors">
                  {session.title}
                </h3>

                <p className="text-sm text-zocc-blue-300 mb-4 line-clamp-2">
                  {session.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-zocc-blue-400">
                    <Calendar size={16} />
                    <span>{formatDate(session.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zocc-blue-400">
                    <Clock size={16} />
                    <span>{formatTime(session.time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zocc-blue-400">
                    <MapPin size={16} />
                    <span>{session.venue}</span>
                  </div>
                  {session.trainer && (
                    <div className="flex items-center gap-2 text-sm text-zocc-blue-400">
                      <Users size={16} />
                      <span>Trainer: {session.trainer}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="dashboard-card text-center py-12">
          <BookOpen className="mx-auto mb-4 text-zocc-blue-400" size={48} />
          <h3 className="text-white font-semibold text-lg mb-2">No Sessions Available</h3>
          <p className="text-zocc-blue-300">Check back later for upcoming sessions.</p>
        </div>
      )}
    </div>
  );
};

export default Sessions;

