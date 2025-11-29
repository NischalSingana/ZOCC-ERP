import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosConfig';
import Table from '../../components/Table';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Download, FileText, Filter } from 'lucide-react';

const SubmissionsApproval = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/submissions');
      if (response.data?.success) {
        let filtered = response.data.submissions || [];
        if (filter !== 'all') {
          filtered = filtered.filter((s) => s.status.toUpperCase() === filter.toUpperCase());
        }
        setSubmissions(filtered);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error(error.response?.data?.error || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleApprove = async (submissionId) => {
    try {
      const response = await axiosInstance.put(`/api/submissions/${submissionId}`, {
        status: 'ACCEPTED',
      });

      if (response.data?.success) {
        toast.success('Submission approved');
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error approving submission:', error);
      const errorMsg = error.response?.data?.error || 'Failed to approve submission';
      toast.error(errorMsg);
    }
  };

  const handleReject = async (submissionId) => {
    try {
      const response = await axiosInstance.put(`/api/submissions/${submissionId}`, {
        status: 'REJECTED',
      });

      if (response.data?.success) {
        toast.success('Submission rejected');
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
      const errorMsg = error.response?.data?.error || 'Failed to reject submission';
      toast.error(errorMsg);
    }
  };

  const handleDownload = (submission) => {
    window.open(submission.fileUrl, '_blank');
  };

  const columns = [
    {
      key: 'session',
      header: 'Session',
      render: (submission) => {
        const session = submission.sessionId || submission.session;
        return session?.title || 'N/A';
      },
    },
    {
      key: 'student',
      header: 'Student',
      render: (submission) => {
        const user = submission.userId || submission.user;
        return user?.studentFullName || user?.email || 'N/A';
      },
    },
    {
      key: 'file',
      header: 'File',
      render: (submission) => (
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-zocc-blue-400" />
          <span className="text-white">{submission.fileName}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (submission) => {
        const status = submission.status?.toUpperCase() || 'PENDING';
        return (
          <span
            className={`px-2 py-1 rounded text-xs ${status === 'ACCEPTED'
              ? 'bg-green-500/20 text-green-400'
              : status === 'REJECTED'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-yellow-500/20 text-yellow-400'
              }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (submission) =>
        submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (submission) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload(submission)}
            className="p-2 hover:bg-zocc-blue-800 rounded-lg transition-colors"
          >
            <Download size={18} className="text-zocc-blue-400" />
          </button>
          {(submission.status?.toUpperCase() === 'PENDING' || !submission.status) && (
            <>
              <button
                onClick={() => handleApprove(submission.id || submission._id)}
                className="p-2 hover:bg-green-900/20 rounded-lg transition-colors"
              >
                <CheckCircle size={18} className="text-green-400" />
              </button>
              <button
                onClick={() => handleReject(submission.id || submission._id)}
                className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <XCircle size={18} className="text-red-400" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="text-white">Loading submissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FileText size={32} />
          Submissions Approval
        </h1>
        <div className="flex gap-2">
          {['all', 'pending', 'accepted', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-all capitalize ${filter === status
                ? 'bg-zocc-blue-600 text-white'
                : 'bg-zocc-blue-800/50 text-zocc-blue-300 hover:bg-zocc-blue-700/50'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
        <Table
          data={submissions}
          columns={columns}
          keyExtractor={(item) => item.id || item._id}
          emptyMessage="No submissions found"
        />
      </div>
    </div>
  );
};

export default SubmissionsApproval;

