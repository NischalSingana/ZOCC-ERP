import { useState, useEffect, useRef } from 'react';
import './Captcha.css';

export default function Captcha({ onVerify }) {
  const [code, setCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const canvasRef = useRef(null);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newCode = '';
    for (let i = 0; i < 5; i++) {
      newCode += chars[Math.floor(Math.random() * chars.length)];
    }
    setCode(newCode);
    setIsVerified(false);
    setUserInput('');
    onVerify?.(false);
  };

  useEffect(() => {
    generateCode();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 180;
    canvas.height = 60;

    // Clear canvas
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(79, 156, 255, ${Math.random() * 0.3})`;
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        2,
        2
      );
    }

    // Draw code
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < code.length; i++) {
      const x = (canvas.width / (code.length + 1)) * (i + 1);
      const y = canvas.height / 2;
      const angle = (Math.random() - 0.5) * 0.3;
      const offsetY = (Math.random() - 0.5) * 10;

      ctx.save();
      ctx.translate(x, y + offsetY);
      ctx.rotate(angle);
      
      const gradient = ctx.createLinearGradient(-15, -15, 15, 15);
      gradient.addColorStop(0, '#4f9cff');
      gradient.addColorStop(1, '#60a5fa');
      ctx.fillStyle = gradient;
      
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }

    // Add lines
    ctx.strokeStyle = 'rgba(79, 156, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
  }, [code]);

  const handleVerify = () => {
    if (userInput.toUpperCase() === code.toUpperCase()) {
      setIsVerified(true);
      onVerify?.(true);
    } else {
      setUserInput('');
      generateCode();
      onVerify?.(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setUserInput(value);
    
    if (value.length === 5 && value === code) {
      setIsVerified(true);
      onVerify?.(true);
    } else {
      setIsVerified(false);
      onVerify?.(false);
    }
  };

  return (
    <div className="captcha-container">
      <div className="captcha-display">
        <canvas ref={canvasRef} className="captcha-canvas"></canvas>
        <button
          type="button"
          onClick={generateCode}
          className="captcha-refresh"
          title="Refresh code"
        >
          <box-icon name="refresh" color="#4f9cff" size="20px"></box-icon>
        </button>
      </div>
      <div className="captcha-input-group">
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
          placeholder="Enter code"
          className={`captcha-input ${isVerified ? 'verified' : ''}`}
          maxLength={5}
        />
        {isVerified && (
          <box-icon name="check-circle" color="#10b981" size="24px"></box-icon>
        )}
      </div>
      {userInput.length === 5 && !isVerified && (
        <p className="captcha-error">Code doesn't match. New code generated.</p>
      )}
    </div>
  );
}

