import { useEffect, useState } from 'react'
import './Toast.css'

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300) // Wait for animation to complete
  }
  // Auto-dismiss timer
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration]) // eslint-disable-line react-hooks/exhaustive-deps

  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
    warning: '⚠'
  }

  return (
    <div 
      className={`toast toast-${type} ${isClosing ? 'toast-closing' : ''}`} 
      role="alert" 
      aria-live="polite"
    >
      <span className="toast-icon">{icons[type] || icons.info}</span>
      <span className="toast-message">{message}</span>
      <button 
        className="toast-close" 
        onClick={handleClose}
        aria-label="Close notification"
        title="Click to close"
        type="button"
      >
        ✕
      </button>
    </div>
  )
}

