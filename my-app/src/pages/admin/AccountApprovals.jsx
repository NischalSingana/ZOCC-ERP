import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import Table from '../../components/Table';
import { showToast } from '../../utils/toastUtils';
import { UserCheck, UserX, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';

const AccountApprovals = () => {
    const [pendingAccounts, setPendingAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchPendingAccounts();
    }, []);

    const fetchPendingAccounts = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/api/admin/pending-accounts');
            if (response.data?.success) {
                setPendingAccounts(response.data.pendingAccounts || []);
            }
        } catch (error) {
            console.error('Error fetching pending accounts:', error);
            showToast.error('Failed to load pending accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        if (!confirm('Are you sure you want to approve this account?')) return;

        try {
            setActionLoading(true);
            const response = await axiosInstance.post(`/api/admin/approve-account/${userId}`);
            if (response.data?.success) {
                showToast.success('Account approved successfully!');
                fetchPendingAccounts();
                setShowDetailsModal(false);
            }
        } catch (error) {
            console.error('Error approving account:', error);
            showToast.error(error.response?.data?.error || 'Failed to approve account');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (userId) => {
        const reason = prompt('Enter rejection reason (optional):');
        if (reason === null) return; // User cancelled

        try {
            setActionLoading(true);
            const response = await axiosInstance.post(`/api/admin/reject-account/${userId}`, { reason });
            if (response.data?.success) {
                showToast.success('Account rejected');
                fetchPendingAccounts();
                setShowDetailsModal(false);
            }
        } catch (error) {
            console.error('Error rejecting account:', error);
            showToast.error(error.response?.data?.error || 'Failed to reject account');
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        {
            key: 'studentFullName',
            header: 'Name',
            headerClassName: 'w-[20%]',
            cellClassName: 'break-words'
        },
        {
            key: 'idNumber',
            header: 'ID Number',
            headerClassName: 'w-[15%]'
        },
        {
            key: 'email',
            header: 'Email',
            headerClassName: 'w-[25%]',
            cellClassName: 'break-words'
        },
        {
            key: 'phone',
            header: 'Phone',
            headerClassName: 'w-[12%]',
            render: (account) => account.phone || 'N/A'
        },
        {
            key: 'createdAt',
            header: 'Registered',
            headerClassName: 'w-[13%]',
            render: (account) => new Date(account.createdAt).toLocaleDateString()
        },
        {
            key: 'actions',
            header: 'Actions',
            headerClassName: 'w-[15%]',
            render: (account) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setSelectedAccount(account);
                            setShowDetailsModal(true);
                        }}
                        className="p-2 hover:bg-zocc-blue-800 rounded-lg transition-colors"
                        title="View Details"
                    >
                        <Eye size={18} className="text-zocc-blue-400" />
                    </button>
                    <button
                        onClick={() => handleApprove(account._id)}
                        className="p-2 hover:bg-green-800 rounded-lg transition-colors"
                        title="Approve"
                        disabled={actionLoading}
                    >
                        <CheckCircle size={18} className="text-green-400" />
                    </button>
                    <button
                        onClick={() => handleReject(account._id)}
                        className="p-2 hover:bg-red-800 rounded-lg transition-colors"
                        title="Reject"
                        disabled={actionLoading}
                    >
                        <XCircle size={18} className="text-red-400" />
                    </button>
                </div>
            )
        }
    ];

    if (loading) {
        return <div className="text-white">Loading pending accounts...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Clock size={32} className="text-yellow-400" />
                    Account Approvals
                </h1>
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg border border-yellow-500/30">
                    <Clock size={20} />
                    <span className="font-semibold">{pendingAccounts.length} Pending</span>
                </div>
            </div>

            <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
                {pendingAccounts.length === 0 ? (
                    <div className="text-center py-12">
                        <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
                        <p className="text-zocc-blue-300">No pending account approvals at the moment.</p>
                    </div>
                ) : (
                    <Table
                        data={pendingAccounts}
                        columns={columns}
                        keyExtractor={(item) => item._id}
                        emptyMessage="No pending accounts"
                    />
                )}
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedAccount && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowDetailsModal(false)}
                >
                    <div
                        className="bg-zocc-blue-900 rounded-lg p-6 max-w-2xl w-full border border-zocc-blue-700/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-bold text-white">Account Details</h2>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-zocc-blue-300 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-zocc-blue-400 font-semibold">Full Name</label>
                                    <p className="text-white text-lg">{selectedAccount.studentFullName}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-zocc-blue-400 font-semibold">ID Number</label>
                                    <p className="text-white text-lg">{selectedAccount.idNumber}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-zocc-blue-400 font-semibold">Email</label>
                                    <p className="text-white text-lg break-words">{selectedAccount.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-zocc-blue-400 font-semibold">Phone</label>
                                    <p className="text-white text-lg">{selectedAccount.phone || 'Not provided'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-zocc-blue-400 font-semibold">Registration Date</label>
                                    <p className="text-white text-lg">
                                        {new Date(selectedAccount.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-zocc-blue-400 font-semibold">Status</label>
                                    <p className="text-yellow-400 text-lg font-semibold">
                                        {selectedAccount.accountStatus}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 pt-6 border-t border-zocc-blue-700/50">
                                <button
                                    onClick={() => handleApprove(selectedAccount._id)}
                                    disabled={actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <UserCheck size={20} />
                                    {actionLoading ? 'Processing...' : 'Approve Account'}
                                </button>
                                <button
                                    onClick={() => handleReject(selectedAccount._id)}
                                    disabled={actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <UserX size={20} />
                                    {actionLoading ? 'Processing...' : 'Reject Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountApprovals;
