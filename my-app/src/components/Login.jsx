import { useState } from 'react'
import './Login.css'
import Captcha from './Captcha.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const REDIRECT_URL = 'https://zeroonelearning.vercel.app/'

export default function Login() {
  const [active, setActive] = useState(false)
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  
  const [regUser, setRegUser] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')

  return (
    <div className={`animated-auth ${active ? 'active' : ''}`}>
      <div className="container">
        <div className="curved-shape"></div>
        <div className="curved-shape2"></div>

        <div className="form-box Login">
          <h2 className="animation" style={{ ['--D']: 0, ['--S']: 21 }}>Login</h2>
          <form onSubmit={(e)=>e.preventDefault()}>
            <div className="input-box animation" style={{ ['--D']: 1, ['--S']: 22 }}>
              <input type="text" required value={loginUser} onChange={e=>setLoginUser(e.target.value)} />
              <label>Username</label>
              <box-icon type='solid' name='user' color="gray"></box-icon>
            </div>

            <div className="input-box animation" style={{ ['--D']: 2, ['--S']: 23 }}>
              <input type="password" required value={loginPass} onChange={e=>setLoginPass(e.target.value)} />
              <label>Password</label>
              <box-icon name='lock-alt' type='solid' color="gray"></box-icon>
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
                  if (!captchaVerified || !loginUser || !loginPass) return
                  
                  setLoginLoading(true)
                  setLoginError('')
                  
                  try {
                    const res = await fetch(`${API_URL}/api/auth/login`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        username: loginUser, 
                        password: loginPass 
                      })
                    })
                    
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}))
                      throw new Error(data.error || 'Login failed')
                    }
                    
                    const data = await res.json()
                    
                    // Store token in localStorage
                    localStorage.setItem('authToken', data.token)
                    localStorage.setItem('user', JSON.stringify(data.user))
                    
                    // Redirect to ZeroOne Learning
                    window.location.href = REDIRECT_URL
                    
                  } catch (err) {
                    if (err.name === 'TypeError' && err.message.includes('fetch')) {
                      setLoginError(`Connection failed. Is the server running on ${API_URL}?`)
                    } else {
                      setLoginError(err.message || 'Login failed')
                    }
                    console.error('Login error:', err)
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
              <input type="text" required value={regUser} onChange={e=>setRegUser(e.target.value)} />
              <label>Username</label>
              <box-icon type='solid' name='user' color="gray"></box-icon>
            </div>

            <div className="input-box animation" style={{ ['--li']: 19, ['--S']: 2 }}>
              <input 
                type="email" 
                required 
                value={regEmail} 
                onChange={e=>{
                  setRegEmail(e.target.value)
                  setOtpSent(false)
                  setEmailVerified(false)
                  setOtp('')
                  setOtpError('')
                }} 
              />
              <label>Email</label>
              <box-icon name='envelope' type='solid' color="gray"></box-icon>
            </div>

            {regEmail && (
              <div className="input-box animation" style={{ ['--li']: 19.5, ['--S']: 2.5 }}>
                <button
                  type="button"
                  className="btn-verify-email"
                  onClick={async () => {
                    if (!regEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
                      setOtpError('Please enter a valid email')
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
              <input type="password" required value={regPass} onChange={e=>setRegPass(e.target.value)} />
              <label>Password</label>
              <box-icon name='lock-alt' type='solid' color="gray"></box-icon>
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
                disabled={!emailVerified || registerLoading || !regUser || !regPass}
                onClick={async (e) => {
                  e.preventDefault()
                  if (!emailVerified || !regUser || !regEmail || !regPass) {
                    setRegisterError('Please fill all fields and verify email')
                    return
                  }
                  
                  setRegisterLoading(true)
                  setRegisterError('')
                  
                  try {
                    const res = await fetch(`${API_URL}/api/auth/register`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        username: regUser, 
                        email: regEmail, 
                        password: regPass 
                      })
                    })
                    
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}))
                      throw new Error(data.error || 'Registration failed')
                    }
                    
                    const data = await res.json()
                    
                    // Store token in localStorage
                    localStorage.setItem('authToken', data.token)
                    localStorage.setItem('user', JSON.stringify(data.user))
                    
                    // Redirect to ZeroOne Learning
                    window.location.href = REDIRECT_URL
                    
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
    </div>
  )
}


