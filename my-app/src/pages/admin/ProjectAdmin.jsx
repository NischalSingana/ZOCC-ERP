import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import Table from '../../components/Table';
import FileUpload from '../../components/FileUpload';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, FolderKanban, Upload, Eye } from 'lucide-react';

const ProjectAdmin = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isActive: true,
  });
  const [referenceFiles, setReferenceFiles] = useState([]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const projectId = editingProject?.id || editingProject?._id;
      const url = editingProject ? `/api/projects/${projectId}` : '/api/projects';
      const method = editingProject ? 'put' : 'post';

      // Convert referenceFiles to array of strings (URLs or file names)
      // For now, we'll send empty array if files aren't uploaded yet
      const filesToSend = Array.isArray(referenceFiles) 
        ? referenceFiles.map(file => typeof file === 'string' ? file : file.name || file.url || '')
        : [];

      const response = await axiosInstance[method](url, {
        ...formData,
        referenceFiles: filesToSend,
      });

      if (response.data?.success) {
        toast.success(editingProject ? 'Project updated!' : 'Project created!');
        setShowForm(false);
        setEditingProject(null);
        setFormData({ title: '', description: '', isActive: true });
        setReferenceFiles([]);
        fetchProjects();
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(error.response?.data?.error || 'Failed to save project');
    }
  };

  const handleDelete = async (projectId) => {
    if (!projectId) {
      toast.error('Invalid project ID');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const idString = projectId?.toString() || projectId;
      await axiosInstance.delete(`/api/projects/${idString}`);
      toast.success('Project deleted!');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(error.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title || '',
      description: project.description || '',
      isActive: project.isActive !== undefined ? project.isActive : true,
    });
    setReferenceFiles(project.referenceFiles || []);
    setShowForm(true);
  };

  const handleFileSelect = (file) => {
    if (file) {
      setReferenceFiles([...referenceFiles, file]);
    }
  };

  const columns = [
    { key: 'title', header: 'Title' },
    {
      key: 'description',
      header: 'Description',
      render: (project) => (
        <span className="text-zocc-blue-300 text-sm line-clamp-2 max-w-md">
          {project.description || 'No description'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (project) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            project.isActive
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {project.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'referenceFiles',
      header: 'Reference Files',
      render: (project) => (
        <span className="text-zocc-blue-300 text-sm">
          {project.referenceFiles?.length || 0} file(s)
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (project) => 
        project.createdAt 
          ? new Date(project.createdAt).toLocaleDateString()
          : 'N/A',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (project) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(project)}
            className="p-2 hover:bg-zocc-blue-800 rounded-lg transition-colors"
          >
            <Edit size={18} className="text-zocc-blue-400" />
          </button>
          <button
            onClick={() => handleDelete(project.id || project._id)}
            className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 size={18} className="text-red-400" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="text-white">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FolderKanban size={32} />
          Project Management
        </h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingProject(null);
            setFormData({ title: '', description: '', isActive: true });
            setReferenceFiles([]);
          }}
          className="px-6 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      {showForm && (
        <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingProject ? 'Edit Project' : 'Create New Project'}
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
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                Reference Files
              </label>
              <FileUpload
                onFileSelect={handleFileSelect}
                label="Upload reference files"
              />
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
                className="px-6 py-2 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all"
              >
                {editingProject ? 'Update Project' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProject(null);
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
          data={projects}
          columns={columns}
          keyExtractor={(item) => item.id || item._id}
          emptyMessage="No projects found"
        />
      </div>
    </div>
  );
};

export default ProjectAdmin;

