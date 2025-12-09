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
    dateTBD: false,
    startHour: '',
    startMinute: '',
    startPeriod: 'AM',
    endHour: '',
    endMinute: '',
    endPeriod: 'AM',
    venue: '',
    trainer: '',
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

      // Convert time fields to 24-hour format
      const convertTo24Hour = (hour, minute, period) => {
        if (!hour || !minute) return null;
        let hour24 = parseInt(hour);
        if (period === 'PM' && hour24 !== 12) hour24 += 12;
        if (period === 'AM' && hour24 === 12) hour24 = 0;
        return `${hour24.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
      };

      const startTime24 = convertTo24Hour(formData.startHour, formData.startMinute, formData.startPeriod);
      const endTime24 = convertTo24Hour(formData.endHour, formData.endMinute, formData.endPeriod);

      const response = await axiosInstance[method](url, {
        title: formData.title,
        description: formData.description,
        venue: formData.venue,
        trainer: formData.trainer,
        joinLink: formData.joinLink,
        date: formData.dateTBD || !formData.date ? null : new Date(formData.date).toISOString(),
        startTime: startTime24 && formData.date ? new Date(`${formData.date}T${startTime24}`).toISOString() : null,
        endTime: endTime24 && formData.date ? new Date(`${formData.date}T${endTime24}`).toISOString() : null,
      });

      if (response.data?.success) {
        showToast.success(editingSession ? 'Session updated!' : 'Session created!');
        setShowForm(false);
        setEditingSession(null);
        setFormData({
          title: '',
          description: '',
          date: '',
          dateTBD: false,
          startHour: '',
          startMinute: '',
          startPeriod: 'AM',
          endHour: '',
          endMinute: '',
          endPeriod: 'AM',
          venue: '',
          trainer: '',
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
    // Helper to convert 24-hour time to 12-hour format with AM/PM
    const convertTo12Hour = (isoTime) => {
      if (!isoTime) return { hour: '', minute: '', period: 'AM' };
      const date = new Date(isoTime);
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return {
        hour: hours.toString(),
        minute: minutes.toString().padStart(2, '0'),
        period
      };
    };

    const startTime = convertTo12Hour(session.startTime);
    const endTime = convertTo12Hour(session.endTime);

    setEditingSession(session);
    setFormData({
      title: session.title || '',
      description: session.description || '',
      date: session.date ? new Date(session.date).toISOString().split('T')[0] : '',
      dateTBD: !session.date,
      startHour: startTime.hour,
      startMinute: startTime.minute,
      startPeriod: startTime.period,
      endHour: endTime.hour,
      endMinute: endTime.minute,
      endPeriod: endTime.period,
      venue: session.venue || '',
      trainer: session.trainer || '',
      joinLink: session.joinLink || '',
    });
    setShowForm(true);
  };

  const columns = [
    {
      key: 'title',
      header: 'Title',
      cellClassName: 'break-words',
      headerClassName: 'w-[35%]'
    },
    {
      key: 'date',
      header: 'Date',
      render: (session) => {
        if (!session.date) return 'TBD';
        const date = new Date(session.date);
        if (isNaN(date.getTime())) return 'TBD';
        return date.toLocaleDateString();
      },
      headerClassName: 'w-[20%]'
    },
    {
      key: 'venue',
      header: 'Venue',
      headerClassName: 'w-[25%]'
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'w-[10%]',
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
              dateTBD: false,
              startHour: '',
              startMinute: '',
              startPeriod: 'AM',
              endHour: '',
              endMinute: '',
              endPeriod: 'AM',
              venue: '',
              trainer: '',
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
                <div className="space-y-2">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                    required={!formData.dateTBD}
                    disabled={formData.dateTBD}
                  />
                  <label className="flex items-center gap-2 text-sm text-zocc-blue-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dateTBD}
                      onChange={(e) => setFormData({ ...formData, dateTBD: e.target.checked, date: e.target.checked ? '' : formData.date })}
                      className="w-4 h-4 rounded border-zocc-blue-700/30 bg-zocc-blue-800/50 text-zocc-blue-500 focus:ring-zocc-blue-500"
                    />
                    <span>Date To Be Determined (TBD)</span>
                  </label>
                </div>
              </div>
              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Start Time
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="HH"
                    value={formData.startHour}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow 1-2 digits
                      if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12 && value.length <= 2)) {
                        setFormData({ ...formData, startHour: value });
                      }
                    }}
                    onBlur={(e) => {
                      // Pad with zero on blur if single digit
                      if (e.target.value && e.target.value.length === 1) {
                        setFormData({ ...formData, startHour: e.target.value.padStart(2, '0') });
                      }
                    }}
                    className="w-20 px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white text-center"
                  />
                  <span className="text-white self-center">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="MM"
                    value={formData.startMinute}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow 0-59 and max 2 digits
                      if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59 && value.length <= 2)) {
                        setFormData({ ...formData, startMinute: value });
                      }
                    }}
                    onBlur={(e) => {
                      // Pad with zero on blur if single digit
                      if (e.target.value && e.target.value.length === 1) {
                        setFormData({ ...formData, startMinute: e.target.value.padStart(2, '0') });
                      }
                    }}
                    className="w-20 px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white text-center"
                  />
                  <select
                    value={formData.startPeriod}
                    onChange={(e) => setFormData({ ...formData, startPeriod: e.target.value })}
                    className="px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  End Time
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="HH"
                    value={formData.endHour}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow 1-2 digits
                      if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12 && value.length <= 2)) {
                        setFormData({ ...formData, endHour: value });
                      }
                    }}
                    onBlur={(e) => {
                      // Pad with zero on blur if single digit
                      if (e.target.value && e.target.value.length === 1) {
                        setFormData({ ...formData, endHour: e.target.value.padStart(2, '0') });
                      }
                    }}
                    className="w-20 px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white text-center"
                  />
                  <span className="text-white self-center">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="MM"
                    value={formData.endMinute}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow 0-59 and max 2 digits
                      if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59 && value.length <= 2)) {
                        setFormData({ ...formData, endMinute: value });
                      }
                    }}
                    onBlur={(e) => {
                      // Pad with zero on blur if single digit
                      if (e.target.value && e.target.value.length === 1) {
                        setFormData({ ...formData, endMinute: e.target.value.padStart(2, '0') });
                      }
                    }}
                    className="w-20 px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white text-center"
                  />
                  <select
                    value={formData.endPeriod}
                    onChange={(e) => setFormData({ ...formData, endPeriod: e.target.value })}
                    className="px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
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
