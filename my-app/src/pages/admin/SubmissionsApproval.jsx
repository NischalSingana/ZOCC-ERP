import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import Table from '../../components/Table';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Download, FileText, Filter, Eye, Image as ImageIcon, Trash2, Edit2, User } from 'lucide-react';
import { API_URL } from '../../utils/apiUrl';

const SubmissionsApproval = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [editForm, setEditForm] = useState({ notes: '', feedback: '', status: '' });

  // View Student State
  const [viewStudentModalOpen, setViewStudentModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (imageModalOpen) {
          setImageModalOpen(false);
          setSelectedImageUrl(null);
        }
        if (editModalOpen) {
          setEditModalOpen(false);
          setEditingSubmission(null);
        }
        if (viewStudentModalOpen) {
          setViewStudentModalOpen(false);
          setViewingStudent(null);
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [imageModalOpen, editModalOpen, viewStudentModalOpen]);

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

  const handleDownload = async (submission) => {
    if (!submission.fileUrl) {
      toast.error('File URL is not available');
      return;
    }

    try {
      let fileUrl = submission.fileUrl;
      let fileKey = null;

      // Extract the R2 key from the fileUrl
      if (fileUrl.startsWith('http')) {
        // If it's a signed URL or full URL, extract the key
        const match = fileUrl.match(/(submissions\/[^?]+)/);
        if (match) {
          fileKey = decodeURIComponent(match[1]);
        } else {
          // If we can't extract a key, try using the URL directly
          const token = localStorage.getItem('authToken');
          const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
          const response = await fetch(fileUrl, { headers });
          if (response.ok) {
            const blob = await response.blob();
            downloadBlob(blob, submission);
            return;
          }
          throw new Error('Failed to download from URL');
        }
      } else if (fileUrl.startsWith('submissions/')) {
        fileKey = fileUrl;
      } else {
        toast.error('Invalid file URL format');
        return;
      }

      // Always use the proxy endpoint with the key for reliable downloads
      const downloadUrl = `${API_URL}/api/files/${encodeURIComponent(fileKey)}`;
      const token = localStorage.getItem('authToken');
      
      // Always include Authorization header for admin downloads
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(downloadUrl, { 
        headers,
        method: 'GET'
      });

      if (!response.ok) {
        // Try alternative encoding if first attempt fails
        if (response.status === 404) {
          const altUrl = downloadUrl.replace(/%20/g, '+');
          const retryResponse = await fetch(altUrl, { headers });
          if (retryResponse.ok) {
            const blob = await retryResponse.blob();
            downloadBlob(blob, submission);
            return;
          }
        }
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Download failed: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      downloadBlob(blob, submission);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(error.message || 'Failed to download file');
      
      // Fallback: try opening in new tab
      try {
        let fileUrl = submission.fileUrl;
        if (fileUrl.startsWith('submissions/') && !fileUrl.startsWith('http')) {
          const token = localStorage.getItem('authToken');
          fileUrl = `${API_URL}/api/files/${encodeURIComponent(fileUrl)}`;
          if (token) {
            // Try to download with token in URL (not ideal but as fallback)
            window.open(fileUrl, '_blank');
          } else {
            window.open(fileUrl, '_blank');
          }
        } else if (fileUrl.startsWith('http')) {
          window.open(fileUrl, '_blank');
        }
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
      }
    }
  };

  const downloadBlob = (blob, submission) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = submission.fileName || `submission-${submission.id || submission._id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleViewImage = (submission) => {
    if (!submission.fileUrl) {
      toast.error('File URL is not available');
      return;
    }
    const isImage = submission.fileType === 'image' ||
      (submission.fileName && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(submission.fileName));

    if (!isImage) {
      handleDownload(submission);
      return;
    }

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
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error cleaning up old submissions:', error);
      toast.error(error.response?.data?.error || 'Failed to clean up old submissions');
    } finally {
      setCleaningUp(false);
    }
  };

  const handleEdit = (submission) => {
    setEditingSubmission(submission);
    setEditForm({
      notes: submission.notes || '',
      feedback: submission.feedback || '',
      status: submission.status || 'PENDING'
    });
    setEditModalOpen(true);
  };

  const handleUpdateSubmission = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.put(`/api/submissions/${editingSubmission.id || editingSubmission._id}`, {
        status: editForm.status,
        feedback: editForm.feedback,
        notes: editForm.notes
      });

      if (response.data?.success) {
        toast.success('Submission updated successfully');
        setEditModalOpen(false);
        setEditingSubmission(null);
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error(error.response?.data?.error || 'Failed to update submission');
    }
  };

  const handleViewStudent = (submission) => {
    const student = submission.userId || submission.user;
    console.log('Viewing student details:', student);
    if (student) {
      setViewingStudent(student);
      setViewStudentModalOpen(true);
    } else {
      toast.error('Student details not available');
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
              onClick={() => handleViewStudent(submission)}
              className="p-2 hover:bg-zocc-blue-800 rounded-lg transition-colors"
              title="View Student Details"
            >
              <User size={18} className="text-zocc-blue-400" />
            </button>
            <button
              onClick={() => handleEdit(submission)}
              className="p-2 hover:bg-zocc-blue-800 rounded-lg transition-colors"
              title="Edit Details"
            >
              <Edit2 size={18} className="text-zocc-blue-400" />
            </button>
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

      {/* Edit Submission Modal */}
      {editModalOpen && editingSubmission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zocc-blue-900 border border-zocc-blue-700 rounded-lg p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Edit Submission</h2>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingSubmission(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmission} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-zocc-blue-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Student Notes (Editable)
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-zocc-blue-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500 min-h-[100px]"
                  placeholder="Student notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Admin Feedback
                </label>
                <textarea
                  value={editForm.feedback}
                  onChange={(e) => setEditForm({ ...editForm, feedback: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-zocc-blue-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500 min-h-[100px]"
                  placeholder="Feedback for student..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingSubmission(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-zocc-blue-600 text-white hover:bg-zocc-blue-500 transition-colors flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {viewStudentModalOpen && viewingStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zocc-blue-900 border border-zocc-blue-700 rounded-lg p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <User size={24} className="text-zocc-blue-400" />
                Student Details
              </h2>
              <button
                onClick={() => {
                  setViewStudentModalOpen(false);
                  setViewingStudent(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-black/40 p-4 rounded-lg border border-zocc-blue-800">
                <p className="text-sm text-gray-400 mb-1">Full Name</p>
                <p className="text-lg font-semibold text-white">
                  {viewingStudent.studentFullName || viewingStudent.name || viewingStudent.email || 'N/A'}
                  {(!viewingStudent.studentFullName && !viewingStudent.name) && <span className="text-xs text-gray-500 ml-2">(Name not set)</span>}
                </p>
              </div>

              <div className="bg-black/40 p-4 rounded-lg border border-zocc-blue-800">
                <p className="text-sm text-gray-400 mb-1">Email Address</p>
                <p className="text-white">{viewingStudent.email || 'N/A'}</p>
              </div>

              <div className="bg-black/40 p-4 rounded-lg border border-zocc-blue-800">
                <p className="text-sm text-gray-400 mb-1">ID Number</p>
                <p className="text-white font-mono">{viewingStudent.idNumber || 'N/A'}</p>
              </div>

              <div className="bg-black/40 p-4 rounded-lg border border-zocc-blue-800">
                <p className="text-sm text-gray-400 mb-1">Phone Number</p>
                <p className="text-white">{viewingStudent.phone || 'N/A'}</p>
              </div>

              <div className="bg-black/40 p-4 rounded-lg border border-zocc-blue-800">
                <p className="text-sm text-gray-400 mb-1">Role</p>
                <span className="px-2 py-1 rounded text-xs bg-zocc-blue-600/30 text-zocc-blue-300 border border-zocc-blue-600/50">
                  {viewingStudent.role || 'STUDENT'}
                </span>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setViewStudentModalOpen(false);
                  setViewingStudent(null);
                }}
                className="px-4 py-2 rounded-lg bg-zocc-blue-600 text-white hover:bg-zocc-blue-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsApproval;
