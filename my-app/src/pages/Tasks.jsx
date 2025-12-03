import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { API_URL } from '../utils/apiUrl';
import { showToast } from '../utils/toastUtils';
import { CheckSquare, Download, FileText, Eye, XCircle } from 'lucide-react';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/tasks');
      if (response.data?.success) {
        setTasks(response.data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      showToast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setViewModalOpen(true);
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

      // Task attachments are stored as R2 paths (task-attachments/...)
      // If it's not a full URL, construct the download URL
      if (!fileUrl.startsWith('http')) {
        if (fileUrl.startsWith('task-attachments/') || fileUrl.startsWith('reference-files/')) {
          downloadUrl = `${API_URL}/api/files/${encodeURIComponent(fileUrl)}`;
        } else {
          // Legacy support for old reference-files paths
          downloadUrl = `${API_URL}/api/files/${encodeURIComponent(`task-attachments/${fileUrl}`)}`;
        }
      }

      if (!token) {
        showToast.error('Please log in to download files');
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
          showToast.error('Authentication failed. Please log in again.');
          return;
        }
        if (response.status === 403) {
          showToast.error('Access denied. You do not have permission to access this file.');
          return;
        }
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Download failed: ${response.status} - ${errorText}`);
      }

      // Get the filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
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
      const arrayBuffer = await response.arrayBuffer();
      
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      const typedBlob = new Blob([arrayBuffer], { type: contentType });
      
      // Extract file extension from filename or content type
      let finalFileName = fileName;
      
      // Clean filename
      finalFileName = finalFileName.replace(/%20/g, ' ').replace(/%[0-9A-F]{2}/gi, (match) => {
        try {
          return decodeURIComponent(match);
        } catch {
          return match;
        }
      });
      
      const originalExt = finalFileName.split('.').pop()?.toLowerCase();
      
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
      
      if (expectedExt) {
        const nameWithoutExt = finalFileName.replace(/\.[^.]+$/, '');
        finalFileName = `${nameWithoutExt}.${expectedExt}`;
      }
      
      // Sanitize filename
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
      
      const url = window.URL.createObjectURL(typedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 300);
      
      showToast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      showToast.error(error.message || 'Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-zocc-blue-300">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Tasks</h1>
        </div>
      </div>

      {/* Tasks Grid */}
      {tasks.length === 0 ? (
        <div className="dashboard-card text-center py-12">
          <CheckSquare className="mx-auto mb-4 text-zocc-blue-400" size={48} />
          <h3 className="text-white font-semibold text-lg mb-2">No Tasks Available</h3>
          <p className="text-zocc-blue-300">Check back later for new tasks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <div key={task.id || task._id} className="dashboard-card group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-zocc-blue-600 to-zocc-blue-700">
                    <CheckSquare className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold group-hover:text-zocc-blue-300 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-sm text-zocc-blue-400">
                      {task.createdBy?.studentFullName || task.createdBy?.name || 'Admin'}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                  task.isActive
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}>
                  {task.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <p className="text-zocc-blue-300 mb-4 text-sm line-clamp-3">{task.content}</p>

              {/* Attachments Preview */}
              {task.attachments && task.attachments.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-zocc-blue-400 mb-2">
                    {task.attachments.length} Attachment{task.attachments.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* View Button */}
              <div className="mt-4">
                {task.isActive ? (
                  <button
                    onClick={() => handleViewTask(task)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Eye size={18} />
                    View Task
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-2 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed font-medium"
                  >
                    Task Inactive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Task Modal */}
      {viewModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zocc-blue-900 to-zocc-blue-800 rounded-xl border border-zocc-blue-700/50 p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">{selectedTask.title}</h3>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  setSelectedTask(null);
                }}
                className="text-zocc-blue-300 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Task Creator */}
              <div>
                <h4 className="text-sm font-medium text-zocc-blue-300 mb-1">Created By</h4>
                <p className="text-zocc-blue-200 text-sm">
                  {selectedTask.createdBy?.studentFullName || selectedTask.createdBy?.name || 'Admin'}
                </p>
              </div>

              {/* Task Content */}
              <div>
                <h4 className="text-sm font-medium text-zocc-blue-300 mb-2">Task Content</h4>
                <p className="text-zocc-blue-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedTask.content}
                </p>
              </div>

              {/* Attachments */}
              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zocc-blue-300 mb-3">Attachments</h4>
                  <div className="space-y-2">
                    {selectedTask.attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-zocc-blue-800/50 rounded-lg border border-zocc-blue-700/30"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="text-zocc-blue-400 flex-shrink-0" size={18} />
                          <span className="text-white text-sm truncate">
                            {file.startsWith('task-attachments/') || file.startsWith('reference-files/') 
                              ? file.split('/').pop() 
                              : file}
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

              {/* Close Button */}
              <div className="flex gap-4 pt-4 border-t border-zocc-blue-700/50">
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    setSelectedTask(null);
                  }}
                  className="w-full px-4 py-3 bg-zocc-blue-800 text-white rounded-lg hover:bg-zocc-blue-700 transition-all font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;

