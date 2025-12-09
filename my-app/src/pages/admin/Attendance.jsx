import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import Table from '../../components/Table';
import { showToast } from '../../utils/toastUtils';
import { Calendar, Users, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';

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
      const sessionId = selectedSession.id || selectedSession._id;
      if (sessionId) {
        fetchAttendance(sessionId);
      }
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
      showToast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (sessionId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/admin/sessions/${sessionId}/attendance`);
      if (response.data?.success) {
        setAttendance(response.data.attendance || []);
      } else {
        showToast.error('Failed to load attendance');
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      showToast.error(error.response?.data?.error || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (studentId, status) => {
    try {
      const sessionId = selectedSession?.id || selectedSession?._id;
      if (!sessionId) {
        showToast.success('Please select a session first');
        return;
      }

      // Ensure userId is a string
      const userIdString = studentId?.toString() || studentId;

      await axiosInstance.post('/api/attendance', {
        sessionId: sessionId.toString(),
        userId: userIdString,
        status: status.toLowerCase(),
      });
      showToast.success('Attendance marked successfully');
      fetchAttendance(sessionId);
    } catch (error) {
      console.error('Error marking attendance:', error);
      showToast.error(error.response?.data?.error || 'Failed to mark attendance');
    }
  };

  const handleExportExcel = () => {
    if (!selectedSession) {
      showToast.success('Please select a session first');
      return;
    }

    if (!attendance || attendance.length === 0) {
      showToast.success('No attendance data to export');
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = attendance.map((item, index) => ({
        'S.No': index + 1,
        'Student Name': item.studentFullName || 'N/A',
        'ID Number': item.idNumber || 'N/A',
        'Status': item.status ? item.status.toUpperCase() : 'Not Marked',
        'Marked At': item.markedAt ? new Date(item.markedAt).toLocaleString() : 'N/A',
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 8 },   // S.No
        { wch: 25 },  // Student Name
        { wch: 15 },  // ID Number
        { wch: 30 },  // Email
        { wch: 15 },  // Status
        { wch: 20 },  // Marked At
        { wch: 30 }   // Notes
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

      // Generate filename with session title and date
      const sessionTitle = selectedSession.title || 'Session';
      const sessionDate = selectedSession.date
        ? new Date(selectedSession.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      const filename = `Attendance_${sessionTitle.replace(/[^a-z0-9]/gi, '_')}_${sessionDate}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
      showToast.success('Attendance exported successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      showToast.error('Failed to export attendance');
    }
  };

  const columns = [
    {
      key: 'studentFullName',
      header: 'Student Name',
      headerClassName: 'w-[30%]',
      cellClassName: 'break-words'
    },
    {
      key: 'idNumber',
      header: 'ID Number',
      headerClassName: 'w-[20%]'
    },
    {
      key: 'status',
      header: 'Status',
      headerClassName: 'w-[20%]',
      render: (item) => {
        const status = item.status?.toUpperCase();
        if (!status || status === 'NULL' || status === 'UNDEFINED') {
          return (
            <span className="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-400 whitespace-nowrap inline-block">
              Not Marked
            </span>
          );
        }
        return (
          <span
            className={`px-2 py-1 rounded text-xs whitespace-nowrap inline-block ${status === 'PRESENT'
              ? 'bg-green-500/20 text-green-400'
              : status === 'LATE'
                ? 'bg-yellow-500/20 text-yellow-400'
                : status === 'EXCUSED'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'w-[30%]',
      render: (item) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleMarkAttendance(item.userId, 'present')}
            className="p-2 hover:bg-green-900/20 rounded-lg transition-colors"
            title="Mark Present"
          >
            <CheckCircle size={18} className="text-green-400" />
          </button>
          <button
            onClick={() => handleMarkAttendance(item.userId, 'absent')}
            className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
            title="Mark Absent"
          >
            <XCircle size={18} className="text-red-400" />
          </button>
          <button
            onClick={() => handleMarkAttendance(item.userId, 'late')}
            className="p-2 hover:bg-yellow-900/20 rounded-lg transition-colors"
            title="Mark Late"
          >
            <Clock size={18} className="text-yellow-400" />
          </button>
          <button
            onClick={() => handleMarkAttendance(item.userId, 'excused')}
            className="p-2 hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Mark Excused"
          >
            <CheckCircle size={18} className="text-blue-400" />
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
        {selectedSession && attendance.length > 0 && (
          <button
            onClick={handleExportExcel}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-500 hover:to-green-400 transition-all flex items-center gap-2"
          >
            <Download size={20} />
            Export Excel
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
            <h2 className="text-xl font-semibold text-white mb-4">Select Session</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessions.map((session) => (
                <button
                  key={session.id || session._id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${(selectedSession?.id || selectedSession?._id) === (session.id || session._id)
                    ? 'bg-zocc-blue-600 border-2 border-zocc-blue-500'
                    : 'bg-zocc-blue-800/30 border border-zocc-blue-700/30 hover:bg-zocc-blue-800/50'
                    }`}
                >
                  <h3 className="text-white font-medium">{session.title}</h3>
                  <p className="text-sm text-zocc-blue-300">
                    {session.date ? new Date(session.date).toLocaleDateString() : 'N/A'}
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
                keyExtractor={(item) => item.userId || item._id}
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

