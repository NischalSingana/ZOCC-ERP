import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
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
  const [otpError, setOtpError] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')

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
              setLoginError('')

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
                  setLoginError(result.error || 'Login failed. Please check your credentials.')
                }
              } catch (err) {
                console.error('Login error:', err)
                setLoginError(err.message || 'Login failed. Please check your credentials.')
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
                required 
                value={loginEmail} 
                onChange={e => setLoginEmail(e.target.value)} 
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
                key={`login-pass-${showLoginPass}`}
              />
              <label htmlFor="login-password">Password</label>
              <box-icon name='lock-alt' type='solid' color="gray"></box-icon>
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowLoginPass(!showLoginPass)}
                tabIndex={-1}
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

            {loginError && (
              <div className="otp-error animation" style={{ ['--D']: isAdminMode ? 2.5 : 3.5, ['--S']: isAdminMode ? 23.5 : 24.5 }}>
                {loginError}
              </div>
            )}

            <div className="input-box animation" style={{ ['--D']: isAdminMode ? 3 : 4, ['--S']: isAdminMode ? 24 : 25 }}>
              <button
                className="btn"
                type="submit"
                disabled={(!isAdminMode && !captchaVerified) || loginLoading || !loginEmail || !loginPass}
              >
                {loginLoading ? 'Logging in...' : 'Login'}
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
                      setOtpError('')
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

              {idNumber.length === 10 && regEmail && (
                <div className="input-box animation" style={{ ['--li']: 19.5, ['--S']: 2.5 }}>
                  <button
                    type="button"
                    className="btn-verify-email"
                    onClick={async () => {
                      if (!regEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
                        setOtpError('Please enter a valid ID number')
                        return
                      }
                      setOtpLoading(true)
                      setOtpError('')
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
                        setOtpError('')
                      } catch (err) {
                        if (err.name === 'TypeError' && err.message.includes('fetch')) {
                          setOtpError(`Connection failed. Is the server running on ${API_URL}?`)
                        } else {
                          setOtpError(err.message || 'Failed to send OTP')
                        }
                        console.error('OTP request error:', err)
                      } finally {
                        setOtpLoading(false)
                      }
                    }}
                    disabled={otpLoading || otpSent}
                  >
                    {otpLoading ? 'Sending...' : otpSent ? '✓ OTP Sent' : 'Verify Email'}
                  </button>
                </div>
              )}

              {otpSent && (
                <>
                  <div className="input-box animation" style={{ ['--li']: 19.7, ['--S']: 2.7 }}>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => {
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                        setOtpError('')
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
                          setOtpError('Please enter 6-digit OTP')
                          return
                        }
                        setOtpLoading(true)
                        setOtpError('')
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
                          setOtpError('')
                        } catch (err) {
                          if (err.name === 'TypeError' && err.message.includes('fetch')) {
                            setOtpError(`Connection failed. Is the server running on ${API_URL}?`)
                          } else {
                            setOtpError(err.message || 'OTP verification failed')
                          }
                          setOtp('')
                          console.error('OTP verify error:', err)
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

              {otpError && (
                <div className="otp-error animation" style={{ ['--li']: 19.9, ['--S']: 2.9 }}>
                  {otpError}
                </div>
              )}

              {emailVerified && (
                <div className="otp-success animation" style={{ ['--li']: 19.95, ['--S']: 2.95 }}>
                  Email verified successfully!
                </div>
              )}

              <div className="input-box animation" style={{ ['--li']: 20, ['--S']: 3 }} data-password-visible={showRegPass}>
                <input
                  type={showRegPass ? 'text' : 'password'}
                  name="new-password"
                  autoComplete="new-password"
                  required
                  value={regPass}
                  onChange={e => setRegPass(e.target.value)}
                  key={`reg-pass-${showRegPass}`}
                />
                <label>Password</label>
                <box-icon name='lock-alt' type='solid' color="gray"></box-icon>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowRegPass(!showRegPass)}
                  tabIndex={-1}
                >
                  {showRegPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="input-box animation" style={{ ['--li']: 20.2, ['--S']: 3.2 }} data-password-visible={showConfirmPass}>
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  name="confirm-password"
                  autoComplete="new-password"
                  required
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  key={`confirm-pass-${showConfirmPass}`}
                />
                <label>Confirm Password</label>
                <box-icon name='lock-alt' type='solid' color="gray"></box-icon>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  tabIndex={-1}
                >
                  {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {registerError && (
                <div className="otp-error animation" style={{ ['--li']: 20.5, ['--S']: 3.5 }}>
                  {registerError}
                </div>
              )}

              <div className="input-box animation" style={{ ['--li']: 21, ['--S']: 4 }}>
                <button
                  className="btn"
                  type="submit"
                  disabled={!emailVerified || registerLoading || !studentFullName || !idNumber || !regPass || !confirmPass}
                  onClick={async (e) => {
                    e.preventDefault()
                    if (!emailVerified || !studentFullName || !idNumber || !regEmail || !regPass || !confirmPass) {
                      setRegisterError('Please fill all fields and verify email')
                      return
                    }

                    if (regPass !== confirmPass) {
                      setRegisterError('Passwords do not match')
                      return
                    }

                    if (regPass.length < 6) {
                      setRegisterError('Password must be at least 6 characters')
                      return
                    }

                    setRegisterLoading(true)
                    setRegisterError('')

                    try {
                      const res = await fetchWithTimeout(`${API_URL}/api/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          studentFullName: studentFullName,
                          idNumber: idNumber,
                          email: regEmail,
                          password: regPass
                        })
                      })

                      if (!res.ok) {
                        await res.json().catch(() => ({}))
                        throw new Error('Registration failed')
                      }

                      await res.json()

                      // Clear any stored tokens (user needs to login)
                      localStorage.removeItem('authToken')
                      localStorage.removeItem('user')

                      // Show success message
                      alert('Registration successful! Please login with your credentials.')

                      // Switch to login view and clear form
                      setActive(false)
                      setStudentFullName('')
                      setIdNumber('')
                      setRegEmail('')
                      setRegPass('')
                      setConfirmPass('')
                      setEmailVerified(false)
                      setOtpSent(false)
                      setOtp('')
                      setOtpError('')
                      setRegisterError('')

                    } catch (err) {
                      if (err.name === 'TypeError' && err.message.includes('fetch')) {
                        setRegisterError(`Connection failed. Is the server running on ${API_URL}?`)
                      } else {
                        setRegisterError(err.message || 'Registration failed')
                      }
                      console.error('Registration error:', err)
                    } finally {
                      setRegisterLoading(false)
                    }
                  }}
                >
                  {registerLoading ? 'Registering...' : 'Register'}
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

                    {forgotPasswordError && (
                      <div className="otp-error">
                        {forgotPasswordError}
                      </div>
                    )}

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

                    {forgotPasswordError && (
                      <div className="otp-error">
                        {forgotPasswordError}
                      </div>
                    )}

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
                    key={`new-pass-${showNewPassword}`}
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
                    key={`confirm-new-pass-${showConfirmPassword}`}
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
  )
}


