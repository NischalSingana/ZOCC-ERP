import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import Table from '../../components/Table';
import toast from 'react-hot-toast';
import { Search, Users, Eye, Edit } from 'lucide-react';

const RegisteredStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/users/all');
      if (response.data?.success) {
        setStudents(response.data.students || []);
      } else {
        toast.error('Failed to load students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error(error.response?.data?.error || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.studentFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.idNumber?.includes(searchTerm)
  );

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewStudent = (student) => {
    window.location.href = `/dashboard/admin/student-details?id=${student.id || student._id}`;
  };

  const columns = [
    { key: 'idNumber', header: 'ID Number' },
    { key: 'studentFullName', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'phone',
      header: 'Phone',
      render: (student) => student.phone || 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      render: (student) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            student.emailVerified
              ? 'bg-green-500/20 text-green-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}
        >
          {student.emailVerified ? 'Verified' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (student) =>
        student.createdAt
          ? new Date(student.createdAt).toLocaleDateString()
          : 'N/A',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (student) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewStudent(student)}
            className="p-2 hover:bg-zocc-blue-800 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={18} className="text-zocc-blue-400" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="text-white">Loading students...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Users size={32} />
          Registered Students
        </h1>
      </div>

      <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zocc-blue-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white placeholder-zocc-blue-400 focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
            />
          </div>
        </div>

        <Table
          data={paginatedStudents}
          columns={columns}
          keyExtractor={(item) => item.id || item._id}
          emptyMessage="No students found"
        />

        {filteredStudents.length > itemsPerPage && (
          <div className="flex justify-between items-center mt-6">
            <p className="text-zocc-blue-300 text-sm">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of{' '}
              {filteredStudents.length} students
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-zocc-blue-800/50 text-white rounded-lg hover:bg-zocc-blue-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage * itemsPerPage >= filteredStudents.length}
                className="px-4 py-2 bg-zocc-blue-800/50 text-white rounded-lg hover:bg-zocc-blue-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisteredStudents;

