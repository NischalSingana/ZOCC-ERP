import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import Table from '../../components/Table';
import { showToast } from '../../utils/toastUtils';
import { Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';

const SessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    trainer: '',
    maxSeats: 50,
    joinLink: '',
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/sessions');
      if (response.data?.success) {
        setSessions(response.data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showToast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const sessionId = editingSession?.id || editingSession?._id;
      const url = editingSession
        ? `/api/sessions/${sessionId?.toString() || sessionId}`
        : '/api/sessions';
      const method = editingSession ? 'put' : 'post';

      const response = await axiosInstance[method](url, {
        ...formData,
        date: new Date(formData.date).toISOString(),
        startTime: formData.startTime ? new Date(`${formData.date}T${formData.startTime}`).toISOString() : null,
        endTime: formData.endTime ? new Date(`${formData.date}T${formData.endTime}`).toISOString() : null,
      });

      if (response.data?.success) {
        showToast.success(editingSession ? 'Session updated!' : 'Session created!');
        setShowForm(false);
        setEditingSession(null);
        setFormData({
          title: '',
          description: '',
          date: '',
          startTime: '',
          endTime: '',
          venue: '',
          trainer: '',
          maxSeats: 50,
          joinLink: '',
        });
        fetchSessions();
      }
    } catch (error) {
      console.error('Error saving session:', error);
      showToast.error('Failed to save session');
    }
  };

  const handleDelete = async (sessionId) => {
    if (!sessionId) {
      showToast.error('Invalid session ID');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const idString = sessionId?.toString() || sessionId;
      await axiosInstance.delete(`/api/sessions/${idString}`);
      showToast.success('Session deleted!');
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      showToast.error(error.response?.data?.error || 'Failed to delete session');
    }
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setFormData({
      title: session.title || '',
      description: session.description || '',
      date: session.date ? new Date(session.date).toISOString().split('T')[0] : '',
      startTime: session.startTime ? new Date(session.startTime).toTimeString().slice(0, 5) : '',
      endTime: session.endTime ? new Date(session.endTime).toTimeString().slice(0, 5) : '',
      venue: session.venue || '',
      trainer: session.trainer || '',
      maxSeats: session.maxSeats || 50,
      joinLink: session.joinLink || '',
    });
    setShowForm(true);
  };

  const columns = [
    { key: 'title', header: 'Title' },
    {
      key: 'date',
      header: 'Date',
      render: (session) => new Date(session.date).toLocaleDateString(),
    },
    { key: 'venue', header: 'Venue' },
    { key: 'trainer', header: 'Trainer' },
    {
      key: 'actions',
      header: 'Actions',
      render: (session) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(session)}
            className="p-2 hover:bg-zocc-blue-800 rounded-lg transition-colors"
          >
            <Edit size={18} className="text-zocc-blue-400" />
          </button>
          <button
            onClick={() => handleDelete(session.id || session._id)}
            className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 size={18} className="text-red-400" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="text-white">Loading sessions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Calendar size={32} />
          Session Management
        </h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingSession(null);
            setFormData({
              title: '',
              description: '',
              date: '',
              startTime: '',
              endTime: '',
              venue: '',
              trainer: '',
              maxSeats: 50,
              joinLink: '',
            });
          }}
          className="px-6 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          New Session
        </button>
      </div>

      {showForm && (
        <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingSession ? 'Edit Session' : 'Create New Session'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Venue *
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Max Seats
                </label>
                <input
                  type="number"
                  value={formData.maxSeats}
                  onChange={(e) => setFormData({ ...formData, maxSeats: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Trainer
                </label>
                <input
                  type="text"
                  value={formData.trainer}
                  onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                  className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Join Link (for online sessions)
                </label>
                <input
                  type="url"
                  value={formData.joinLink}
                  onChange={(e) => setFormData({ ...formData, joinLink: e.target.value })}
                  className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                required
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all"
              >
                {editingSession ? 'Update Session' : 'Create Session'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSession(null);
                }}
                className="px-6 py-2 bg-zocc-blue-800/50 text-white rounded-lg hover:bg-zocc-blue-700/50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
        <Table
          data={sessions}
          columns={columns}
          keyExtractor={(item) => item.id || item._id}
          emptyMessage="No sessions found"
        />
      </div>
    </div>
  );
};

export default SessionManagement;

