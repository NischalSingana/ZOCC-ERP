import toast from 'react-hot-toast';

// Custom toast with close button
const ToastContent = ({ message, t }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
      <span style={{ flex: 1, lineHeight: '1.4', fontSize: '13px' }}>{message}</span>
      <button
        onClick={() => toast.dismiss(t.id)}
        className="toast-close-btn"
        aria-label="Close notification"
        type="button"
      >
        ✕
      </button>
    </div>
  );
};

export const showToast = {
  success: (message) => {
    return toast.success((t) => <ToastContent message={message} t={t} />);
  },
  error: (message) => {
    return toast.error((t) => <ToastContent message={message} t={t} />);
  },
  info: (message) => {
    return toast((t) => <ToastContent message={message} t={t} />);
  },
  warning: (message) => {
    return toast((t) => <ToastContent message={message} t={t} />, {
      icon: '⚠️',
    });
  },
};

export default showToast;

