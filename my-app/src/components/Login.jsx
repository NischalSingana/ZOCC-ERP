import { useState } from 'react'
import './Login.css'

export default function Login() {
  const [active, setActive] = useState(false)
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [regUser, setRegUser] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')

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

            <div className="input-box animation" style={{ ['--D']: 3, ['--S']: 24 }}>
              <button className="btn" type="submit">Login</button>
            </div>

            <div className="regi-link animation" style={{ ['--D']: 4, ['--S']: 25 }}>
              <p>Don't have an account? <br/> <a href="#" className="SignUpLink" onClick={(e)=>{e.preventDefault(); setActive(true)}}>Sign Up</a></p>
            </div>
          </form>
        </div>

        <div className="info-content Login">
          <h2 className="animation" style={{ ['--D']: 0, ['--S']: 20 }}>WELCOME BACK!</h2>
          <p className="animation" style={{ ['--D']: 1, ['--S']: 21 }}>  Welcome to the ZeroOne Club ERP Portal. Great to see you again — let's continue building, learning, and innovating together!</p>
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
              <input type="email" required value={regEmail} onChange={e=>setRegEmail(e.target.value)} />
              <label>Email</label>
              <box-icon name='envelope' type='solid' color="gray"></box-icon>
            </div>

            <div className="input-box animation" style={{ ['--li']: 19, ['--S']: 3 }}>
              <input type="password" required value={regPass} onChange={e=>setRegPass(e.target.value)} />
              <label>Password</label>
              <box-icon name='lock-alt' type='solid' color="gray"></box-icon>
            </div>

            <div className="input-box animation" style={{ ['--li']: 20, ['--S']: 4 }}>
              <button className="btn" type="submit">Register</button>
            </div>

            <div className="regi-link animation" style={{ ['--li']: 21, ['--S']: 5 }}>
              <p>Already have an account? <br/> <a href="#" className="SignInLink" onClick={(e)=>{e.preventDefault(); setActive(false)}}>Sign In</a></p>
            </div>
          </form>
        </div>

        <div className="info-content Register">
          <h2 className="animation" style={{ ['--li']: 17, ['--S']: 0 }}>WELCOME!</h2>
          <p className="animation" style={{ ['--li']: 18, ['--S']: 1 }}>We’re delighted to have you here. If you need any assistance, feel free to reach out.</p>
        </div>
      </div>
    </div>
  )
}


