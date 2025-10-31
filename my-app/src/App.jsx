import LiquidEther from './components/LiquidEther.jsx'
import Login from './components/Login.jsx'
import navLogo from './assets/navLogo.jpg'
import sacLogo from './assets/sac_logo.png'
import './App.css'

export default function App() {
  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', background: 'transparent' }}>
      <header className="app-header">
        <img src={navLogo} alt="Title" className="app-logo" />
        <img src={sacLogo} alt="SAC" className="app-logo-right" />
      </header>
      <LiquidEther />
      <Login />
    </div>
  )
}


