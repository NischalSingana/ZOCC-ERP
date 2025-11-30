import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import Table from '../../components/Table';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Download, FileText, Filter, Eye, Clock, User, FolderKanban } from 'lucide-react';
import { API_URL } from '../../utils/apiUrl';

const ProjectSubmissionsApproval = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

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
      const response = await axiosInstance.get('/api/project-submissions');
      if (response.data?.success) {
        let submissionsData = response.data.submissions || [];
        
        // Filter by status
        if (filter !== 'all') {
          submissionsData = submissionsData.filter(sub => 
            (sub.status || 'PENDING').toUpperCase() === filter.toUpperCase()
          );
        }
        
        setSubmissions(submissionsData);
      }
    } catch (error) {
      console.error('Error fetching project submissions:', error);
      toast.error('Failed to load project submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submission) => {
    try {
      const response = await axiosInstance.put(`/api/project-submissions/${submission.id || submission._id}`, {
        status: 'ACCEPTED'
      });

      if (response.data?.success) {
        toast.success('Project submission approved');
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error approving submission:', error);
      toast.error(error.response?.data?.error || 'Failed to approve submission');
    }
  };

  const handleReject = async (submission) => {
    try {
      const response = await axiosInstance.put(`/api/project-submissions/${submission.id || submission._id}`, {
        status: 'REJECTED'
      });

      if (response.data?.success) {
        toast.success('Project submission rejected');
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast.error(error.response?.data?.error || 'Failed to reject submission');
    }
  };

  const handleDownload = async (submission) => {
    try {
      const token = localStorage.getItem('authToken');
      let fileUrl = submission.fileUrl;
      
      if (!fileUrl) {
        toast.error('File URL not available');
        return;
      }

      if (!token) {
        toast.error('Please log in to download files');
        return;
      }

      // If fileUrl is a signed URL (starts with http/https), extract the R2 key
      // Otherwise, use it as-is (it should be an R2 key like project-submissions/...)
      let r2Key = fileUrl;
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        // Try to extract the R2 key from signed URL
        try {
          const urlObj = new URL(fileUrl);
          // Signed URLs from R2 typically have the key in the pathname
          const pathMatch = urlObj.pathname.match(/project-submissions\/.+/) || 
                           urlObj.pathname.match(/\/project-submissions\/.+/);
          if (pathMatch) {
            r2Key = pathMatch[0].startsWith('/') ? pathMatch[0].substring(1) : pathMatch[0];
          } else {
            // If we can't extract, try to get from query params or use the original
            // For now, we'll need to store the original key separately or reconstruct it
            console.warn('Could not extract R2 key from signed URL:', fileUrl);
            // Fallback: try to use the submission's stored fileUrl if available
            // But since we're getting signed URLs, we need to handle this differently
            toast.error('Unable to extract file path from URL. Please contact admin.');
            return;
          }
        } catch (e) {
          console.error('Error parsing signed URL:', e);
          toast.error('Invalid file URL format');
          return;
        }
      }

      // Always use the proxy endpoint to avoid CORS issues
      // Ensure r2Key is an R2 key path (project-submissions/...)
      if (!r2Key.startsWith('project-submissions/')) {
        console.error('Invalid R2 key format:', r2Key);
        toast.error('Invalid file path format');
        return;
      }

      const downloadUrl = `${API_URL}/api/files/${encodeURIComponent(r2Key)}`;

      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
          return;
        }
        if (response.status === 403) {
          toast.error('Access denied. You do not have permission to access this file.');
          return;
        }
        if (response.status === 404) {
          toast.error('File not found. It may have been deleted.');
          return;
        }
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Download failed: ${response.status} - ${errorText}`);
      }

      // Get filename from Content-Disposition or use submission fileName
      let fileName = submission.fileName || 'project-submission';
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/i) || 
                              contentDisposition.match(/filename="(.+?)"/i);
        if (filenameMatch && filenameMatch[1]) {
          try {
            fileName = decodeURIComponent(filenameMatch[1].trim());
          } catch (e) {
            fileName = filenameMatch[1].trim().replace(/['"]/g, '');
          }
        }
      }

      // Clean filename
      fileName = fileName.replace(/%20/g, ' ').replace(/[<>:"/\\|?*]/g, '_').trim();

      const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
      const arrayBuffer = await response.arrayBuffer();
      
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Downloaded file is empty');
      }

      const blob = new Blob([arrayBuffer], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 200);

      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(error.message || 'Failed to download file');
    }
  };

  const handleViewImage = (submission) => {
    const fileUrl = submission.fileUrl;
    if (!fileUrl) {
      toast.error('Image URL not available');
      return;
    }

    let imageUrl = fileUrl;
    if (!fileUrl.startsWith('http')) {
      const token = localStorage.getItem('authToken');
      imageUrl = `${API_URL}/api/files/${encodeURIComponent(fileUrl)}?token=${token}`;
    }

    setSelectedImageUrl(imageUrl);
    setImageModalOpen(true);
  };

  const getStatusIcon = (status) => {
    const normalizedStatus = (status?.toUpperCase() || 'PENDING');
    switch (normalizedStatus) {
      case 'ACCEPTED':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'REJECTED':
        return <XCircle className="text-red-400" size={20} />;
      case 'PENDING':
        return <Clock className="text-yellow-400" size={20} />;
      default:
        return <Clock className="text-yellow-400" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    const normalizedStatus = (status?.toUpperCase() || 'PENDING');
    switch (normalizedStatus) {
      case 'ACCEPTED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const columns = [
    {
      key: 'project',
      header: 'Project',
      render: (submission) => {
        const project = submission.projectId || submission.project;
        return (
          <div className="flex items-center gap-2">
            <FolderKanban size={18} className="text-zocc-blue-400" />
            <span className="text-white">{project?.title || 'N/A'}</span>
          </div>
        );
      }
    },
    {
      key: 'student',
      header: 'Student',
      render: (submission) => {
        const student = submission.userId || submission.user;
        return (
          <div className="flex items-center gap-2">
            <User size={18} className="text-zocc-blue-400" />
            <div>
              <div className="text-white">{student?.studentFullName || student?.name || 'N/A'}</div>
              <div className="text-xs text-zocc-blue-400">{student?.email || ''}</div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'fileName',
      header: 'File',
      render: (submission) => (
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-zocc-blue-400" />
          <span className="text-zocc-blue-300 text-sm truncate max-w-xs">
            {submission.fileName || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'fileType',
      header: 'Type',
      render: (submission) => (
        <span className="text-zocc-blue-300 text-sm uppercase">
          {submission.fileType || 'N/A'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (submission) => {
        const status = submission.status || 'PENDING';
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
            {getStatusIcon(status)}
            {status.toUpperCase()}
          </span>
        );
      }
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (submission) => (
        <span className="text-zocc-blue-300 text-sm">
          {submission.submittedAt 
            ? new Date(submission.submittedAt).toLocaleString()
            : 'N/A'}
        </span>
      )
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (submission) => (
        <span className="text-zocc-blue-300 text-sm truncate max-w-xs">
          {submission.notes || '-'}
        </span>
      )
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
                  onClick={() => handleApprove(submission)}
                  className="p-2 hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Approve"
                >
                  <CheckCircle size={18} className="text-green-400" />
                </button>
                <button
                  onClick={() => handleReject(submission)}
                  className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Reject"
                >
                  <XCircle size={18} className="text-red-400" />
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  if (loading) {
    return <div className="text-white">Loading project submissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FolderKanban size={32} />
          Project Submissions
        </h1>
        <div className="flex gap-2">
          {['all', 'pending', 'accepted', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-all capitalize ${
                filter === status
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
          emptyMessage="No project submissions found"
        />
      </div>

      {/* Image View Modal */}
      {imageModalOpen && selectedImageUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <button
              onClick={() => {
                setImageModalOpen(false);
                setSelectedImageUrl(null);
              }}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <XCircle size={24} />
            </button>
            <img
              src={selectedImageUrl}
              alt="Submission preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onError={(e) => {
                console.error('Image load error:', e);
                toast.error('Failed to load image');
                setImageModalOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSubmissionsApproval;

