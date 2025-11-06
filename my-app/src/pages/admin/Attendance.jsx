import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import Table from '../../components/Table';
import toast from 'react-hot-toast';
import { Calendar, Users, Upload, CheckCircle, XCircle } from 'lucide-react';

const AttendanceAdmin = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchAttendance(selectedSession.id);
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/sessions');
      if (response.data?.success) {
        setSessions(response.data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (sessionId) => {
    try {
      // Fetch attendance for the selected session
      // This would need a specific API endpoint
      toast.success('Attendance loaded');
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance');
    }
  };

  const handleMarkAttendance = async (studentId, status) => {
    try {
      await axiosInstance.post('/api/attendance', {
        sessionId: selectedSession.id,
        studentId,
        status,
      });
      toast.success('Attendance marked');
      fetchAttendance(selectedSession.id);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const handleBulkImport = () => {
    // Handle CSV import
    toast.info('CSV import feature coming soon');
  };

  const columns = [
    { key: 'studentFullName', header: 'Student Name' },
    { key: 'idNumber', header: 'ID Number' },
    { key: 'email', header: 'Email' },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            item.status === 'PRESENT'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {item.status || 'NOT_MARKED'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleMarkAttendance(item.userId, 'PRESENT')}
            className="p-2 hover:bg-green-900/20 rounded-lg transition-colors"
          >
            <CheckCircle size={18} className="text-green-400" />
          </button>
          <button
            onClick={() => handleMarkAttendance(item.userId, 'ABSENT')}
            className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <XCircle size={18} className="text-red-400" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Calendar size={32} />
          Attendance Marking
        </h1>
        <button
          onClick={handleBulkImport}
          className="px-6 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all flex items-center gap-2"
        >
          <Upload size={20} />
          Import CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
            <h2 className="text-xl font-semibold text-white mb-4">Select Session</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedSession?.id === session.id
                      ? 'bg-zocc-blue-600 border-2 border-zocc-blue-500'
                      : 'bg-zocc-blue-800/30 border border-zocc-blue-700/30 hover:bg-zocc-blue-800/50'
                  }`}
                >
                  <h3 className="text-white font-medium">{session.title}</h3>
                  <p className="text-sm text-zocc-blue-300">
                    {new Date(session.date).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedSession ? (
            <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
              <h2 className="text-xl font-semibold text-white mb-4">
                Attendance for {selectedSession.title}
              </h2>
              <Table
                data={attendance}
                columns={columns}
                keyExtractor={(item) => item.userId}
                emptyMessage="No attendance records found"
              />
            </div>
          ) : (
            <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-12 border border-zocc-blue-700/30 text-center">
              <Users className="mx-auto text-zocc-blue-400 mb-4" size={48} />
              <p className="text-zocc-blue-300">Select a session to mark attendance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceAdmin;

