import toast from 'react-hot-toast';
import React from 'react';

// Custom toast with close button
const ToastContent = ({ message, t }) => {
  if (!message || !t) {
    return null;
  }
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
      <span style={{ flex: 1, lineHeight: '1.4', fontSize: '13px' }}>{String(message)}</span>
      <button
        onClick={() => {
          if (t && t.id && typeof toast.dismiss === 'function') {
            toast.dismiss(t.id);
          }
        }}
        className="toast-close-btn"
        aria-label="Close notification"
        type="button"
      >
        ✕
      </button>
    </div>
  );
};

// Toast utility functions - exported as named export
const showToastSuccess = (message) => {
  try {
    if (!message) {
      console.error('showToast.success: message is required');
      return null;
    }
    const msg = String(message);
    return toast.success((t) => <ToastContent message={msg} t={t} />, {
      style: {
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#e2e8f0',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '8px',
        padding: '10px 10px 10px 14px',
        fontSize: '13px',
        fontWeight: '500',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        minWidth: '240px',
        maxWidth: '380px',
      },
      iconTheme: {
        primary: '#22c55e',
        secondary: '#e2e8f0',
      },
    });
  } catch (error) {
    console.error('Error showing success toast:', error);
    return null;
  }
};

const showToastError = (message) => {
  try {
    if (!message) {
      console.error('showToast.error: message is required');
      return null;
    }
    const msg = String(message);
    
    if (!toast || typeof toast.error !== 'function') {
      console.error('Toast error (fallback):', msg);
      alert(msg); // Fallback alert if toast is unavailable
      return null;
    }
    
    return toast.error((t) => <ToastContent message={msg} t={t} />, {
      style: {
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#e2e8f0',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '8px',
        padding: '10px 10px 10px 14px',
        fontSize: '13px',
        fontWeight: '500',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        minWidth: '240px',
        maxWidth: '380px',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#e2e8f0',
      },
    });
  } catch (error) {
    console.error('Error showing error toast:', error);
    const msg = String(message || 'An error occurred');
    console.error('Toast error message (fallback):', msg);
    // Fallback to alert if toast completely fails
    try {
      alert(msg);
    } catch (alertError) {
      console.error('Alert also failed:', alertError);
    }
    return null;
  }
};

const showToastInfo = (message) => {
  try {
    if (!message) {
      console.error('showToast.info: message is required');
      return null;
    }
    const msg = String(message);
    return toast((t) => <ToastContent message={msg} t={t} />, {
      icon: 'ℹ️',
      style: {
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#e2e8f0',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '8px',
        padding: '10px 10px 10px 14px',
        fontSize: '13px',
        fontWeight: '500',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        minWidth: '240px',
        maxWidth: '380px',
      },
      iconTheme: {
        primary: '#3b82f6',
        secondary: '#e2e8f0',
      },
    });
  } catch (error) {
    console.error('Error showing info toast:', error);
    return null;
  }
};

const showToastWarning = (message) => {
  try {
    if (!message) {
      console.error('showToast.warning: message is required');
      return null;
    }
    const msg = String(message);
    return toast((t) => <ToastContent message={msg} t={t} />, {
      icon: '⚠️',
      style: {
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#e2e8f0',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        borderRadius: '8px',
        padding: '10px 10px 10px 14px',
        fontSize: '13px',
        fontWeight: '500',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        minWidth: '240px',
        maxWidth: '380px',
      },
      iconTheme: {
        primary: '#fcd34d',
        secondary: '#1f2937',
      },
    });
  } catch (error) {
    console.error('Error showing warning toast:', error);
    return null;
  }
};

// Export as object for backward compatibility
export const showToast = {
  success: showToastSuccess,
  error: showToastError,
  info: showToastInfo,
  warning: showToastWarning,
};

export default showToast;
