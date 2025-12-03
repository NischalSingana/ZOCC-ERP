import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { showToast } from '../utils/toastUtils';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const Queries = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/queries');
      if (response.data?.success) {
        setQueries(response.data.queries || []);
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
      showToast.error('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/api/queries', formData);
      if (response.data?.success) {
        showToast.success('Query submitted successfully!');
        setFormData({ subject: '', message: '' });
        setShowForm(false);
        fetchQueries();
      }
    } catch (error) {
      console.error('Error submitting query:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'RESOLVED':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'IN_PROGRESS':
        return <Clock className="text-yellow-400" size={20} />;
      default:
        return <AlertCircle className="text-blue-400" size={20} />;
    }
  };

  if (loading) {
    return <div className="text-white">Loading queries...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">My Queries</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all flex items-center gap-2"
        >
          <Send size={20} />
          New Query
        </button>
      </div>

      {showForm && (
        <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
          <h2 className="text-xl font-semibold text-white mb-4">Submit New Query</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white placeholder-zocc-blue-400 focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                placeholder="Enter query subject"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white placeholder-zocc-blue-400 focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                rows={5}
                placeholder="Describe your query..."
                required
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all"
              >
                Submit Query
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-zocc-blue-800/50 text-white rounded-lg hover:bg-zocc-blue-700/50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {queries.length === 0 ? (
          <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-12 border border-zocc-blue-700/30 text-center">
            <MessageSquare className="mx-auto text-zocc-blue-400 mb-4" size={48} />
            <p className="text-zocc-blue-300">No queries yet. Submit your first query!</p>
          </div>
        ) : (
          queries.map((query) => (
            <div
              key={query.id}
              className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{query.subject}</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(query.status)}
                      <span className="text-sm text-zocc-blue-300 capitalize">{query.status}</span>
                    </div>
                  </div>
                  <p className="text-zocc-blue-300 text-sm">
                    {new Date(query.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-white mb-4">{query.message}</p>
              {query.reply && (
                <div className="mt-4 p-4 bg-zocc-blue-900/30 rounded-lg border-l-4 border-zocc-blue-500">
                  <h4 className="text-sm font-semibold text-zocc-blue-300 mb-2">Admin Reply:</h4>
                  <p className="text-white">{query.reply}</p>
                  {query.repliedAt && (
                    <p className="text-xs text-zocc-blue-400 mt-2">
                      {new Date(query.repliedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Queries;

