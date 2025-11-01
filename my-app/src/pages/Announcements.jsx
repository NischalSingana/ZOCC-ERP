import { useState } from 'react';
import { Megaphone, Calendar, User as UserIcon, Plus, XCircle } from 'lucide-react';

const Announcements = () => {
  const [newAnnouncementModal, setNewAnnouncementModal] = useState(false);
  const isAdmin = true; // TODO: Get from context/state

  const announcements = [
    {
      id: 1,
      title: 'New Project Proposals Open',
      content: 'We are now accepting proposals for the next semester projects. Submit your innovative ideas by next Friday!',
      author: 'Club Admin',
      date: '2024-01-14',
      time: '10:30 AM',
      priority: 'high',
      category: 'general'
    },
    {
      id: 2,
      title: 'Hackathon Registration Starts Tomorrow',
      content: 'Get ready for our annual coding hackathon! Registration opens tomorrow at 9 AM. Limited spots available.',
      author: 'Event Team',
      date: '2024-01-13',
      time: '3:15 PM',
      priority: 'high',
      category: 'event'
    },
    {
      id: 3,
      title: 'Weekly Meetup Reminder',
      content: 'Don\'t forget our weekly meetup this Saturday at 2 PM. We\'ll be discussing advanced React patterns.',
      author: 'Coordinator',
      date: '2024-01-12',
      time: '11:00 AM',
      priority: 'medium',
      category: 'meeting'
    },
    {
      id: 4,
      title: 'Mentor Office Hours Update',
      content: 'Dr. Sarah Lee will have extended office hours every Tuesday this month for project consultations.',
      author: 'Admin',
      date: '2024-01-10',
      time: '2:00 PM',
      priority: 'low',
      category: 'general'
    },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Announcements</h1>
          <p className="text-zocc-blue-300">Stay updated with latest club news and updates</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setNewAnnouncementModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all shadow-lg shadow-zocc-blue-500/25"
          >
            <Plus size={20} />
            New Announcement
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`dashboard-card border-l-4 cursor-pointer hover:scale-[1.01] transition-all ${getPriorityColor(announcement.priority)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zocc-blue-600/20">
                  <Megaphone className="text-zocc-blue-400" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{announcement.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-sm text-zocc-blue-400">
                      <UserIcon size={14} />
                      <span>{announcement.author}</span>
                    </div>
                    <span className="text-zocc-blue-600">•</span>
                    <div className="flex items-center gap-1 text-sm text-zocc-blue-400">
                      <Calendar size={14} />
                      <span>{announcement.date} at {announcement.time}</span>
                    </div>
                  </div>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(announcement.priority)}`}>
                {announcement.priority.toUpperCase()}
              </span>
            </div>
            <p className="text-zocc-blue-300 leading-relaxed">{announcement.content}</p>
          </div>
        ))}
      </div>

      {/* New Announcement Modal */}
      {newAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zocc-blue-900 to-zocc-blue-800 rounded-xl border border-zocc-blue-700/50 p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Create Announcement</h3>
              <button
                onClick={() => setNewAnnouncementModal(false)}
                className="text-zocc-blue-300 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Content *
                </label>
                <textarea
                  className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500 min-h-[150px]"
                  placeholder="Write your announcement..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                    Priority
                  </label>
                  <select className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                    Category
                  </label>
                  <select className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500">
                    <option value="general">General</option>
                    <option value="event">Event</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setNewAnnouncementModal(false)}
                  className="flex-1 px-4 py-3 bg-zocc-blue-800 text-white rounded-lg hover:bg-zocc-blue-700 transition-all font-medium"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all font-medium">
                  Publish Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;

