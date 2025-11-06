import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LiquidEther from './components/LiquidEther.jsx';
import Login from './components/Login.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import navLogo from './assets/navLogo.jpg';
import sacLogo from './assets/sac_logo.png';
import './App.css';

// Student Pages
import Overview from './pages/Overview.jsx';
import Profile from './pages/Profile.jsx';
import Sessions from './pages/Sessions.jsx';
import Attendance from './pages/Attendance.jsx';
import Submissions from './pages/Submissions.jsx';
import Projects from './pages/Projects.jsx';
import Announcements from './pages/Announcements.jsx';
import Queries from './pages/Queries.jsx';
import Contact from './pages/Contact.jsx';

// Admin Pages
import StudentDetails from './pages/admin/StudentDetails.jsx';
import RegisteredStudents from './pages/admin/RegisteredStudents.jsx';
import AttendanceAdmin from './pages/admin/Attendance.jsx';
import SessionManagement from './pages/admin/SessionManagement.jsx';
import SubmissionsApproval from './pages/admin/SubmissionsApproval.jsx';
import AnnouncementsAdmin from './pages/admin/Announcements.jsx';
import ProjectAdmin from './pages/admin/ProjectAdmin.jsx';

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
                <Overview />
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
          path="/dashboard/projects"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Projects />
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
          path="/dashboard/admin/projects"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardLayout>
                <ProjectAdmin />
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
