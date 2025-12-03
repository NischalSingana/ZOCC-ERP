import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              color: '#e2e8f0',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              padding: '10px 40px 10px 14px',
              fontSize: '13px',
              fontWeight: '400',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(12px)',
              minWidth: '240px',
              maxWidth: '380px',
              position: 'relative',
            },
            success: {
              duration: 3000,
              style: {
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              },
              iconTheme: {
                primary: '#22c55e',
                secondary: 'rgba(15, 23, 42, 0.95)',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: 'rgba(15, 23, 42, 0.95)',
              },
            },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
