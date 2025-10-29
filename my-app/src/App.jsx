import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import PlayfulShapes from './components/PlayfulShapes'

export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)

  const spring = useMemo(() => ({ type: 'spring', stiffness: 240, damping: 22 }), [])

  return (
    <div className="min-h-full w-full grid md:grid-cols-2 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="hidden md:flex items-center justify-center p-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full h-[80vh] max-w-[560px] bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl border border-gray-200/50 shadow-2xl flex items-center justify-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
          <PlayfulShapes lookAway={showPassword} />
        </motion.div>
      </div>

      <div className="flex items-center justify-center p-6">
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="soft-card w-full max-w-md p-10 bg-white/95 backdrop-blur-sm border border-white/20"
        >
          <motion.div 
            className="flex items-center gap-2 mb-8"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white grid place-items-center text-xl shadow-lg">✨</div>
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent">Welcome back!</h1>
          <p className="text-sm text-gray-600 mt-2">Please enter your details</p>

          <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={spring}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anna@gmail.com"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm mb-1">Password</label>
              </div>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  transition={spring}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all"
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </motion.button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 select-none">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 rounded border-gray-300" />
                Remember me
              </label>
              <button type="button" className="text-gray-600 hover:text-black">Forgot password?</button>
            </div>

            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ y: 0, scale: 0.98 }}
              transition={spring}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full py-3 font-semibold shadow-lg shadow-purple-500/30 transition-all"
            >
              Log in
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
