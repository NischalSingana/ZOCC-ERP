import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LiquidEther from './components/LiquidEther.jsx';
import Login from './components/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import navLogo from './assets/navLogo.jpg';
import sacLogo from './assets/sac_logo.png';
import './App.css';

function App() {
  // Check if user is authenticated (you'll implement this based on your auth logic)
  const isAuthenticated = localStorage.getItem('authToken') ? true : false;
  
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

        {/* Dashboard Routes */}
        <Route
          path="/dashboard/*"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
