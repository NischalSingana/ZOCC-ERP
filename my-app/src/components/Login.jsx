import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { showToast } from '../utils/toastUtils'
import './Login.css'
import Captcha from './Captcha.jsx'
import { API_URL } from '../utils/apiUrl'

// Helper function to fetch with timeout
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. The server is taking too long to respond.')
    }
    throw error
  }
}

// Helper function to calculate password strength
const calculatePasswordStrength = (password) => {
  let strength = 0
  if (!password) return 0

  // Length check
  if (password.length >= 6) strength += 25
  if (password.length >= 10) strength += 25

  // Character variety checks
  if (/[a-z]/.test(password)) strength += 12.5
  if (/[A-Z]/.test(password)) strength += 12.5
  if (/[0-9]/.test(password)) strength += 12.5
  if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5

  return Math.min(100, strength)
}

// Helper function to get password strength color
const getPasswordStrengthColor = (strength) => {
  if (strength < 40) return '#f87171' // red
  if (strength < 70) return '#fbbf24' // yellow
  return '#10b981' // green
}

// Helper function to get password strength label
const getPasswordStrengthLabel = (strength) => {
  if (strength === 0) return ''
  if (strength < 40) return 'Weak'
  if (strength < 70) return 'Medium'
  return 'Strong'
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [active, setActive] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const loginFormRef = useRef(null)

  const [studentFullName, setStudentFullName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showRegPass, setShowRegPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [otpResendTimer, setOtpResendTimer] = useState(0)
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Pending registration (without OTP) states
  const [usePendingRegistration, setUsePendingRegistration] = useState(false)
  const [pendingRegPhone, setPendingRegPhone] = useState('')

  // OTP Resend Timer Effect
  useEffect(() => {
    if (otpResendTimer > 0) {
      const timer = setTimeout(() => setOtpResendTimer(otpResendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpResendTimer])

  // Password strength calculator
  useEffect(() => {
    if (regPass) {
      setPasswordStrength(calculatePasswordStrength(regPass))
    } else {
      setPasswordStrength(0)
    }
  }, [regPass])

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotUsernameOrEmail, setForgotUsernameOrEmail] = useState('')
  const [forgotOtpSent, setForgotOtpSent] = useState(false)
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordError, setForgotPasswordError] = useState('')

  return (
    <>
      <div className={`animated-auth ${active ? 'active' : ''} ${isAdminMode ? 'admin-mode' : ''}`}>
        {/* Admin Icon Button - Bottom Right (near SAC logo area) */}
        <button
          onClick={() => {
            setIsAdminMode(!isAdminMode)
            setActive(false) // Close registration if open
          }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-full shadow-2xl shadow-zocc-blue-500/50 hover:from-zocc-blue-500 hover:to-zocc-blue-400 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          title={isAdminMode ? "Switch to Student Login" : "Switch to Admin Login"}
        >
          <Shield size={24} className="text-white group-hover:rotate-12 transition-transform" />
        </button>

        <div className="container">
          <div className="curved-shape"></div>
          <div className="curved-shape2"></div>

          <div className="form-box Login">
            {isAdminMode && (
              <div className="animation text-center mb-2" style={{ ['--D']: 0, ['--S']: 20.5 }}>
                <p className="text-zocc-blue-300 font-semibold text-lg">Admin Access</p>
              </div>
            )}
            <h2 className="animation" style={{ ['--D']: 0, ['--S']: 21 }}>
              {isAdminMode ? 'Admin Login' : 'Login'}
            </h2>
            {/* 
            Form configured for browser password manager:
            - Uses proper semantic form with method="post" and autoComplete="on"
            - Email input has name="email" and autoComplete="username"
            - Password input has name="password" and autoComplete="current-password"
            - After successful AJAX login, form is submitted to hidden iframe to trigger password save
            - IMPORTANT: Password managers work best over HTTPS in production
          */}
            <form
              ref={loginFormRef}
              onSubmit={async (e) => {
                e.preventDefault()
                if ((!isAdminMode && !captchaVerified) || !loginEmail || !loginPass) return

                setLoginLoading(true)

                try {
                  const result = await login(loginEmail.toLowerCase().trim(), loginPass)
                  if (result.success) {
                    // Trigger browser's "Save Password" prompt by allowing form submission detection
                    // The browser needs to see the successful submission to offer saving credentials
                    // Note: This works best over HTTPS
                    if (loginFormRef.current) {
                      // Create a temporary hidden iframe to submit the form to
                      // This allows the browser to detect the successful login without page refresh
                      const iframe = document.createElement('iframe')
                      iframe.style.display = 'none'
                      iframe.name = 'password-save-frame'
                      document.body.appendChild(iframe)

                      loginFormRef.current.target = 'password-save-frame'
                      loginFormRef.current.action = `${API_URL}/api/auth/login`

                      // Let browser detect the submission
                      setTimeout(() => {
                        if (loginFormRef.current) {
                          loginFormRef.current.submit()
                        }
                        // Clean up iframe after a short delay
                        setTimeout(() => {
                          if (iframe.parentNode) {
                            iframe.parentNode.removeChild(iframe)
                          }
                        }, 1000)
                      }, 100)
                    }

                    navigate('/dashboard')
                  } else {
                    // Provide specific error messages with toast notifications
                    const errorMsg = String(result.error || 'Login failed')
                    let toastMessage = errorMsg // Default to server message

                    // Check for specific error patterns (order matters - most specific first)
                    const lowerError = errorMsg.toLowerCase()
                    if (lowerError.includes('incorrect password') || lowerError.includes('wrong password')) {
                      toastMessage = 'Incorrect password. Please try again or reset your password.'
                    } else if (lowerError.includes('no account found') || lowerError.includes('user not found') || lowerError.includes('sign up first')) {
                      toastMessage = 'No account found with this email. Please sign up first.'
                    } else if (lowerError.includes('verify') && lowerError.includes('email')) {
                      toastMessage = 'Please verify your email address before logging in.'
                    } else if (lowerError.includes('banned') || lowerError.includes('suspended')) {
                      toastMessage = 'Your account has been suspended. Please contact support.'
                    } else if (lowerError.includes('not fully set up')) {
                      toastMessage = 'Account not fully set up. Please contact admin.'
                    }

                    // Show toast notification for login errors
                    try {
                      if (showToast && typeof showToast.error === 'function') {
                        showToast.error(String(toastMessage))
                      } else {
                        console.error('Login error:', toastMessage)
                        alert(toastMessage)
                      }
                    } catch (toastErr) {
                      console.error('Error showing toast:', toastErr)
                      console.error('Login error message:', toastMessage)
                      alert(toastMessage)
                    }
                  }
                } catch (err) {
                  console.error('Login error:', err)
                  // Handle different types of errors with toast notifications
                  let errorMessage = 'An unexpected error occurred. Please try again.'
                  const errMsg = String(err.message || '')
                  if (errMsg.includes('timeout') || errMsg.includes('Timeout')) {
                    errorMessage = 'Connection timeout. Please check your internet connection and try again.'
                  } else if (errMsg.includes('fetch') || errMsg.includes('Network')) {
                    errorMessage = 'Unable to connect to server. Please try again later.'
                  } else if (errMsg && errMsg.length > 0) {
                    errorMessage = errMsg
                  }
                  try {
                    if (showToast && typeof showToast.error === 'function') {
                      showToast.error(String(errorMessage))
                    } else {
                      console.error('Login error (fallback):', errorMessage)
                      alert(errorMessage)
                    }
                  } catch (toastErr) {
                    console.error('Error showing toast:', toastErr)
                    console.error('Login error message:', errorMessage)
                    alert(errorMessage)
                  }
                } finally {
                  setLoginLoading(false)
                }
              }}
              autoComplete="on"
              method="post"
            >
              <div className="input-box animation" style={{ ['--D']: 1, ['--S']: 22 }}>
                <input
                  type="email"
                  name="email"
                  id="login-email"
                  autoComplete="username"
                  autoFocus
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  aria-label="Email address"
                  aria-required="true"
                  aria-invalid={loginError ? "true" : "false"}
                />
                <label htmlFor="login-email">Email</label>
                <box-icon name='envelope' type='solid' color="gray"></box-icon>
              </div>

              <div className="input-box animation" style={{ ['--D']: 2, ['--S']: 23 }} data-password-visible={showLoginPass}>
                <input
                  type={showLoginPass ? 'text' : 'password'}
                  name="password"
                  id="login-password"
                  autoComplete="current-password"
                  required
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  aria-label="Password"
                  aria-required="true"
                  aria-invalid={loginError ? "true" : "false"}
                />
                <label htmlFor="login-password">Password</label>
                <box-icon name='lock-alt' type='solid' color="gray"></box-icon>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    const input = document.getElementById('login-password');
                    if (input) {
                      const cursorPosition = input.selectionStart;
                      setShowLoginPass(!showLoginPass);
                      setTimeout(() => {
                        input.focus();
                        input.setSelectionRange(cursorPosition, cursorPosition);
                      }, 0);
                    } else {
                      setShowLoginPass(!showLoginPass);
                    }
                  }}
                  tabIndex={0}
                  aria-label={showLoginPass ? "Hide password" : "Show password"}
                >
                  {showLoginPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="forgot-password-link animation" style={{ ['--D']: 2.5, ['--S']: 23.5 }}>
                <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotPassword(true) }}>
                  Forgot Password?
                </a>
              </div>

              {!isAdminMode && (
                <div className="animation" style={{ ['--D']: 3, ['--S']: 24 }}>
                  <Captcha onVerify={setCaptchaVerified} />
                </div>
              )}


              <div className="input-box animation" style={{ ['--D']: isAdminMode ? 3 : 4, ['--S']: isAdminMode ? 24 : 25 }}>
                <button
                  className="btn"
                  type="submit"
                  disabled={(!isAdminMode && !captchaVerified) || loginLoading || !loginEmail || !loginPass}
                  aria-label="Login to your account"
                  aria-busy={loginLoading}
                >
                  {loginLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span className="loading-spinner"></span>
                      Logging in...
                    </span>
                  ) : 'Login'}
                </button>
              </div>

              {!isAdminMode && (
                <div className="regi-link animation" style={{ ['--D']: 5, ['--S']: 26 }}>
                  <p>Don't have an account? <br /> <a href="#" className="SignUpLink" onClick={(e) => { e.preventDefault(); setActive(true) }}>Sign Up</a></p>
                </div>
              )}
            </form>
          </div>

          <div className="info-content Login">
            {isAdminMode ? (
              <>
                <h2 className="animation" style={{ ['--D']: 1, ['--S']: 21 }}>
                  Admin Access
                </h2>
                <p className="animation" style={{ ['--D']: 1.2, ['--S']: 21.2 }}>
                  Welcome to the Admin Dashboard. Please login with your admin credentials to manage students, sessions, and system settings.
                </p>
              </>
            ) : (
              <p className="animation" style={{ ['--D']: 1, ['--S']: 21 }}>
                Welcome back to the ZeroOne Coding Club ERP Portal. Great to see you again. Let's continue building, learning, and innovating together!
              </p>
            )}
          </div>

          {/* Registration Form - Available for students */}
          {!isAdminMode && (
            <div className="form-box Register">
              <h2 className="animation" style={{ ['--li']: 17, ['--S']: 0 }}>Register</h2>

              {/* Registration Mode Toggle */}
              <div className="animation" style={{ ['--li']: 17.5, ['--S']: 0.5, marginBottom: '1rem', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setUsePendingRegistration(!usePendingRegistration)
                    // Reset form when switching modes
                    setStudentFullName('')
                    setIdNumber('')
                    setRegEmail('')
                    setRegPass('')
                    setConfirmPass('')
                    setPendingRegPhone('')
                    setOtpSent(false)
                    setEmailVerified(false)
                    setOtp('')
                  }}
                  style={{
                    background: usePendingRegistration ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #4f9cff 0%, #3b82f6 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {usePendingRegistration ? '✓ Quick Registration (No OTP)' : 'Switch to Quick Registration'}
                </button>
                {usePendingRegistration && (
                  <p style={{ color: '#fbbf24', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    ⚠️ Your account will need admin approval before you can login
                  </p>
                )}
              </div>

              <form onSubmit={(e) => e.preventDefault()}>
                <div className="input-box animation" style={{ ['--li']: 18, ['--S']: 1 }}>
                  <input
                    type="text"
                    required
                    value={studentFullName}
                    onChange={e => setStudentFullName(e.target.value)}
                  />
                  <label>Student Full Name</label>
                  <box-icon type='solid' name='user' color="gray"></box-icon>
                </div>

                <div className="input-box animation" style={{ ['--li']: 19, ['--S']: 2 }}>
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setIdNumber(value)
                      if (value.length === 10) {
                        const generatedEmail = `${value}@kluniversity.in`
                        setRegEmail(generatedEmail)
                        setOtpSent(false)
                        setEmailVerified(false)
                        setOtp('')
                      } else {
                        setRegEmail('')
                        setOtpSent(false)
                        setEmailVerified(false)
                      }
                    }}
                    placeholder="Enter 10-digit ID number"
                    maxLength={10}
                  />
                  <label>ID Number</label>
                  <box-icon name='id-card' type='solid' color="gray"></box-icon>
                </div>

                {idNumber.length === 10 && (
                  <div className="input-box animation" style={{ ['--li']: 19.3, ['--S']: 2.3 }}>
                    <input
                      type="email"
                      value={regEmail}
                      readOnly
                      disabled
                    />
                    <label>Email (Auto-generated)</label>
                    <box-icon name='envelope' type='solid' color="gray"></box-icon>
                  </div>
                )}

                {/* Phone Number - Only for pending registration */}
                {idNumber.length === 10 && usePendingRegistration && (
                  <div className="input-box animation" style={{ ['--li']: 19.4, ['--S']: 2.4 }}>
                    <input
                      type="tel"
                      value={pendingRegPhone}
                      onChange={(e) => setPendingRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Optional"
                      maxLength={10}
                    />
                    <label>Phone Number (Optional)</label>
                    <box-icon name='phone' type='solid' color="gray"></box-icon>
                  </div>
                )}

                {/* OTP Verification - Only show if NOT using pending registration */}
                {idNumber.length === 10 && regEmail && !usePendingRegistration && (
                  <div className="input-box animation" style={{ ['--li']: 19.5, ['--S']: 2.5 }}>
                    <button
                      type="button"
                      className="btn-verify-email"
                      onClick={async () => {
                        if (!regEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
                          showToast.error('Please enter a valid ID number')
                          return
                        }
                        setOtpLoading(true)
                        try {
                          const res = await fetchWithTimeout(`${API_URL}/api/auth/request-otp`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: regEmail })
                          })

                          if (!res.ok) {
                            await res.json().catch(() => ({}))
                            throw new Error(`Server error: ${res.status}`)
                          }

                          await res.json()
                          setOtpSent(true)
                          setOtpResendTimer(60)
                          showToast.success('OTP sent to your email! Please check your inbox.')
                        } catch (err) {
                          console.error('OTP request error:', err)
                          let errorMsg = ''
                          if (err.name === 'TypeError' && err.message.includes('fetch')) {
                            errorMsg = 'Unable to connect to server. Please check your internet connection.'
                          } else if (err.message.includes('timeout')) {
                            errorMsg = 'Connection timeout. Please try again.'
                          } else if (err.message.toLowerCase().includes('email') || err.message.toLowerCase().includes('invalid')) {
                            errorMsg = 'Invalid email address. Please check your ID number.'
                          } else if (err.message.toLowerCase().includes('rate limit') || err.message.toLowerCase().includes('too many')) {
                            errorMsg = 'Too many attempts. Please wait a few minutes before trying again.'
                          } else {
                            errorMsg = err.message || 'Failed to send OTP. Please try again.'
                          }
                          showToast.error(errorMsg)
                        } finally {
                          setOtpLoading(false)
                        }
                      }}
                      disabled={otpLoading || (otpSent && otpResendTimer > 0)}
                      aria-label="Send OTP to verify email"
                    >
                      {otpLoading ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <span className="loading-spinner"></span>
                          Sending...
                        </span>
                      ) : otpSent && otpResendTimer > 0 ?
                        `Resend in ${otpResendTimer}s` :
                        otpSent ?
                          'Resend OTP' :
                          'Verify Email'}
                    </button>
                  </div>
                )}

                {/* OTP Input Fields - Only show if OTP was sent */}
                {otpSent && !usePendingRegistration && (
                  <>
                    <div className="input-box animation" style={{ ['--li']: 19.7, ['--S']: 2.7 }}>
                      <input
                        type="text"
                        value={otp}
                        onChange={e => {
                          setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                      />
                      <label>OTP Code</label>
                      <box-icon name='key' type='solid' color="gray"></box-icon>
                    </div>
                    <div className="input-box animation" style={{ ['--li']: 19.8, ['--S']: 2.8 }}>
                      <button
                        type="button"
                        className="btn-verify-otp"
                        onClick={async () => {
                          if (otp.length !== 6) {
                            showToast.error('Please enter 6-digit OTP')
                            return
                          }
                          setOtpLoading(true)
                          try {
                            const res = await fetchWithTimeout(`${API_URL}/api/auth/verify-otp`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: regEmail, otp })
                            })

                            if (!res.ok) {
                              await res.json().catch(() => ({}))
                              throw new Error(`Server error: ${res.status}`)
                            }

                            await res.json()
                            setEmailVerified(true)
                            showToast.success('Email verified successfully!')
                          } catch (err) {
                            console.error('OTP verify error:', err)
                            let errorMsg = ''
                            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                              errorMsg = 'Unable to connect to server. Please check your internet connection.'
                            } else if (err.message.includes('timeout')) {
                              errorMsg = 'Connection timeout. Please try again.'
                            } else if (err.message.toLowerCase().includes('invalid') || err.message.toLowerCase().includes('incorrect')) {
                              errorMsg = 'Incorrect OTP. Please check the code and try again.'
                            } else if (err.message.toLowerCase().includes('expired')) {
                              errorMsg = 'OTP has expired. Please request a new one.'
                            } else {
                              errorMsg = err.message || 'OTP verification failed. Please try again.'
                            }
                            showToast.error(errorMsg)
                            setOtp('')
                          } finally {
                            setOtpLoading(false)
                          }
                        }}
                        disabled={otpLoading || otp.length !== 6}
                      >
                        {otpLoading ? 'Verifying...' : emailVerified ? '✓ Verified' : 'Verify OTP'}
                      </button>
                    </div>
                  </>
                )}


                <div className="input-box animation" style={{ ['--li']: 20, ['--S']: 3 }} data-password-visible={showRegPass}>
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    name="new-password"
                    id="reg-password"
                    autoComplete="new-password"
                    required
                    value={regPass}
                    onChange={e => setRegPass(e.target.value)}
                    aria-label="New password"
                    aria-required="true"
                    aria-describedby="password-requirements"
                  />
                  <label>Password</label>
                  <box-icon name='lock-alt' type='solid' color="gray"></box-icon>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={(e) => {
                      e.preventDefault();
                      const input = document.getElementById('reg-password');
                      if (input) {
                        const cursorPosition = input.selectionStart;
                        setShowRegPass(!showRegPass);
                        setTimeout(() => {
                          input.focus();
                          input.setSelectionRange(cursorPosition, cursorPosition);
                        }, 0);
                      } else {
                        setShowRegPass(!showRegPass);
                      }
                    }}
                    tabIndex={0}
                    aria-label={showRegPass ? "Hide password" : "Show password"}
                  >
                    {showRegPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {regPass && (
                  <div className="password-strength-container animation" style={{ ['--li']: 20.1, ['--S']: 3.1 }}>
                    <div className="password-strength-bar">
                      <div
                        className="password-strength-fill"
                        style={{
                          width: `${passwordStrength}%`,
                          backgroundColor: getPasswordStrengthColor(passwordStrength)
                        }}
                      ></div>
                    </div>
                    <div
                      className="password-strength-label"
                      style={{ color: getPasswordStrengthColor(passwordStrength) }}
                    >
                      {getPasswordStrengthLabel(passwordStrength)}
                    </div>
                    <div id="password-requirements" className="password-requirements">
                      Password must be at least 6 characters long
                    </div>
                  </div>
                )}

                <div className="input-box animation" style={{ ['--li']: 20.2, ['--S']: 3.2 }} data-password-visible={showConfirmPass}>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    name="confirm-password"
                    id="reg-confirm-password"
                    autoComplete="new-password"
                    required
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    aria-label="Confirm password"
                    aria-required="true"
                    aria-invalid={confirmPass && regPass !== confirmPass ? "true" : "false"}
                  />
                  <label>Confirm Password</label>
                  <box-icon name='lock-alt' type='solid' color="gray"></box-icon>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={(e) => {
                      e.preventDefault();
                      const input = document.getElementById('reg-confirm-password');
                      if (input) {
                        const cursorPosition = input.selectionStart;
                        setShowConfirmPass(!showConfirmPass);
                        setTimeout(() => {
                          input.focus();
                          input.setSelectionRange(cursorPosition, cursorPosition);
                        }, 0);
                      } else {
                        setShowConfirmPass(!showConfirmPass);
                      }
                    }}
                    tabIndex={0}
                    aria-label={showConfirmPass ? "Hide password" : "Show password"}
                  >
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>


                <div className="input-box animation" style={{ ['--li']: 21, ['--S']: 4 }}>
                  <button
                    className="btn"
                    type="submit"
                    disabled={
                      registerLoading ||
                      !studentFullName ||
                      !idNumber ||
                      !regPass ||
                      !confirmPass ||
                      (!usePendingRegistration && !emailVerified) // Only require email verification for OTP mode
                    }
                    aria-label="Register new account"
                    aria-busy={registerLoading}
                    onClick={async (e) => {
                      e.preventDefault()

                      // Common validations
                      if (!studentFullName || studentFullName.trim().length < 3) {
                        showToast.error('Please enter your full name (at least 3 characters)')
                        return
                      }

                      if (!idNumber || idNumber.length !== 10) {
                        showToast.error('Please enter a valid 10-digit ID number')
                        return
                      }

                      if (!regPass || regPass.length < 6) {
                        showToast.error('Password must be at least 6 characters long')
                        return
                      }

                      if (regPass !== confirmPass) {
                        showToast.error('Passwords do not match. Please check and try again.')
                        return
                      }

                      setRegisterLoading(true)

                      try {
                        // Choose endpoint based on registration mode
                        const endpoint = usePendingRegistration
                          ? `${API_URL}/api/auth/register-pending`
                          : `${API_URL}/api/auth/register`

                        const payload = usePendingRegistration
                          ? {
                            studentFullName: studentFullName,
                            idNumber: idNumber,
                            email: regEmail,
                            password: regPass,
                            phone: pendingRegPhone || ''
                          }
                          : {
                            studentFullName: studentFullName,
                            idNumber: idNumber,
                            email: regEmail,
                            password: regPass
                          }

                        const res = await fetchWithTimeout(endpoint, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
                        })

                        if (!res.ok) {
                          const errorData = await res.json().catch(() => ({}))
                          throw new Error(errorData.error || 'Registration failed')
                        }

                        await res.json()

                        // Clear any stored tokens
                        localStorage.removeItem('authToken')
                        localStorage.removeItem('user')

                        // Show appropriate success message
                        if (usePendingRegistration) {
                          showToast.success('Registration submitted! Your account is pending admin approval. You will be notified once approved.')
                        } else {
                          showToast.success('Registration successful! Please login with your credentials.')
                        }

                        // Switch to login view and clear form
                        setActive(false)
                        setStudentFullName('')
                        setIdNumber('')
                        setRegEmail('')
                        setRegPass('')
                        setConfirmPass('')
                        setPendingRegPhone('')
                        setEmailVerified(false)
                        setOtpSent(false)
                        setOtp('')
                        setUsePendingRegistration(false)

                      } catch (err) {
                        console.error('Registration error:', err)
                        let errorMsg = ''
                        if (err.name === 'TypeError' && err.message.includes('fetch')) {
                          errorMsg = 'Unable to connect to server. Please check your internet connection.'
                        } else if (err.message.includes('timeout')) {
                          errorMsg = 'Connection timeout. Please try again.'
                        } else if (err.message.toLowerCase().includes('already exists') || err.message.toLowerCase().includes('duplicate')) {
                          errorMsg = 'An account with this email or ID already exists. Please login instead.'
                        } else if (err.message.toLowerCase().includes('pending')) {
                          errorMsg = err.message
                        } else if (err.message.toLowerCase().includes('email')) {
                          errorMsg = 'Invalid email address. Please check and try again.'
                        } else {
                          errorMsg = err.message || 'Registration failed. Please try again later.'
                        }
                        showToast.error(errorMsg)
                      } finally {
                        setRegisterLoading(false)
                      }
                    }}
                  >
                    {registerLoading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span className="loading-spinner"></span>
                        Registering...
                      </span>
                    ) : 'Register'}
                  </button>
                </div>

                <div className="regi-link animation" style={{ ['--li']: 21, ['--S']: 5 }}>
                  <p>Already have an account? <br /> <a href="#" className="SignInLink" onClick={(e) => { e.preventDefault(); setActive(false) }}>Sign In</a></p>
                </div>
              </form>
            </div>
          )}

          {/* Registration Info Content */}
          {!isAdminMode && (
            <div className="info-content Register">
              <h2 className="animation" style={{ ['--li']: 17, ['--S']: 0 }}>Welcome to ZeroOne Club!</h2>
              <p className="animation" style={{ ['--li']: 18, ['--S']: 1 }}>Please register using your KL mail ID.</p>
            </div>
          )}
        </div>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="forgot-password-modal">
            <div className="forgot-password-content">
              <h2>Reset Password</h2>
              <button
                className="close-modal-btn"
                onClick={() => {
                  setShowForgotPassword(false)
                  setForgotUsernameOrEmail('')
                  setForgotOtpSent(false)
                  setForgotOtp('')
                  setForgotOtpVerified(false)
                  setResetToken('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setForgotPasswordError('')
                }}
              >
                ×
              </button>

              {!forgotOtpVerified ? (
                <>
                  {!forgotOtpSent ? (
                    <>
                      <div className="input-box">
                        <input
                          type="text"
                          required
                          value={forgotUsernameOrEmail}
                          onChange={e => setForgotUsernameOrEmail(e.target.value)}
                          placeholder="Enter username or email"
                        />
                        <label>Username or Email</label>
                        <box-icon type='solid' name='user' color="gray"></box-icon>
                      </div>


                      <div className="input-box">
                        <button
                          className="btn"
                          type="button"
                          disabled={!forgotUsernameOrEmail || forgotPasswordLoading}
                          onClick={async () => {
                            if (!forgotUsernameOrEmail) {
                              setForgotPasswordError('Please enter your username or email')
                              return
                            }

                            setForgotPasswordLoading(true)
                            setForgotPasswordError('')

                            try {
                              const res = await fetchWithTimeout(`${API_URL}/api/auth/forgot-password`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ usernameOrEmail: forgotUsernameOrEmail })
                              })

                              if (!res.ok) {
                                await res.json().catch(() => ({}))
                                throw new Error('Failed to send OTP')
                              }

                              await res.json()
                              setForgotOtpSent(true)
                              setForgotPasswordError('')
                            } catch (err) {
                              if (err.name === 'TypeError' && err.message.includes('fetch')) {
                                setForgotPasswordError(`Connection failed. Is the server running on ${API_URL}?`)
                              } else {
                                setForgotPasswordError(err.message || 'Failed to send OTP')
                              }
                              console.error('Forgot password error:', err)
                            } finally {
                              setForgotPasswordLoading(false)
                            }
                          }}
                        >
                          {forgotPasswordLoading ? 'Sending...' : 'Send OTP'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="input-box">
                        <input
                          type="text"
                          value={forgotOtp}
                          onChange={e => {
                            setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                            setForgotPasswordError('')
                          }}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                        />
                        <label>OTP Code</label>
                        <box-icon name='key' type='solid' color="gray"></box-icon>
                      </div>


                      <div className="input-box">
                        <button
                          className="btn"
                          type="button"
                          disabled={forgotOtp.length !== 6 || forgotPasswordLoading}
                          onClick={async () => {
                            if (forgotOtp.length !== 6) {
                              setForgotPasswordError('Please enter 6-digit OTP')
                              return
                            }

                            setForgotPasswordLoading(true)
                            setForgotPasswordError('')

                            try {
                              const res = await fetchWithTimeout(`${API_URL}/api/auth/verify-reset-otp`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  usernameOrEmail: forgotUsernameOrEmail,
                                  otp: forgotOtp
                                })
                              })

                              if (!res.ok) {
                                const data = await res.json().catch(() => ({}))
                                throw new Error(data.error || 'OTP verification failed')
                              }

                              const data = await res.json()
                              setResetToken(data.resetToken)
                              setForgotOtpVerified(true)
                              setForgotPasswordError('')
                            } catch (err) {
                              if (err.name === 'TypeError' && err.message.includes('fetch')) {
                                setForgotPasswordError(`Connection failed. Is the server running on ${API_URL}?`)
                              } else {
                                setForgotPasswordError(err.message || 'OTP verification failed')
                              }
                              setForgotOtp('')
                              console.error('Verify reset OTP error:', err)
                            } finally {
                              setForgotPasswordLoading(false)
                            }
                          }}
                        >
                          {forgotPasswordLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="otp-success">
                    OTP verified successfully! Please set your new password.
                  </div>

                  <div className="input-box" data-password-visible={showNewPassword}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="new-password"
                      autoComplete="new-password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <label>New Password</label>
                    <box-icon name='lock-alt' type='solid' color="gray"></box-icon>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="input-box" data-password-visible={showConfirmPassword}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm-password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <label>Confirm Password</label>
                    <box-icon name='lock-alt' type='solid' color="gray"></box-icon>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {forgotPasswordError && (
                    <div className="otp-error">
                      {forgotPasswordError}
                    </div>
                  )}

                  <div className="input-box">
                    <button
                      className="btn"
                      type="button"
                      disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || forgotPasswordLoading}
                      onClick={async () => {
                        if (!newPassword || !confirmPassword) {
                          setForgotPasswordError('Please fill all fields')
                          return
                        }

                        if (newPassword !== confirmPassword) {
                          setForgotPasswordError('Passwords do not match')
                          return
                        }

                        if (newPassword.length < 6) {
                          setForgotPasswordError('Password must be at least 6 characters')
                          return
                        }

                        setForgotPasswordLoading(true)
                        setForgotPasswordError('')

                        try {
                          const res = await fetchWithTimeout(`${API_URL}/api/auth/reset-password`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              resetToken,
                              newPassword
                            })
                          })

                          if (!res.ok) {
                            await res.json().catch(() => ({}))
                            throw new Error('Password reset failed')
                          }

                          await res.json()

                          // Success - close modal and show success message
                          alert('Password reset successfully! Please login with your new password.')
                          setShowForgotPassword(false)
                          setForgotUsernameOrEmail('')
                          setForgotOtpSent(false)
                          setForgotOtp('')
                          setForgotOtpVerified(false)
                          setResetToken('')
                          setNewPassword('')
                          setConfirmPassword('')
                          setForgotPasswordError('')
                        } catch (err) {
                          if (err.name === 'TypeError' && err.message.includes('fetch')) {
                            setForgotPasswordError(`Connection failed. Is the server running on ${API_URL}?`)
                          } else {
                            setForgotPasswordError(err.message || 'Password reset failed')
                          }
                          console.error('Reset password error:', err)
                        } finally {
                          setForgotPasswordLoading(false)
                        }
                      }}
                    >
                      {forgotPasswordLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}


