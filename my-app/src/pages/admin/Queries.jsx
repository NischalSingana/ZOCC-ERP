import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import toast from 'react-hot-toast';
import { MessageSquare, Send, CheckCircle, Clock, AlertCircle, Search, Filter } from 'lucide-react';

const AdminQueries = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, resolved
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [status, setStatus] = useState('RESOLVED');

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
            toast.error('Failed to load queries');
        } finally {
            setLoading(false);
        }
    };

    const handleReply = (query) => {
        setSelectedQuery(query);
        setReplyMessage(query.reply || '');
        setStatus(query.status === 'PENDING' ? 'RESOLVED' : query.status);
        setReplyModalOpen(true);
    };

    const handleQuickResolve = async (queryId) => {
        if (!window.confirm('Are you sure you want to mark this query as RESOLVED?')) return;

        try {
            const response = await axiosInstance.put(`/api/queries/${queryId}/reply`, {
                reply: 'Marked as resolved by admin.',
                status: 'RESOLVED'
            });

            if (response.data?.success) {
                toast.success('Query marked as resolved');
                fetchQueries();
            }
        } catch (error) {
            console.error('Error resolving query:', error);
            toast.error('Failed to resolve query');
        }
    };

    const submitReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) {
            toast.error('Reply message cannot be empty');
            return;
        }

        try {
            const response = await axiosInstance.put(`/api/queries/${selectedQuery._id}/reply`, {
                reply: replyMessage,
                status: status
            });

            if (response.data?.success) {
                toast.success('Reply sent successfully');
                setReplyModalOpen(false);
                fetchQueries();
            }
        } catch (error) {
            console.error('Error sending reply:', error);
            toast.error('Failed to send reply');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'RESOLVED':
                return <CheckCircle className="text-green-400" size={18} />;
            case 'IN_PROGRESS':
                return <Clock className="text-yellow-400" size={18} />;
            default:
                return <AlertCircle className="text-blue-400" size={18} />;
        }
    };

    const filteredQueries = queries.filter(q => {
        if (filter === 'all') return true;
        return q.status === filter.toUpperCase();
    });

    if (loading) {
        return <div className="text-white p-8">Loading queries...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <MessageSquare size={32} />
                    Student Queries
                </h1>
                <div className="flex gap-2">
                    {['all', 'pending', 'resolved'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg transition-all capitalize ${filter === status
                                ? 'bg-zocc-blue-600 text-white'
                                : 'bg-zocc-blue-800/50 text-zocc-blue-300 hover:bg-zocc-blue-700/50'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {filteredQueries.length === 0 ? (
                    <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-12 border border-zocc-blue-700/30 text-center">
                        <MessageSquare className="mx-auto text-zocc-blue-400 mb-4" size={48} />
                        <p className="text-zocc-blue-300">No queries found.</p>
                    </div>
                ) : (
                    filteredQueries.map((query) => (
                        <div
                            key={query._id}
                            className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30 hover:bg-zocc-blue-800/40 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold text-white">{query.subject}</h3>
                                        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-zocc-blue-900/50 border border-zocc-blue-700/30">
                                            {getStatusIcon(query.status)}
                                            <span className="text-xs text-zocc-blue-300 capitalize font-medium">{query.status}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-zocc-blue-400">
                                        <span>From: {query.user?.studentFullName || 'Unknown Student'} ({query.user?.idNumber})</span>
                                        <span>•</span>
                                        <span>{new Date(query.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {query.status !== 'RESOLVED' && (
                                        <button
                                            onClick={() => handleQuickResolve(query._id)}
                                            className="px-3 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/40 rounded-lg transition-all flex items-center gap-2 border border-green-600/30"
                                            title="Mark as Resolved"
                                        >
                                            <CheckCircle size={16} />
                                            Approve/Resolve
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleReply(query)}
                                        className="px-4 py-2 bg-zocc-blue-600/20 text-zocc-blue-300 hover:bg-zocc-blue-600/40 hover:text-white rounded-lg transition-all flex items-center gap-2 border border-zocc-blue-600/30"
                                    >
                                        <Send size={16} />
                                        {query.reply ? 'Edit Reply' : 'Reply'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-zocc-blue-900/20 rounded-lg p-4 mb-4 border border-zocc-blue-800/30">
                                <p className="text-zocc-blue-100 whitespace-pre-wrap">{query.message}</p>
                            </div>

                            {query.reply && (
                                <div className="pl-4 border-l-2 border-green-500/50">
                                    <p className="text-xs text-green-400 mb-1 font-medium">Admin Reply:</p>
                                    <p className="text-zocc-blue-200 text-sm whitespace-pre-wrap">{query.reply}</p>
                                    <p className="text-xs text-zocc-blue-500 mt-2">
                                        Replied by {query.repliedBy?.studentFullName || 'Admin'} on {new Date(query.repliedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Reply Modal */}
            {replyModalOpen && selectedQuery && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zocc-blue-900 border border-zocc-blue-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Reply to Query</h2>

                        <div className="mb-6 bg-zocc-blue-800/50 p-4 rounded-lg">
                            <p className="text-sm text-zocc-blue-400 mb-1">Subject: {selectedQuery.subject}</p>
                            <p className="text-white">{selectedQuery.message}</p>
                        </div>

                        <form onSubmit={submitReply}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                                    Your Reply
                                </label>
                                <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    className="w-full px-4 py-3 bg-black border border-zocc-blue-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-zocc-blue-500 min-h-[150px]"
                                    placeholder="Type your reply here..."
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setReplyModalOpen(false)}
                                    className="px-4 py-2 text-zocc-blue-300 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all flex items-center gap-2"
                                >
                                    <Send size={18} />
                                    Send Reply
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminQueries;
