import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, BookOpen, ChevronRight, X } from 'lucide-react';
import { API_URL } from '../utils/apiUrl';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

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

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return 'TBA';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getUpcomingSessions = () => {
    const now = new Date();
    return sessions.filter(session => {
      // Use startTime if available, otherwise use date
      const sessionDate = session.startTime ? new Date(session.startTime) : new Date(session.date);
      return sessionDate > now;
    }).sort((a, b) => {
      const dateA = a.startTime ? new Date(a.startTime) : new Date(a.date);
      const dateB = b.startTime ? new Date(b.startTime) : new Date(b.date);
      return dateA - dateB;
    });
  };

  const getPastSessions = () => {
    const now = new Date();
    return sessions.filter(session => {
      // Use startTime if available, otherwise use date
      const sessionDate = session.startTime ? new Date(session.startTime) : new Date(session.date);
      return sessionDate <= now;
    }).sort((a, b) => {
      const dateA = a.startTime ? new Date(a.startTime) : new Date(a.date);
      const dateB = b.startTime ? new Date(b.startTime) : new Date(b.date);
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
              <div
                key={session._id}
                className="dashboard-card group cursor-pointer hover:border-zocc-blue-500/50 transition-all"
                onClick={() => setSelectedSession(session)}
              >
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
                    <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zocc-blue-400">
                    <MapPin size={16} />
                    <span>{session.venue}</span>
                  </div>
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
              <div
                key={session._id}
                className="dashboard-card group cursor-pointer hover:border-zocc-blue-500/50 transition-all opacity-75"
                onClick={() => setSelectedSession(session)}
              >
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
                    <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zocc-blue-400">
                    <MapPin size={16} />
                    <span>{session.venue}</span>
                  </div>
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

      {/* Session Details Modal */}
      {selectedSession && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="bg-zocc-blue-900/95 border border-zocc-blue-700/50 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-zocc-blue-900/95 border-b border-zocc-blue-700/50 p-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedSession.title}</h2>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${new Date(selectedSession.startTime || selectedSession.date) > new Date()
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                  {new Date(selectedSession.startTime || selectedSession.date) > new Date() ? 'Upcoming' : 'Completed'}
                </span>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 hover:bg-zocc-blue-800 rounded-lg transition-colors"
              >
                <X className="text-zocc-blue-300" size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zocc-blue-400 uppercase mb-2">Description</h3>
                <p className="text-white leading-relaxed">{selectedSession.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zocc-blue-800/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-zocc-blue-400 mb-2">
                    <Calendar size={18} />
                    <span className="text-sm font-semibold uppercase">Date</span>
                  </div>
                  <p className="text-white font-medium">{formatDate(selectedSession.date)}</p>
                </div>

                <div className="bg-zocc-blue-800/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-zocc-blue-400 mb-2">
                    <Clock size={18} />
                    <span className="text-sm font-semibold uppercase">Time</span>
                  </div>
                  <p className="text-white font-medium">{formatTime(selectedSession.startTime)} - {formatTime(selectedSession.endTime)}</p>
                </div>

                <div className="bg-zocc-blue-800/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-zocc-blue-400 mb-2">
                    <MapPin size={18} />
                    <span className="text-sm font-semibold uppercase">Venue</span>
                  </div>
                  <p className="text-white font-medium">{selectedSession.venue}</p>
                </div>
              </div>

              {selectedSession.joinLink && (
                <div className="bg-zocc-blue-800/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-zocc-blue-400 uppercase mb-2">Join Link</h3>
                  <a
                    href={selectedSession.joinLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zocc-blue-300 hover:text-zocc-blue-200 underline break-all"
                  >
                    {selectedSession.joinLink}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;

