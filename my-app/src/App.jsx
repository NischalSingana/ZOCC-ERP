import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LiquidEther from './components/LiquidEther.jsx';
import Login from './components/Login.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext';
import navLogo from './assets/navLogo.jpg';
import sacLogo from './assets/sac_logo.png';
import './App.css';

// Student Pages
import Overview from './pages/Overview.jsx';
import OverviewY24 from './pages/OverviewY24.jsx';
import Profile from './pages/Profile.jsx';
import Sessions from './pages/Sessions.jsx';
import Attendance from './pages/Attendance.jsx';
import Submissions from './pages/Submissions.jsx';
import Tasks from './pages/Tasks.jsx';
import Announcements from './pages/Announcements.jsx';
import Queries from './pages/Queries.jsx';
import Contact from './pages/Contact.jsx';

// Admin Pages
import AdminOverview from './pages/admin/AdminOverview.jsx';
import StudentDetails from './pages/admin/StudentDetails.jsx';
import RegisteredStudents from './pages/admin/RegisteredStudents.jsx';
import AttendanceAdmin from './pages/admin/Attendance.jsx';
import SessionManagement from './pages/admin/SessionManagement.jsx';
import SubmissionsApproval from './pages/admin/SubmissionsApproval.jsx';
import AnnouncementsAdmin from './pages/admin/Announcements.jsx';
import TaskAdmin from './pages/admin/TaskAdmin.jsx';
import AdminQueries from './pages/admin/Queries.jsx';
import AccountApprovals from './pages/admin/AccountApprovals.jsx';

// Component to conditionally render dashboard based on user role and ID
const DashboardOverview = () => {
  const { user } = useAuth();

  // Check if user is admin first
  if (user?.role === 'ADMIN') {
    return <AdminOverview />;
  }

  // For students, check ID number
  const idNumber = user?.idNumber?.toString() || '';

  // Check if ID starts with "24" for Y24 students
  if (idNumber.startsWith('24')) {
    return <OverviewY24 />;
  }

  // Default to standard overview for Y25 and others
  return <Overview />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <div style={{ position: 'relative', height: '100vh', width: '100%', background: 'transparent' }}>
              <header className="app-header">
                <img src={navLogo} alt="Title" className="app-logo" />
                <a
                  href="https://sac.kluniversity.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block' }}
                >
                  <img src={sacLogo} alt="SAC" className="app-logo-right" />
                </a>
              </header>
              <LiquidEther />
              <Login />
            </div>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardOverview />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/dashboard/sessions"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Sessions />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/attendance"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Attendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/submissions"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Submissions />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tasks"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Tasks />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/announcements"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Announcements />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/queries"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Queries />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/contact"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Contact />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/dashboard/admin/students"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardLayout>
                <RegisteredStudents />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/account-approvals"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardLayout>
                <AccountApprovals />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/student-details"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardLayout>
                <StudentDetails />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/attendance"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardLayout>
                <AttendanceAdmin />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/sessions"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardLayout>
                <SessionManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/submissions"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardLayout>
                <SubmissionsApproval />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/announcements"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardLayout>
                <AnnouncementsAdmin />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/tasks"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardLayout>
                <TaskAdmin />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/queries"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardLayout>
                <AdminQueries />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
