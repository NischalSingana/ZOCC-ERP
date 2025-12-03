import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import Table from '../../components/Table';
import { showToast } from '../../utils/toastUtils';
import { Plus, Edit, Trash2, Megaphone, Eye, EyeOff } from 'lucide-react';

const AnnouncementsAdmin = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    published: true, // Default to published
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/announcements');
      if (response.data?.success) {
        setAnnouncements(response.data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      showToast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const announcementId = editingAnnouncement?.id || editingAnnouncement?._id;
      const url = editingAnnouncement
        ? `/api/announcements/${announcementId}`
        : '/api/announcements';
      const method = editingAnnouncement ? 'put' : 'post';

      const response = await axiosInstance[method](url, formData);

      if (response.data?.success) {
        showToast.success(
          editingAnnouncement ? 'Announcement updated!' : 'Announcement created!'
        );
        setShowForm(false);
        setEditingAnnouncement(null);
        setFormData({ title: '', content: '', published: true });
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      showToast.error('Failed to save announcement');
    }
  };

  const handleDelete = async (announcementId) => {
    if (!announcementId) {
      showToast.error('Invalid announcement ID');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const idString = announcementId?.toString() || announcementId;
      await axiosInstance.delete(`/api/announcements/${idString}`);
      showToast.success('Announcement deleted!');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      showToast.error(error.response?.data?.error || 'Failed to delete announcement');
    }
  };

  const handleTogglePublish = async (announcement) => {
    try {
      const announcementId = announcement?.id || announcement?._id;
      await axiosInstance.put(`/api/announcements/${announcementId}`, {
        published: !announcement.published,
      });
      showToast.success(
        announcement.published ? 'Announcement unpublished!' : 'Announcement published!'
      );
      fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling publish:', error);
      showToast.error('Failed to update announcement');
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title || '',
      content: announcement.content || '',
      published: announcement.published || false,
    });
    setShowForm(true);
  };

  const columns = [
    { key: 'title', header: 'Title' },
    {
      key: 'published',
      header: 'Status',
      render: (announcement) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            announcement.published
              ? 'bg-green-500/20 text-green-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}
        >
          {announcement.published ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (announcement) =>
        new Date(announcement.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (announcement) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleTogglePublish(announcement)}
            className="p-2 hover:bg-zocc-blue-800 rounded-lg transition-colors"
            title={announcement.published ? 'Unpublish' : 'Publish'}
          >
            {announcement.published ? (
              <EyeOff size={18} className="text-yellow-400" />
            ) : (
              <Eye size={18} className="text-green-400" />
            )}
          </button>
          <button
            onClick={() => handleEdit(announcement)}
            className="p-2 hover:bg-zocc-blue-800 rounded-lg transition-colors"
          >
            <Edit size={18} className="text-zocc-blue-400" />
          </button>
          <button
            onClick={() => handleDelete(announcement.id || announcement._id)}
            className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 size={18} className="text-red-400" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="text-white">Loading announcements...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Megaphone size={32} />
          Announcements Management
        </h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingAnnouncement(null);
            setFormData({ title: '', content: '', published: true });
          }}
          className="px-6 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          New Announcement
        </button>
      </div>

      {showForm && (
        <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
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
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4 text-zocc-blue-600 bg-zocc-blue-800 border-zocc-blue-700 rounded focus:ring-zocc-blue-500"
              />
              <label htmlFor="published" className="text-sm text-zocc-blue-300">
                Publish immediately
              </label>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all"
              >
                {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAnnouncement(null);
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
          data={announcements}
          columns={columns}
          keyExtractor={(item) => item.id || item._id}
          emptyMessage="No announcements found"
        />
      </div>
    </div>
  );
};

export default AnnouncementsAdmin;

