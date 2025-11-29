import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { API_URL } from '../utils/apiUrl';
import toast from 'react-hot-toast';
import { FolderKanban, Download, Upload, XCircle, FileText, Eye, Loader } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
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

      // If it's a reference file path, construct the download URL
      if (fileUrl.startsWith('submissions/') && !fileUrl.startsWith('http')) {
        downloadUrl = `${API_URL}/api/files/${encodeURIComponent(fileUrl)}`;
      }

      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileUrl.split('/').pop() || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
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

              {/* Reference Files */}
              {project.referenceFiles && project.referenceFiles.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-zocc-blue-400 mb-2">Reference Files:</p>
                  <div className="flex flex-wrap gap-2">
                    {project.referenceFiles.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleDownloadFile(file)}
                        className="flex items-center gap-1 px-2 py-1 bg-zocc-blue-800/50 rounded text-xs text-zocc-blue-300 hover:bg-zocc-blue-700/50 transition-colors"
                      >
                        <FileText size={14} />
                        <span className="truncate max-w-[100px]">{file}</span>
                        <Download size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Join Button */}
              <div className="mt-4">
                {project.isActive ? (
                  <button
                    onClick={() => handleJoinProject(project)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-500 hover:to-green-400 transition-all font-medium"
                  >
                    Join Project
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

      {/* Join Project Modal */}
      {joinModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zocc-blue-900 to-zocc-blue-800 rounded-xl border border-zocc-blue-700/50 p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Join Project: {selectedProject.title}</h3>
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
                        <div className="flex items-center gap-2">
                          <FileText className="text-zocc-blue-400" size={18} />
                          <span className="text-white text-sm">{file}</span>
                        </div>
                        <button
                          onClick={() => handleDownloadFile(file)}
                          className="flex items-center gap-1 px-3 py-1 bg-zocc-blue-600 hover:bg-zocc-blue-500 text-white rounded text-sm transition-colors"
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
                    setSelectedProject(null);
                    setSelectedFile(null);
                    setNotes('');
                    setUploadError('');
                  }}
                  className="flex-1 px-4 py-3 bg-zocc-blue-800 text-white rounded-lg hover:bg-zocc-blue-700 transition-all font-medium"
                  disabled={uploading}
                >
                  Cancel
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
