import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { showToast } from '../utils/toastUtils';
import { Megaphone, Calendar, User as UserIcon } from 'lucide-react';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/announcements');
      if (response.data?.success) {
        // Backend already filters published announcements for students
        setAnnouncements(response.data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      showToast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white text-xl">Loading announcements...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Megaphone size={32} />
            Announcements
          </h1>
          <p className="text-zocc-blue-300">Stay updated with latest club news and updates</p>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-12 border border-zocc-blue-700/30 text-center">
            <Megaphone className="mx-auto text-zocc-blue-400 mb-4" size={48} />
            <p className="text-zocc-blue-300">No announcements available at the moment.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id || announcement._id}
              onClick={() => setSelectedAnnouncement(announcement)}
              className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30 cursor-pointer hover:bg-zocc-blue-800/40 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-zocc-blue-600/20">
                    <Megaphone className="text-zocc-blue-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-2">
                      {announcement.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-zocc-blue-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>
                          {new Date(announcement.createdAt || announcement.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {announcement.publishedAt && (
                        <>
                          <span className="text-zocc-blue-600">•</span>
                          <span className="text-green-400">Published</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-zocc-blue-300 leading-relaxed whitespace-pre-wrap">
                {announcement.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="bg-zocc-blue-800/95 backdrop-blur-lg rounded-xl border border-zocc-blue-700/50 p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedAnnouncement.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-zocc-blue-300">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>
                      {new Date(selectedAnnouncement.createdAt || selectedAnnouncement.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-zocc-blue-300 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-zocc-blue-200 leading-relaxed whitespace-pre-wrap">
                {selectedAnnouncement.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
