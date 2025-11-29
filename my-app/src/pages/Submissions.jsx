import { useState, useEffect } from 'react';
import { Upload, Eye, CheckCircle, Clock, XCircle, Loader, FileText, Image as ImageIcon } from 'lucide-react';
import { API_URL } from '../utils/apiUrl';

const Submissions = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [notes, setNotes] = useState('');
  const [sessions, setSessions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  useEffect(() => {
    fetchSessions();
    fetchSubmissions();
  }, []);

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

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const submissionsData = data.submissions || [];
        // Log submissions for debugging
        console.log('Submissions fetched:', submissionsData);
        setSubmissions(submissionsData);
      } else {
        console.error('Failed to fetch submissions:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return;
      }
      // Allow images, PDFs, and Word documents
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Only images (JPG, PNG, GIF, WEBP, SVG), PDFs, and Word documents (DOC, DOCX) are allowed');
        return;
      }
      setSelectedFile(file);
      setUploadError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedSessionId) {
      setUploadError('Please select a file and session');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('sessionId', selectedSessionId);
      if (notes) {
        formData.append('notes', notes);
      }

      const res = await fetch(`${API_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Refresh submissions list
      await fetchSubmissions();

      // Reset form
      setUploadModalOpen(false);
      setSelectedFile(null);
      setSelectedSessionId('');
      setNotes('');
      setUploadError('');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload submission. Please try again.');
    } finally {
      setUploading(false);
    }
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
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="text-zocc-blue-400 animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">My Submissions</h1>
          <p className="text-zocc-blue-300">Track and manage your session outputs</p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all shadow-lg shadow-zocc-blue-500/25 hover:shadow-xl hover:shadow-zocc-blue-500/40"
        >
          <Upload size={20} />
          Upload Output
        </button>
      </div>

      {/* Submissions Grid */}
      {submissions.length === 0 ? (
        <div className="dashboard-card text-center py-12">
          <Upload className="mx-auto mb-4 text-zocc-blue-400" size={48} />
          <h3 className="text-white font-semibold text-lg mb-2">No Submissions Yet</h3>
          <p className="text-zocc-blue-300">Upload your first session output to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((submission) => (
            <div key={submission._id} className="dashboard-card group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-zocc-blue-600/20">
                  {getStatusIcon(submission.status)}
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                  {submission.status?.toUpperCase() || 'PENDING'}
                </span>
              </div>

              {(submission.fileUrl || submission.imageUrl) && (
                <div className="mb-4 rounded-lg overflow-hidden bg-zocc-blue-800/30">
                  {(() => {
                    let fileUrl = submission.fileUrl || submission.imageUrl;
                    const fileType = submission.fileType || 'image';

                    // Use proxy endpoint if fileUrl is from R2 and direct access fails
                    // This helps bypass CORS issues
                    if (fileUrl && fileUrl.includes('r2.dev')) {
                      // Extract the file path from the R2 URL
                      const urlMatch = fileUrl.match(/r2\.dev\/(.+)$/);
                      if (urlMatch && urlMatch[1]) {
                        fileUrl = `${API_URL}/api/files/${urlMatch[1]}`;
                      }
                    }

                    if (fileType === 'image') {
                      return (
                        <>
                          <img
                            src={fileUrl}
                            alt="Submission"
                            className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                            loading="lazy"
                            onClick={() => {
                              setSelectedImageUrl(fileUrl);
                              setImageModalOpen(true);
                            }}
                            onError={(e) => {
                              console.error('Image failed to load:', fileUrl);
                              e.target.style.display = 'none';
                              const fallback = e.target.parentElement.querySelector('.file-fallback');
                              if (fallback) {
                                fallback.style.display = 'flex';
                                fallback.classList.remove('hidden');
                              }
                            }}
                            onLoad={(e) => {
                              const fallback = e.target.parentElement.querySelector('.file-fallback');
                              if (fallback) {
                                fallback.style.display = 'none';
                                fallback.classList.add('hidden');
                              }
                            }}
                          />
                          <div
                            className="file-fallback hidden items-center justify-center h-32 bg-zocc-blue-800/50 flex-col cursor-pointer hover:bg-zocc-blue-700/50 transition-colors"
                            onClick={() => {
                              const fallbackUrl = fileUrl.includes('r2.dev') ? `${API_URL}/api/files/${fileUrl.match(/r2\.dev\/(.+)$/)?.[1] || ''}` : fileUrl;
                              setSelectedImageUrl(fallbackUrl);
                              setImageModalOpen(true);
                            }}
                          >
                            <ImageIcon className="text-zocc-blue-400 mb-2" size={32} />
                            <p className="text-zocc-blue-300 text-sm">Image not available</p>
                            <a
                              href={fileUrl.includes('r2.dev') ? `${API_URL}/api/files/${fileUrl.match(/r2\.dev\/(.+)$/)?.[1] || ''}` : fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zocc-blue-400 text-xs mt-2 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open in new tab
                            </a>
                          </div>
                        </>
                      );
                    } else {
                      // For PDFs and Word docs, use proxy if from R2
                      let downloadUrl = fileUrl;
                      if (fileUrl && fileUrl.includes('r2.dev')) {
                        const urlMatch = fileUrl.match(/r2\.dev\/(.+)$/);
                        if (urlMatch && urlMatch[1]) {
                          downloadUrl = `${API_URL}/api/files/${urlMatch[1]}`;
                        }
                      }

                      return (
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center h-32 bg-zocc-blue-800/50 hover:bg-zocc-blue-700/50 transition-colors"
                        >
                          <div className="text-center">
                            {fileType === 'pdf' ? (
                              <FileText className="mx-auto mb-2 text-red-400" size={32} />
                            ) : (
                              <FileText className="mx-auto mb-2 text-blue-400" size={32} />
                            )}
                            <p className="text-xs text-zocc-blue-300">{submission.fileName || 'Download File'}</p>
                            <p className="text-xs text-zocc-blue-400 mt-1">
                              {fileType?.toUpperCase() || 'FILE'}
                            </p>
                          </div>
                        </a>
                      );
                    }
                  })()}
                </div>
              )}

              <h3 className="text-white font-semibold mb-2 group-hover:text-zocc-blue-300 transition-colors">
                {submission.sessionId?.title || 'Session'}
              </h3>
              {submission.sessionId && (
                <>
                  <p className="text-sm text-zocc-blue-400 mb-1">
                    Date: {submission.sessionId.date ? formatDate(submission.sessionId.date) : 'N/A'}
                  </p>
                  {submission.sessionId.venue && (
                    <p className="text-sm text-zocc-blue-400 mb-4">
                      Venue: {submission.sessionId.venue}
                    </p>
                  )}
                </>
              )}
              {!submission.sessionId && (
                <p className="text-sm text-zocc-blue-400 mb-4">Session information not available</p>
              )}

              {submission.notes && (
                <div className="bg-zocc-blue-800/30 rounded-lg p-3 border border-zocc-blue-700/30 mb-4">
                  <p className="text-sm text-zocc-blue-200">{submission.notes}</p>
                </div>
              )}

              {submission.feedback && (
                <div className="bg-zocc-blue-800/30 rounded-lg p-3 border border-zocc-blue-700/30">
                  <p className="text-sm text-zocc-blue-200">
                    <span className="font-semibold">Feedback: </span>
                    {submission.feedback}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zocc-blue-900 to-zocc-blue-800 rounded-xl border border-zocc-blue-700/50 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Upload Submission</h3>
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setSelectedFile(null);
                  setSelectedSessionId('');
                  setNotes('');
                  setUploadError('');
                }}
                className="text-zocc-blue-300 hover:text-white"
                disabled={uploading}
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Select File (Images, PDFs, Word Docs - Max 5MB)
                </label>
                <div className="border-2 border-dashed border-zocc-blue-600 rounded-lg p-6 text-center hover:border-zocc-blue-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                    disabled={uploading}
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <Upload className="mx-auto mb-2 text-zocc-blue-400" size={32} />
                    <p className="text-zocc-blue-300 text-sm">
                      {selectedFile ? selectedFile.name : 'Click to browse or drag and drop'}
                    </p>
                    {selectedFile && (
                      <p className="text-zocc-blue-400 text-xs mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type.includes('image') ? 'Image' : selectedFile.type.includes('pdf') ? 'PDF' : 'Word Document'}
                      </p>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Session *
                </label>
                <select
                  className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  disabled={uploading}
                >
                  <option value="">Select a session</option>
                  {sessions.map((session) => (
                    <option key={session._id} value={session._id}>
                      {session.title} - {new Date(session.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500 min-h-[100px]"
                  placeholder="Add any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={uploading}
                ></textarea>
              </div>

              {uploadError && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{uploadError}</p>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || !selectedSessionId || uploading}
                className="w-full px-4 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Upload Submission
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image View Modal - Full Screen */}
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
              alt="Full size submission"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={() => {
                console.error('Image failed to load in modal:', selectedImageUrl);
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

export default Submissions;
