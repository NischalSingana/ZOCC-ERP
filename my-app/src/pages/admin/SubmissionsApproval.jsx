import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import Table from '../../components/Table';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Download, FileText, Filter, Eye, Image as ImageIcon, Trash2 } from 'lucide-react';
import { API_URL } from '../../utils/apiUrl';

const SubmissionsApproval = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && imageModalOpen) {
        setImageModalOpen(false);
        setSelectedImageUrl(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [imageModalOpen]);

  const fetchSubmissions = async () => {
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
  };

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
    if (!submission.fileUrl) {
      toast.error('File URL is not available');
      return;
    }
    // Signed URLs from backend are already full URLs, use them directly
    // If fileUrl is a key path (starts with submissions/), use proxy endpoint
    let fileUrl = submission.fileUrl;
    if (fileUrl.startsWith('submissions/') && !fileUrl.startsWith('http')) {
      fileUrl = `${API_URL}/api/files/${encodeURIComponent(fileUrl)}`;
    }
    // Open in new tab for download
    window.open(fileUrl, '_blank');
  };

  const handleViewImage = (submission) => {
    if (!submission.fileUrl) {
      toast.error('File URL is not available');
      return;
    }
    // Check if it's an image file
    const isImage = submission.fileType === 'image' || 
                   (submission.fileName && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(submission.fileName));
    
    if (!isImage) {
      // If not an image, just download it
      handleDownload(submission);
      return;
    }
    
    // Get the file URL (signed URL or proxy endpoint)
    let fileUrl = submission.fileUrl;
    if (fileUrl.startsWith('submissions/') && !fileUrl.startsWith('http')) {
      fileUrl = `${API_URL}/api/files/${encodeURIComponent(fileUrl)}`;
    }
    
    setSelectedImageUrl(fileUrl);
    setImageModalOpen(true);
  };

  const handleCleanupOldSubmissions = async () => {
    if (!window.confirm('Are you sure you want to delete all old submissions from the old bucket? This action cannot be undone.')) {
      return;
    }

    try {
      setCleaningUp(true);
      const response = await axiosInstance.delete('/api/admin/submissions/cleanup-old');
      if (response.data?.success) {
        toast.success(`Successfully deleted ${response.data.deletedCount} old submissions`);
        fetchSubmissions(); // Refresh the list
      }
    } catch (error) {
      console.error('Error cleaning up old submissions:', error);
      toast.error(error.response?.data?.error || 'Failed to clean up old submissions');
    } finally {
      setCleaningUp(false);
    }
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
      render: (submission) => {
        const isImage = submission.fileType === 'image' || 
                       (submission.fileName && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(submission.fileName));
        return (
          <div className="flex items-center gap-2">
            {isImage ? (
              <ImageIcon size={18} className="text-zocc-blue-400" />
            ) : (
              <FileText size={18} className="text-zocc-blue-400" />
            )}
            <span className="text-white">{submission.fileName || 'Unknown file'}</span>
          </div>
        );
      },
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
      render: (submission) => {
        const isImage = submission.fileType === 'image' || 
                       (submission.fileName && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(submission.fileName));
        return (
          <div className="flex gap-2">
            {isImage && (
              <button
                onClick={() => handleViewImage(submission)}
                className="p-2 hover:bg-zocc-blue-800 rounded-lg transition-colors"
                title="View Image"
              >
                <Eye size={18} className="text-zocc-blue-400" />
              </button>
            )}
            <button
              onClick={() => handleDownload(submission)}
              className="p-2 hover:bg-zocc-blue-800 rounded-lg transition-colors"
              title="Download File"
            >
              <Download size={18} className="text-zocc-blue-400" />
            </button>
            {(submission.status?.toUpperCase() === 'PENDING' || !submission.status) && (
              <>
                <button
                  onClick={() => handleApprove(submission.id || submission._id)}
                  className="p-2 hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Approve"
                >
                  <CheckCircle size={18} className="text-green-400" />
                </button>
                <button
                  onClick={() => handleReject(submission.id || submission._id)}
                  className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Reject"
                >
                  <XCircle size={18} className="text-red-400" />
                </button>
              </>
            )}
          </div>
        );
      },
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
        <div className="flex gap-2 items-center">
          <button
            onClick={handleCleanupOldSubmissions}
            disabled={cleaningUp}
            className="px-4 py-2 rounded-lg transition-all bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Delete all old submissions from old bucket"
          >
            <Trash2 size={18} />
            {cleaningUp ? 'Cleaning...' : 'Clean Old Submissions'}
          </button>
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

      {/* Image View Modal */}
      {imageModalOpen && selectedImageUrl && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setImageModalOpen(false);
            setSelectedImageUrl(null);
          }}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => {
                setImageModalOpen(false);
                setSelectedImageUrl(null);
              }}
              className="absolute top-4 right-4 z-10 bg-zocc-blue-800/80 hover:bg-zocc-blue-700/80 text-white rounded-full p-2 transition-all shadow-lg"
              aria-label="Close"
            >
              <XCircle size={24} />
            </button>
            <img 
              src={selectedImageUrl} 
              alt="Submission preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                console.error('Image failed to load in modal:', selectedImageUrl);
                toast.error('Failed to load image');
              }}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
              Click outside or press ESC to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsApproval;

