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
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredAttendance = attendance.filter(item => {
    const searchStr = searchTerm.toLowerCase();
    return (
      item.studentFullName?.toLowerCase().includes(searchStr) ||
      item.idNumber?.toLowerCase().includes(searchStr)
    );
  });

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
            className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-500 hover:to-green-400 transition-all flex items-center gap-2 text-sm sm:text-base"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Export</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-4 sm:p-6 border border-zocc-blue-700/30">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Select Session</h2>
            <div className="space-y-2 max-h-60 lg:max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
              {sessions.map((session) => (
                <button
                  key={session.id || session._id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left p-3 sm:p-4 rounded-lg transition-all ${(selectedSession?.id || selectedSession?._id) === (session.id || session._id)
                    ? 'bg-zocc-blue-600 border-2 border-zocc-blue-500 shadow-lg shadow-zocc-blue-500/20'
                    : 'bg-zocc-blue-800/30 border border-zocc-blue-700/30 hover:bg-zocc-blue-800/50'
                    }`}
                >
                  <h3 className="text-white font-medium text-sm sm:text-base">{session.title}</h3>
                  <p className="text-xs sm:text-sm text-zocc-blue-300">
                    {session.date ? new Date(session.date).toLocaleDateString() : 'N/A'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedSession ? (
            <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-4 sm:p-6 border border-zocc-blue-700/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  Attendance: {selectedSession.title}
                </h2>
                <div className="text-sm text-zocc-blue-300">
                  Total Students: {filteredAttendance.length}
                </div>
              </div>

              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or ID number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 sm:p-4 bg-zocc-blue-900/50 border border-zocc-blue-700/30 rounded-lg text-white placeholder-zocc-blue-400 focus:outline-none focus:ring-2 focus:ring-zocc-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Desktop View */}
              <div className="hidden md:block">
                <Table
                  data={filteredAttendance}
                  columns={columns}
                  keyExtractor={(item) => item.userId || item._id}
                  emptyMessage="No attendance records found"
                />
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {filteredAttendance.length > 0 ? (
                  filteredAttendance.map((item) => (
                    <div
                      key={item.userId || item._id}
                      className="bg-zocc-blue-900/30 border border-zocc-blue-700/20 rounded-xl p-4 space-y-4"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-bold text-base sm:text-lg leading-tight truncate">
                            {item.studentFullName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zocc-blue-400 font-semibold tracking-wider bg-zocc-blue-400/10 px-2 py-0.5 rounded">
                              {item.idNumber}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {columns[2].render(item)}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-zocc-blue-700/10">
                        <span className="text-xs text-zocc-blue-400 font-medium uppercase">Mark Status</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleMarkAttendance(item.userId, 'present')}
                            className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors border border-green-500/20"
                            title="Mark Present"
                          >
                            <CheckCircle size={18} className="text-green-400" />
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(item.userId, 'absent')}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                            title="Mark Absent"
                          >
                            <XCircle size={18} className="text-red-400" />
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(item.userId, 'late')}
                            className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg transition-colors border border-yellow-500/20"
                            title="Mark Late"
                          >
                            <Clock size={18} className="text-yellow-400" />
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(item.userId, 'excused')}
                            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
                            title="Mark Excused"
                          >
                            <CheckCircle size={18} className="text-blue-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-zocc-blue-300 bg-zocc-blue-900/10 rounded-lg border border-dashed border-zocc-blue-700/30">
                    No attendance records found
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-12 border border-zocc-blue-700/30 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="p-4 bg-zocc-blue-900/50 rounded-full mb-4">
                <Users className="text-zocc-blue-400" size={48} />
              </div>
              <p className="text-zocc-blue-300 text-lg">Select a session to mark attendance</p>
              <p className="text-zocc-blue-500 text-sm mt-2 max-w-xs">
                Pick a session from the left sidebar to view and manage student attendance levels.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceAdmin;

