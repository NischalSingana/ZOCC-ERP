import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { API_URL } from '../utils/apiUrl';
import toast from 'react-hot-toast';
import { FolderKanban, Download, Upload, XCircle, FileText, Eye, Loader, ArrowLeft } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/projects');
      if (response.data?.success) {
        setProjects(response.data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setViewModalOpen(true);
  };

  const handleJoinFromView = () => {
    setViewModalOpen(false);
    setJoinModalOpen(true);
    setSelectedFile(null);
    setNotes('');
    setUploadError('');
  };

  const handleJoinProject = (project) => {
    setSelectedProject(project);
    setJoinModalOpen(true);
    setSelectedFile(null);
    setNotes('');
    setUploadError('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB');
        return;
      }
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/x-zip-compressed'
      ];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Only images, PDFs, Word documents, and ZIP files are allowed');
        return;
      }
      setSelectedFile(file);
      setUploadError('');
    }
  };

  const handleDownloadFile = async (fileUrl) => {
    try {
      const token = localStorage.getItem('authToken');
      let downloadUrl = fileUrl;
      let fileName = fileUrl.split('/').pop() || 'file';

      // Decode URL-encoded filename
      try {
        fileName = decodeURIComponent(fileName);
      } catch (e) {
        // If decoding fails, use as is
      }

      // Reference files are stored as R2 paths (reference-files/...)
      // If it's not a full URL, construct the download URL
      if (!fileUrl.startsWith('http')) {
        // If it's already a path like submissions/... or project-submissions/... or reference-files/...
        if (fileUrl.startsWith('submissions/') || fileUrl.startsWith('project-submissions/') || fileUrl.startsWith('reference-files/')) {
          downloadUrl = `${API_URL}/api/files/${encodeURIComponent(fileUrl)}`;
        } else {
          // If it's just a filename (legacy), try to find it in reference-files/ directory
          downloadUrl = `${API_URL}/api/files/${encodeURIComponent(`reference-files/${fileUrl}`)}`;
        }
      }

      if (!token) {
        toast.error('Please log in to download files');
        return;
      }

      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
          // Optionally redirect to login
          return;
        }
        if (response.status === 403) {
          toast.error('Access denied. You do not have permission to access this file.');
          return;
        }
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Download failed: ${response.status} - ${errorText}`);
      }

      // Get the filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        // Try to extract filename from Content-Disposition header
        const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/i) || 
                              contentDisposition.match(/filename="(.+?)"/i) ||
                              contentDisposition.match(/filename=([^;]+)/i);
        if (filenameMatch && filenameMatch[1]) {
          try {
            fileName = decodeURIComponent(filenameMatch[1].trim());
          } catch (e) {
            fileName = filenameMatch[1].trim().replace(/['"]/g, '');
          }
        }
      }

      // Get the blob with proper type
      const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
      
      // Use arrayBuffer to ensure binary data integrity
      const arrayBuffer = await response.arrayBuffer();
      
      // Verify we got data
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // For PDFs, verify it's a valid PDF by checking the first bytes
      if (contentType === 'application/pdf') {
        const pdfHeader = new Uint8Array(arrayBuffer.slice(0, 4));
        const pdfSignature = String.fromCharCode(...pdfHeader);
        if (pdfSignature !== '%PDF') {
          console.warn('File may not be a valid PDF, but continuing download...');
        }
      }
      
      // Create a new blob with the correct type
      const typedBlob = new Blob([arrayBuffer], { type: contentType });
      
      // Extract file extension from filename or content type
      let finalFileName = fileName;
      
      // Clean filename - remove URL encoding and special characters
      finalFileName = finalFileName.replace(/%20/g, ' ').replace(/%[0-9A-F]{2}/gi, (match) => {
        try {
          return decodeURIComponent(match);
        } catch {
          return match;
        }
      });
      
      // Get extension from original filename
      const originalExt = finalFileName.split('.').pop()?.toLowerCase();
      
      // Map content types to extensions
      const contentTypeToExt = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
        'application/zip': 'zip',
        'text/plain': 'txt'
      };
      
      const expectedExt = contentTypeToExt[contentType];
      
      // Ensure filename has correct extension
      if (expectedExt) {
        // Remove any existing extension and add correct one
        const nameWithoutExt = finalFileName.replace(/\.[^.]+$/, '');
        finalFileName = `${nameWithoutExt}.${expectedExt}`;
      } else if (!originalExt) {
        // No extension and can't determine from content type, try to keep original
        console.warn('Could not determine file extension for:', contentType);
      }
      
      // Sanitize filename - remove any remaining problematic characters and URL encoding
      finalFileName = finalFileName
        .replace(/%20/g, ' ')
        .replace(/%[0-9A-F]{2}/gi, (match) => {
          try {
            return decodeURIComponent(match);
          } catch {
            return ' ';
          }
        })
        .replace(/[<>:"/\\|?*]/g, '_')
        .trim();
      
      // For PDFs, download directly instead of trying to open in new tab
      // This ensures the file is saved correctly and can be opened by the system PDF viewer
      const url = window.URL.createObjectURL(typedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 300);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(error.message || 'Failed to download file');
    }
  };

  const handleSubmitProject = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('projectId', selectedProject.id || selectedProject._id);
      if (notes) {
        formData.append('notes', notes);
      }

      const response = await fetch(`${API_URL}/api/project-submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      toast.success('Project submission uploaded successfully!');
      setJoinModalOpen(false);
      setSelectedProject(null);
      setSelectedFile(null);
      setNotes('');
      fetchProjects();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload submission. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-zocc-blue-300">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Club Projects</h1>
          <p className="text-zocc-blue-300">Explore and join exciting coding projects</p>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="dashboard-card text-center py-12">
          <FolderKanban className="mx-auto mb-4 text-zocc-blue-400" size={48} />
          <h3 className="text-white font-semibold text-lg mb-2">No Projects Available</h3>
          <p className="text-zocc-blue-300">Check back later for new projects.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
            <div key={project.id || project._id} className="dashboard-card group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-zocc-blue-600 to-zocc-blue-700">
                  <FolderKanban className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold group-hover:text-zocc-blue-300 transition-colors">
                    {project.title}
                  </h3>
                    <p className="text-sm text-zocc-blue-400">
                      {project.createdBy?.studentFullName || project.createdBy?.name || 'Admin'}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                  project.isActive
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}>
                  {project.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
            </div>

              <p className="text-zocc-blue-300 mb-4 text-sm line-clamp-3">{project.description}</p>

              {/* Reference Files Preview */}
              {project.referenceFiles && project.referenceFiles.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-zocc-blue-400 mb-2">
                    {project.referenceFiles.length} Reference File{project.referenceFiles.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* View/Join Button */}
              <div className="mt-4">
                {project.isActive ? (
                  <button
                    onClick={() => handleViewProject(project)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all font-medium"
                  >
                    View Project
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-2 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed font-medium"
                  >
                    Project Inactive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Project Modal */}
      {viewModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zocc-blue-900 to-zocc-blue-800 rounded-xl border border-zocc-blue-700/50 p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">{selectedProject.title}</h3>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  setSelectedProject(null);
                }}
                className="text-zocc-blue-300 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Project Creator */}
              <div>
                <h4 className="text-sm font-medium text-zocc-blue-300 mb-1">Created By</h4>
                <p className="text-zocc-blue-200 text-sm">
                  {selectedProject.createdBy?.studentFullName || selectedProject.createdBy?.name || 'Admin'}
                </p>
              </div>

              {/* Project Description */}
              <div>
                <h4 className="text-sm font-medium text-zocc-blue-300 mb-2">Project Description</h4>
                <p className="text-zocc-blue-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>

              {/* Reference Files */}
              {selectedProject.referenceFiles && selectedProject.referenceFiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zocc-blue-300 mb-3">Reference Files</h4>
                  <div className="space-y-2">
                    {selectedProject.referenceFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-zocc-blue-800/50 rounded-lg border border-zocc-blue-700/30"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="text-zocc-blue-400 flex-shrink-0" size={18} />
                          <span className="text-white text-sm truncate">
                            {file.startsWith('reference-files/') ? file.split('/').pop() : file}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDownloadFile(file)}
                          className="flex items-center gap-1 px-3 py-1 bg-zocc-blue-600 hover:bg-zocc-blue-500 text-white rounded text-sm transition-colors flex-shrink-0 ml-2"
                        >
                          <Download size={14} />
                          Download
                        </button>
                  </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Join Project Button */}
              <div className="flex gap-4 pt-4 border-t border-zocc-blue-700/50">
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    setSelectedProject(null);
                  }}
                  className="flex-1 px-4 py-3 bg-zocc-blue-800 text-white rounded-lg hover:bg-zocc-blue-700 transition-all font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleJoinFromView}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-500 hover:to-green-400 transition-all font-medium"
                >
                  Join Project
                </button>
              </div>
            </div>
          </div>
      </div>
      )}

      {/* Join Project Modal */}
      {joinModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zocc-blue-900 to-zocc-blue-800 rounded-xl border border-zocc-blue-700/50 p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setJoinModalOpen(false);
                    handleViewProject(selectedProject);
                  }}
                  className="text-zocc-blue-300 hover:text-white"
                  disabled={uploading}
                >
                  <ArrowLeft size={20} />
                </button>
                <h3 className="text-xl font-semibold text-white">Join Project: {selectedProject.title}</h3>
              </div>
              <button
                onClick={() => {
                  setJoinModalOpen(false);
                  setSelectedProject(null);
                  setSelectedFile(null);
                  setNotes('');
                  setUploadError('');
                }}
                className="text-zocc-blue-300 hover:text-white"
                disabled={uploading}
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Project Description */}
              <div>
                <h4 className="text-sm font-medium text-zocc-blue-300 mb-2">Project Description</h4>
                <p className="text-zocc-blue-200 text-sm whitespace-pre-wrap">{selectedProject.description}</p>
              </div>

              {/* Reference Files */}
              {selectedProject.referenceFiles && selectedProject.referenceFiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zocc-blue-300 mb-3">Reference Files</h4>
                  <div className="space-y-2">
                    {selectedProject.referenceFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-zocc-blue-800/50 rounded-lg border border-zocc-blue-700/30"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="text-zocc-blue-400 flex-shrink-0" size={18} />
                          <span className="text-white text-sm truncate">
                            {file.startsWith('reference-files/') ? file.split('/').pop() : file}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDownloadFile(file)}
                          className="flex items-center gap-1 px-3 py-1 bg-zocc-blue-600 hover:bg-zocc-blue-500 text-white rounded text-sm transition-colors flex-shrink-0 ml-2"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div>
                <h4 className="text-sm font-medium text-zocc-blue-300 mb-3">Upload Your Submission</h4>
                <div className="border-2 border-dashed border-zocc-blue-600 rounded-lg p-6 text-center hover:border-zocc-blue-500 transition-colors">
                <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,application/x-zip-compressed"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="project-file-input"
                    disabled={uploading}
                  />
                  <label htmlFor="project-file-input" className="cursor-pointer">
                    <Upload className="mx-auto mb-2 text-zocc-blue-400" size={32} />
                    <p className="text-zocc-blue-300 text-sm">
                      {selectedFile ? selectedFile.name : 'Click to browse or drag and drop'}
                    </p>
                    {selectedFile && (
                      <p className="text-zocc-blue-400 text-xs mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </label>
                </div>
                {uploadError && (
                  <p className="text-red-400 text-sm mt-2">{uploadError}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                    className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                  placeholder="Add any additional notes about your submission..."
                  disabled={uploading}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setJoinModalOpen(false);
                    handleViewProject(selectedProject);
                  }}
                  className="flex-1 px-4 py-3 bg-zocc-blue-800 text-white rounded-lg hover:bg-zocc-blue-700 transition-all font-medium"
                  disabled={uploading}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitProject}
                  disabled={uploading || !selectedFile}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-500 hover:to-green-400 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      Uploading...
                    </>
                  ) : (
                    'Submit Project'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;

