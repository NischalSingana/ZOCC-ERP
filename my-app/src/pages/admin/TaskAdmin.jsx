import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import Table from '../../components/Table';
import { showToast } from '../../utils/toastUtils';
import { Plus, Edit, Trash2, CheckSquare, FileText, XCircle, Upload } from 'lucide-react';

const TaskAdmin = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isActive: true,
  });
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const taskId = editingTask?.id || editingTask?._id;
      const url = editingTask ? `/api/tasks/${taskId}` : '/api/tasks';
      const method = editingTask ? 'put' : 'post';

      // Separate files that need uploading from already uploaded files (strings)
      const filesToUpload = attachments.filter(file => file instanceof File);
      const existingFiles = attachments.filter(file => typeof file === 'string' && (file.startsWith('task-attachments/') || file.startsWith('reference-files/')));

      let uploadedFilePaths = [...existingFiles];

      // Upload new files if any
      if (filesToUpload.length > 0) {
        setUploadingFiles(true);
        const formData = new FormData();
        filesToUpload.forEach(file => {
          formData.append('files', file);
        });

        try {
          const uploadResponse = await axiosInstance.post('/api/tasks/attachments', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          if (uploadResponse.data?.success && uploadResponse.data?.files) {
            uploadedFilePaths = [...uploadedFilePaths, ...uploadResponse.data.files];
            showToast.success(`${filesToUpload.length} file(s) uploaded successfully`);
          } else {
            throw new Error('File upload failed');
          }
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
          const errorMessage = uploadError.response?.data?.error || 
                              uploadError.response?.data?.message ||
                              uploadError.message || 
                              'Failed to upload attachments';
          showToast.error(errorMessage);
          setUploadingFiles(false);
          return;
        } finally {
          setUploadingFiles(false);
        }
      }

      // Save task with uploaded file paths
      const response = await axiosInstance[method](url, {
        ...formData,
        attachments: uploadedFilePaths,
      });

      if (response.data?.success) {
        showToast.success(editingTask ? 'Task updated!' : 'Task created!');
        setShowForm(false);
        setEditingTask(null);
        setFormData({ title: '', content: '', isActive: true });
        setAttachments([]);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error saving task:', error);
      showToast.error(error.response?.data?.error || 'Failed to save task');
    }
  };

  const handleDelete = async (taskId) => {
    if (!taskId) {
      showToast.error('Invalid task ID');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const idString = taskId?.toString() || taskId;
      await axiosInstance.delete(`/api/tasks/${idString}`);
      showToast.success('Task deleted!');
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast.error(error.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      content: task.content || '',
      isActive: task.isActive !== undefined ? task.isActive : true,
    });
    setAttachments(task.attachments || []);
    setShowForm(true);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    
    // Check if we already have 3 files
    if (attachments.length >= 3) {
      showToast.error('Maximum 3 files allowed per task');
      return;
    }
    
    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      showToast.error(`File size exceeds 5MB limit. Selected file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }
    
    setAttachments([...attachments, file]);
  };

  const columns = [
    { key: 'title', header: 'Title', cellClassName: 'font-semibold' },
    {
      key: 'content',
      header: 'Content',
      cellClassName: 'align-top',
      render: (task) => (
        <span className="text-zocc-blue-300 text-sm line-clamp-2 max-w-md">
          {task.content || 'No content'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (task) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            task.isActive
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {task.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'attachments',
      header: 'Attachments',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (task) => (
        <span className="text-zocc-blue-300 text-sm">
          {task.attachments?.length || 0} file(s)
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      headerClassName: 'text-center',
      cellClassName: 'text-center whitespace-nowrap',
      render: (task) => 
        task.createdAt 
          ? new Date(task.createdAt).toLocaleDateString()
          : 'N/A',
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (task) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleEdit(task)}
            className="p-2 hover:bg-zocc-blue-800 rounded-lg transition-colors"
          >
            <Edit size={18} className="text-zocc-blue-400" />
          </button>
          <button
            onClick={() => handleDelete(task.id || task._id)}
            className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 size={18} className="text-red-400" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="text-white">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <CheckSquare size={32} />
          Task Management
        </h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingTask(null);
            setFormData({ title: '', content: '', isActive: true });
            setAttachments([]);
          }}
          className="px-6 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          New Task
        </button>
      </div>

      {showForm && (
        <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                Task Content (Text) *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                placeholder="Enter the task details, instructions, or any relevant information..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                Attachments (Optional)
              </label>
              <p className="text-xs text-zocc-blue-400 mb-2">
                Upload screenshots, PDFs, Word documents, or other files related to this task (Max 3 files, 5MB each)
              </p>
              <div className="border-2 border-dashed border-zocc-blue-700/30 rounded-lg p-6 hover:border-zocc-blue-500/50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.zip,.txt"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => handleFileSelect(file));
                    e.target.value = ''; // Reset input
                  }}
                  disabled={uploadingFiles || attachments.length >= 3}
                  className="hidden"
                  id="task-attachments-input"
                />
                <label
                  htmlFor="task-attachments-input"
                  className={`cursor-pointer flex flex-col items-center justify-center ${uploadingFiles || attachments.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload size={32} className="text-zocc-blue-400 mb-2" />
                  <p className="text-zocc-blue-300 text-sm">
                    {attachments.length >= 3 
                      ? 'Maximum 3 files reached' 
                      : 'Click to select files or drag and drop'}
                  </p>
                  <p className="text-xs text-zocc-blue-400 mt-1">
                    {attachments.length}/3 files selected • Max 5MB per file
                  </p>
                </label>
              </div>
              {attachments.length >= 3 && (
                <p className="text-xs text-yellow-400 mt-1">Maximum 3 files reached</p>
              )}
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-zocc-blue-300 bg-zocc-blue-800/30 p-2 rounded">
                      <FileText size={16} />
                      <span className="flex-1 truncate">
                        {typeof file === 'string' 
                          ? (file.startsWith('task-attachments/') || file.startsWith('reference-files/') 
                              ? file.split('/').pop() 
                              : file)
                          : file.name}
                      </span>
                      {typeof file === 'object' && file.size && (
                        <span className="text-xs text-zocc-blue-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const newFiles = attachments.filter((_, i) => i !== idx);
                          setAttachments(newFiles);
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-zocc-blue-600 bg-zocc-blue-800 border-zocc-blue-700 rounded focus:ring-zocc-blue-500"
              />
              <label htmlFor="isActive" className="text-sm text-zocc-blue-300">
                Active (visible to students)
              </label>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploadingFiles}
                className="px-6 py-2 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingFiles ? 'Uploading...' : (editingTask ? 'Update Task' : 'Create Task')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTask(null);
                }}
                className="px-6 py-2 bg-zocc-blue-800/50 text-white rounded-lg hover:bg-zocc-blue-700/50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
        <Table
          data={tasks}
          columns={columns}
          keyExtractor={(item) => item.id || item._id}
          emptyMessage="No tasks found"
        />
      </div>
    </div>
  );
};

export default TaskAdmin;

