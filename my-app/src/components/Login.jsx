import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import './Login.css'
import Captcha from './Captcha.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function Login() {
  const navigate = useNavigate()
  const [active, setActive] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  
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
    <div className={`animated-auth ${active ? 'active' : ''}`}>
      <div className="container">
        <div className="curved-shape"></div>
        <div className="curved-shape2"></div>

        <div className="form-box Login">
          <h2 className="animation" style={{ ['--D']: 0, ['--S']: 21 }}>Login</h2>
          <form onSubmit={(e)=>e.preventDefault()}>
            <div className="input-box animation" style={{ ['--D']: 1, ['--S']: 22 }}>
              <input type="email" required value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} />
              <label>Email</label>
              <box-icon name='envelope' type='solid' color="gray"></box-icon>
            </div>

            <div className="input-box animation" style={{ ['--D']: 2, ['--S']: 23 }}>
              <input 
                type={showLoginPass ? 'text' : 'password'} 
                required 
                value={loginPass} 
                onChange={e=>setLoginPass(e.target.value)} 
              />
              <label>Password</label>
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

            <div className="animation" style={{ ['--D']: 3, ['--S']: 24 }}>
              <Captcha onVerify={setCaptchaVerified} />
            </div>

            {loginError && (
              <div className="otp-error animation" style={{ ['--D']: 3.5, ['--S']: 24.5 }}>
                {loginError}
              </div>
            )}

            <div className="input-box animation" style={{ ['--D']: 4, ['--S']: 25 }}>
              <button 
                className="btn" 
                type="submit" 
                disabled={!captchaVerified || loginLoading}
                onClick={async (e) => {
                  e.preventDefault()
                  if (!captchaVerified || !loginEmail || !loginPass) return
                  
                  setLoginLoading(true)
                  setLoginError('')
                  
                  try {
                    const res = await fetch(`${API_URL}/api/auth/login`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        email: loginEmail.toLowerCase().trim(), 
                        password: loginPass 
                      })
                    })
                    
                    const data = await res.json().catch(() => ({}))
                    
                    if (!res.ok) {
                      throw new Error(data.error || data.message || `Login failed: ${res.status}`)
                    }
                    
                    if (!data.token || !data.user) {
                      throw new Error('Invalid response from server')
                    }
                    
                    // Store token in localStorage
                    localStorage.setItem('authToken', data.token)
                    localStorage.setItem('user', JSON.stringify(data.user))
                    
                    // Redirect to Dashboard after successful login
                    navigate('/dashboard')
                    
                  } catch (err) {
                    console.error('Login error:', err)
                    if (err.name === 'TypeError' && err.message.includes('fetch')) {
                      setLoginError(`Connection failed. Is the server running on ${API_URL}?`)
                    } else {
                      setLoginError(err.message || 'Login failed. Please check your credentials.')
                    }
                  } finally {
                    setLoginLoading(false)
                  }
                }}
              >
                {loginLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>

            <div className="regi-link animation" style={{ ['--D']: 5, ['--S']: 26 }}>
              <p>Don't have an account? <br/> <a href="#" className="SignUpLink" onClick={(e)=>{e.preventDefault(); setActive(true)}}>Sign Up</a></p>
            </div>
          </form>
        </div>

        <div className="info-content Login">
          <p className="animation" style={{ ['--D']: 1, ['--S']: 21 }}>
  Welcome back to the ZeroOne Coding Club ERP Portal. Great to see you again. Let's continue building, learning, and innovating together!
</p>
        </div>

        <div className="form-box Register">
          <h2 className="animation" style={{ ['--li']: 17, ['--S']: 0 }}>Register</h2>
          <form onSubmit={(e)=>e.preventDefault()}>
            <div className="input-box animation" style={{ ['--li']: 18, ['--S']: 1 }}>
              <input 
                type="text" 
                required 
                value={studentFullName} 
                onChange={e=>setStudentFullName(e.target.value)} 
              />
              <label>Student Full Name</label>
              <box-icon type='solid' name='user' color="gray"></box-icon>
            </div>

            <div className="input-box animation" style={{ ['--li']: 19, ['--S']: 2 }}>
              <input 
                type="text" 
                required 
                value={idNumber} 
                onChange={e=>{
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
                      const res = await fetch(`${API_URL}/api/auth/request-otp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: regEmail })
                      })
                      
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}))
                        throw new Error(data.error || `Server error: ${res.status}`)
                      }
                      
                      const data = await res.json()
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
                    onChange={e=>{
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
                        const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: regEmail, otp })
                        })
                        
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}))
                          throw new Error(data.error || `Server error: ${res.status}`)
                        }
                        
                        const data = await res.json()
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

            <div className="input-box animation" style={{ ['--li']: 20, ['--S']: 3 }}>
              <input 
                type={showRegPass ? 'text' : 'password'} 
                required 
                value={regPass} 
                onChange={e=>setRegPass(e.target.value)} 
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

            <div className="input-box animation" style={{ ['--li']: 20.2, ['--S']: 3.2 }}>
              <input 
                type={showConfirmPass ? 'text' : 'password'} 
                required 
                value={confirmPass} 
                onChange={e=>setConfirmPass(e.target.value)} 
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
                    const res = await fetch(`${API_URL}/api/auth/register`, {
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
                      const data = await res.json().catch(() => ({}))
                      throw new Error(data.error || 'Registration failed')
                    }
                    
                    const data = await res.json()
                    
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
              <p>Already have an account? <br/> <a href="#" className="SignInLink" onClick={(e)=>{e.preventDefault(); setActive(false)}}>Sign In</a></p>
            </div>
          </form>
        </div>

        <div className="info-content Register">
          <h2 className="animation" style={{ ['--li']: 17, ['--S']: 0 }}>Welcome to ZeroOne Club!</h2>
          <p className="animation" style={{ ['--li']: 18, ['--S']: 1 }}>Please register using your KL mail ID.</p>
        </div>
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
                            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ usernameOrEmail: forgotUsernameOrEmail })
                            })
                            
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}))
                              throw new Error(data.error || 'Failed to send OTP')
                            }
                            
                            const data = await res.json()
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
                            const res = await fetch(`${API_URL}/api/auth/verify-reset-otp`, {
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

                <div className="input-box">
                  <input 
                    type={showNewPassword ? 'text' : 'password'} 
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

                <div className="input-box">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
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
                        const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            resetToken,
                            newPassword 
                          })
                        })
                        
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}))
                          throw new Error(data.error || 'Password reset failed')
                        }
                        
                        const data = await res.json()
                        
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


