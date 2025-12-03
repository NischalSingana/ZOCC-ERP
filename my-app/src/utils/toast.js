import toast from 'react-hot-toast';

// Custom toast with close button
export const showToast = (message, type = 'success') => {
  const toastFunction = type === 'success' ? toast.success : 
                       type === 'error' ? toast.error :
                       type === 'warning' ? toast :
                       toast;

  return toastFunction(
    (t) => (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        width: '100%',
        minWidth: '250px'
      }}>
        <span style={{ flex: 1, lineHeight: '1.4' }}>{message}</span>
        <button
          onClick={() => toast.dismiss(t.id)}
          style={{
            background: 'rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'inherit',
            fontSize: '20px',
            fontWeight: '700',
            cursor: 'pointer',
            padding: '0',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.15)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          title="Close"
          aria-label="Close notification"
          type="button"
        >
          ✕
        </button>
      </div>
    ),
    {
      duration: type === 'error' ? 4000 : 3000,
    }
  );
};

export default showToast;

