import { useState, useEffect } from 'react';
import {
    Users,
    Calendar,
    FileText,
    CheckSquare,
    UserCheck,
    Bell,
    TrendingUp
} from 'lucide-react';
import { API_URL } from '../../utils/apiUrl';

const AdminOverview = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalSessions: 0,
        totalSubmissions: 0,
        totalTasks: 0,
        pendingApprovals: 0,
        totalAnnouncements: 0,
        activeProjects: 0
    });
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminOverviewData();
    }, []);

    const fetchAdminOverviewData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            // Fetch total students
            const studentsRes = await fetch(`${API_URL}/api/users/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const studentsData = studentsRes.ok ? await studentsRes.json() : { students: [] };
            const totalStudents = studentsData.students?.length || 0;

            // Fetch total sessions
            const sessionsRes = await fetch(`${API_URL}/api/sessions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const sessionsData = sessionsRes.ok ? await sessionsRes.json() : { sessions: [] };
            const allSessions = sessionsData.sessions || [];
            const totalSessions = allSessions.length;

            // Get upcoming sessions
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcoming = allSessions
                .filter(session => {
                    if (!session.date) return false;
                    const sessionDate = new Date(session.date);
                    sessionDate.setHours(0, 0, 0, 0);
                    return sessionDate >= today;
                })
                .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
                .slice(0, 3)
                .map(session => ({
                    title: session.title || 'Untitled Session',
                    date: session.date,
                    time: session.startTime
                        ? new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : 'TBA',
                    venue: session.venue || 'TBA'
                }));

            // Fetch total submissions
            const submissionsRes = await fetch(`${API_URL}/api/submissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const submissionsData = submissionsRes.ok ? await submissionsRes.json() : { submissions: [] };
            const totalSubmissions = submissionsData.submissions?.length || 0;

            // Fetch total tasks
            let totalTasks = 0;
            try {
                const tasksRes = await fetch(`${API_URL}/api/tasks`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (tasksRes.ok) {
                    const tasksData = await tasksRes.json();
                    totalTasks = (tasksData.tasks || tasksData.data || []).length;
                }
            } catch (error) {
                console.log('Tasks endpoint not available');
            }

            // Fetch pending account approvals
            let pendingApprovals = 0;
            try {
                const approvalsRes = await fetch(`${API_URL}/api/admin/pending-accounts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (approvalsRes.ok) {
                    const approvalsData = await approvalsRes.json();
                    pendingApprovals = (approvalsData.pendingAccounts || []).length;
                }
            } catch (error) {
                console.log('Pending accounts endpoint not available');
            }

            // Fetch announcements
            let totalAnnouncements = 0;
            try {
                const announcementsRes = await fetch(`${API_URL}/api/announcements`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (announcementsRes.ok) {
                    const announcementsData = await announcementsRes.json();
                    totalAnnouncements = (announcementsData.announcements || []).length;
                }
            } catch (error) {
                console.log('Announcements endpoint not available');
            }

            // Fetch projects
            let activeProjects = 0;
            try {
                const projectsRes = await fetch(`${API_URL}/api/projects`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (projectsRes.ok) {
                    const projectsData = await projectsRes.json();
                    const projects = projectsData.projects || [];
                    activeProjects = projects.filter(p => p.isActive).length;
                }
            } catch (error) {
                console.log('Projects endpoint not available');
            }

            setStats({
                totalStudents,
                totalSessions,
                totalSubmissions,
                totalTasks,
                pendingApprovals,
                totalAnnouncements,
                activeProjects
            });

            setUpcomingSessions(upcoming);
        } catch (error) {
            console.error('Error fetching admin overview data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statsData = [
        {
            title: 'Total Students',
            value: stats.totalStudents.toString(),
            icon: Users,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10'
        },
        {
            title: 'Total Sessions',
            value: stats.totalSessions.toString(),
            icon: Calendar,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10'
        },
        {
            title: 'Total Submissions',
            value: stats.totalSubmissions.toString(),
            icon: FileText,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10'
        },
        {
            title: 'Total Tasks',
            value: stats.totalTasks.toString(),
            icon: CheckSquare,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/10'
        },
        {
            title: 'Pending Approvals',
            value: stats.pendingApprovals.toString(),
            icon: UserCheck,
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10'
        },
        {
            title: 'Announcements',
            value: stats.totalAnnouncements.toString(),
            icon: Bell,
            color: 'text-pink-400',
            bgColor: 'bg-pink-500/10'
        },
        {
            title: 'Active Projects',
            value: stats.activeProjects.toString(),
            icon: TrendingUp,
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10'
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-zocc-blue-300">Loading admin overview...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Admin Badge */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-purple-600/50 rounded-full text-sm font-bold text-white">
                        ADMIN
                    </div>
                    <p className="text-white font-medium">Admin Dashboard Overview</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="dashboard-card glow-effect">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <Icon className={`${stat.color}`} size={24} />
                                </div>
                            </div>
                            <h3 className="text-sm text-zocc-blue-300 mb-1">{stat.title}</h3>
                            <p className="text-3xl font-bold text-white">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Upcoming Sessions & Quick Actions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Sessions */}
                <div className="dashboard-card">
                    <div className="flex items-center gap-2 mb-6">
                        <Calendar className="text-zocc-blue-400" size={24} />
                        <h2 className="text-xl font-semibold text-white">Upcoming Sessions</h2>
                    </div>
                    {upcomingSessions.length === 0 ? (
                        <div className="text-center py-8 text-zocc-blue-300">
                            No upcoming sessions scheduled.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingSessions.map((session, idx) => (
                                <div
                                    key={idx}
                                    className="bg-zocc-blue-800/50 rounded-lg p-4 border border-zocc-blue-700 hover:border-zocc-blue-600 transition-all"
                                >
                                    <h3 className="text-white font-medium mb-2">{session.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-zocc-blue-300">
                                        <span>{session.date ? new Date(session.date).toLocaleDateString() : 'TBA'}</span>
                                        <span>•</span>
                                        <span>{session.time}</span>
                                    </div>
                                    <p className="text-sm text-zocc-blue-400 mt-2">
                                        Venue: {session.venue}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="dashboard-card">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="text-zocc-blue-400" size={24} />
                        <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
                    </div>
                    <div className="space-y-3">
                        <a
                            href="/dashboard/admin/sessions"
                            className="block p-4 bg-zocc-blue-800/50 rounded-lg border border-zocc-blue-700 hover:border-zocc-blue-600 hover:bg-zocc-blue-800/70 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <Calendar className="text-blue-400" size={20} />
                                <div>
                                    <h3 className="text-white font-medium">Manage Sessions</h3>
                                    <p className="text-sm text-zocc-blue-300">Create and edit sessions</p>
                                </div>
                            </div>
                        </a>
                        <a
                            href="/dashboard/admin/students"
                            className="block p-4 bg-zocc-blue-800/50 rounded-lg border border-zocc-blue-700 hover:border-zocc-blue-600 hover:bg-zocc-blue-800/70 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <Users className="text-green-400" size={20} />
                                <div>
                                    <h3 className="text-white font-medium">View Students</h3>
                                    <p className="text-sm text-zocc-blue-300">Manage registered students</p>
                                </div>
                            </div>
                        </a>
                        {stats.pendingApprovals > 0 && (
                            <a
                                href="/dashboard/admin/account-approvals"
                                className="block p-4 bg-orange-500/10 rounded-lg border border-orange-500/30 hover:border-orange-500/50 hover:bg-orange-500/20 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <UserCheck className="text-orange-400" size={20} />
                                    <div>
                                        <h3 className="text-white font-medium">Pending Approvals</h3>
                                        <p className="text-sm text-orange-300">{stats.pendingApprovals} account(s) waiting</p>
                                    </div>
                                </div>
                            </a>
                        )}
                        <a
                            href="/dashboard/admin/announcements"
                            className="block p-4 bg-zocc-blue-800/50 rounded-lg border border-zocc-blue-700 hover:border-zocc-blue-600 hover:bg-zocc-blue-800/70 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <Bell className="text-pink-400" size={20} />
                                <div>
                                    <h3 className="text-white font-medium">Post Announcement</h3>
                                    <p className="text-sm text-zocc-blue-300">Create new announcements</p>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
